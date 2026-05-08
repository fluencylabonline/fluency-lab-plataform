import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchUsersAction, searchStudentsAction } from "../user.actions";
import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "../user.service";
import { createMockUser } from "./test-utils";

// Mocks
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../user.service", () => ({
  userService: {
    searchUsers: vi.fn().mockResolvedValue([{ id: "u-1", name: "User 1", email: "u1@test.com", taxId: "123" }]),
    searchStudents: vi.fn().mockResolvedValue([{ id: "s-1", name: "Student 1", email: "s1@test.com", cellphone: "999", taxId: "456" }]),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("User Module - IDOR & Data Leakage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[RBAC/IDOR] Student SHOULD NOT be able to search all users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "student-id", role: "student" }));
    
    const result = await searchUsersAction({ term: "any" });
    
    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(false);
    expect(data?.error).toBe("UNAUTHORIZED");
    expect(userService.searchUsers).not.toHaveBeenCalled();
  });

  it("[Data Leakage] searchStudentsAction SHOULD NOT return sensitive fields (taxId, cellphone)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "teacher-id", role: "teacher" }));
    
    const result = await searchStudentsAction({ term: "student" });
    
    const data = result.data as { success?: boolean; data?: Record<string, unknown>[] };
    expect(data?.success).toBe(true);
    const students = data?.data as Record<string, unknown>[]; 
    
    expect(students[0]).toHaveProperty("id");
    expect(students[0]).toHaveProperty("name");
    expect(students[0]).toHaveProperty("email");
    // Sensitive fields should be absent
    expect(students[0]).not.toHaveProperty("taxId");
    expect(students[0]).not.toHaveProperty("cellphone");
    expect(students[0]).not.toHaveProperty("pixKey");
  });

  it("[RBAC] Admin SHOULD be able to search all users and get raw data (Internal check)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin" }));
    
    const result = await searchUsersAction({ term: "any" });
    
    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(true);
    expect(userService.searchUsers).toHaveBeenCalledWith("any");
  });
});

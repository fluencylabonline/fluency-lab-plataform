import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTeachersAction, revealSensitiveDataAction } from "../user.actions";
import { getCurrentUser, verifySudoMode } from "@/lib/auth-server";
import { createMockUser } from "./test-utils";

// Mock dependencies
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
  verifySudoMode: vi.fn(),
}));

vi.mock("../user.service", () => ({
  userService: {
    getAllTeachers: vi.fn().mockResolvedValue([]),
    getUserById: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("User RBAC - user.actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[RBAC] Student SHOULD be able to get teachers list", async () => {
    // Setup student session
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "student-id",
      role: "student",
      email: "student@test.com",
      name: "Student User",
    }));

    const result = await getTeachersAction({});
    const data = result.data as { success: boolean } | undefined;
    
    // Should not have authorization error
    expect(result.serverError).toBeUndefined();
    expect(data?.success).toBe(true);
  });

  it("[RBAC] Student SHOULD NOT be able to reveal sensitive data (admin only)", async () => {
    // Setup student session
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "student-id",
      role: "student",
      email: "student@test.com",
      name: "Student User",
    }));

    const result = await revealSensitiveDataAction({
      userId: "some-user-id",
      field: "taxId",
    });

    // Should return unauthorized error from adminAction middleware
    expect(result.serverError).toBe("unauthorized");
    expect(result.data).toBeUndefined();
  });

  it("[RBAC] Admin SHOULD be able to reveal sensitive data with sudo mode", async () => {
    // Setup admin session
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "admin-id",
      role: "admin",
      email: "admin@test.com",
      name: "Admin User",
    }));

    vi.mocked(verifySudoMode).mockResolvedValue(true);

    const result = await revealSensitiveDataAction({
      userId: "target-user-id",
      field: "taxId",
      password: "valid-password",
    });

    // Should work (might fail in service but not in authorization)
    // Here we just care it passed the adminAction check
    expect(result.serverError).toBeUndefined();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchStudentsAction, syncUserAction, requestNewInviteAction, revealSensitiveDataAction, requestStudentDeactivationAction } from "../user.actions";
import { getCurrentUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createMockUser } from "./test-utils";

// Mock dependencies
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
  hasPermission: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("../user.service", () => ({
  userService: {
    searchStudents: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("User Rate Limit - Search Abuse Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[RATELIMIT] SHOULD return rateLimitExceeded when limit is reached in searchStudentsAction", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "manager-uuid",
      role: "manager",
      email: "manager@test.com",
    }));

    // Mock rate limit failure
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
    });

    // We expect the action to throw or return error depending on safe-action setup
    // Since searchStudentsAction uses throw Error("RATE_LIMIT_EXCEEDED")
    // and safe-action masks it, we check the returned data.
    
    const result = await searchStudentsAction({
      term: "John",
    });

    const data = result.data as { success: boolean; error?: string };
    expect(data?.success).toBe(false);
    expect(data?.error).toBe("rateLimitExceeded");
  });

  it("[RATELIMIT] SHOULD allow search when limit is NOT reached", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "manager-uuid",
      role: "manager",
      email: "manager@test.com",
    }));

    // Mock rate limit success
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      remaining: 9,
    });

    const { userService } = await import("../user.service");
    vi.mocked(userService.searchStudents).mockResolvedValue([
      { id: "1", name: "John Doe", email: "john@test.com", photoUrl: null } as never
    ]);

    const result = await searchStudentsAction({
      term: "John",
    });

    const data = result.data as { success: boolean; data?: unknown[] };
    expect(data?.success).toBe(true);
    expect(Array.isArray(data?.data)).toBe(true);
  });
});

describe("User Rate Limit - Broad Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[RATELIMIT] syncUserAction SHOULD respect rate limits", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "u-1" }));
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0 });
    
    const result = await syncUserAction({ name: "New Name" });
    const payload = result?.data as { success: boolean; error?: string };
    expect(payload?.success).toBe(false);
    expect(payload?.error).toBe("rateLimitExceeded");
  });

  it("[RATELIMIT] requestNewInviteAction SHOULD respect rate limits", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0 });
    
    const result = await requestNewInviteAction({ email: "test@test.com", locale: "pt" });
    const payload = result?.data as { success: boolean; error?: string };
    expect(payload?.success).toBe(false);
    expect(payload?.error).toBe("rateLimitExceeded");
  });

  it("[RATELIMIT] revealSensitiveDataAction SHOULD respect rate limits", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin" }));
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0 });
    
    const result = await revealSensitiveDataAction({ userId: "u-1", field: "taxId", password: "pwd" });
    const payload = result?.data as { success: boolean; error?: string };
    expect(payload?.success).toBe(false);
    expect(payload?.error).toBe("rateLimitExceeded");
  });

  it("[RATELIMIT] requestStudentDeactivationAction SHOULD respect rate limits", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin" }));
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0 });
    
    const result = await requestStudentDeactivationAction({ userId: "u-1", password: "pwd" });
    const payload = result?.data as { success: boolean; error?: string };
    expect(payload?.success).toBe(false);
    expect(payload?.error).toBe("rateLimitExceeded");
  });
});

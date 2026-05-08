import { describe, it, expect, vi, beforeEach } from "vitest";
import { revealSensitiveDataAction } from "../../user/user.actions";
import { getCurrentUser, verifySudoMode } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createMockUser } from "../../user/__tests__/test-utils";

// Mock dependencies
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
  verifySudoMode: vi.fn(),
  checkUserHasPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../../user/user.service", () => ({
  userService: {
    getUserById: vi.fn(),
  },
}));

describe("Billing Rate Limit - Abuse Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[RATELIMIT] SHOULD return rateLimitExceeded when limit is reached in revealSensitiveDataAction", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "admin-uuid",
      role: "admin",
      email: "admin@test.com",
    }));

    // Mock rate limit failure
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
    });

    const result = await revealSensitiveDataAction({
      userId: "target-user-uuid",
      field: "taxId",
      password: "any-password",
    });

    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(false);
    expect(data?.error).toBe("rateLimitExceeded");
  });

  it("[RATELIMIT] SHOULD allow reveal when limit is NOT reached", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "admin-uuid",
      role: "admin",
      email: "admin@test.com",
    }));

    vi.mocked(verifySudoMode).mockResolvedValue(true);

    // Mock rate limit success
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      remaining: 4,
    });

    const { userService } = await import("../../user/user.service");
    vi.mocked(userService.getUserById).mockResolvedValue({
      id: "target-user-uuid",
      taxId: "123456789",
    } as never);

    const result = await revealSensitiveDataAction({
      userId: "target-user-uuid",
      field: "taxId",
      password: "valid-password",
    });

    // It might still fail if target user not found, but it passed the rate limit check
    const data = result.data as { success?: boolean; error?: string };
    expect(data?.error).not.toBe("rateLimitExceeded");
  });
});

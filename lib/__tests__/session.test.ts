import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction, logoutAction } from "@/modules/user/user.actions";
import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { userRepository } from "@/modules/user/user.repository";

// Mock dependencies
vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
    createSessionCookie: vi.fn(),
    revokeRefreshTokens: vi.fn(),
  },
}));

vi.mock("@/modules/user/user.repository", () => ({
  userRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
}));

describe("Session Flow - Cookie Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[SESSION] loginAction without MFA SHOULD set session cookie with correct flags", async () => {
    const cookieStore = {
      set: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "user-uuid",
      email: "test@test.com",
    } as unknown as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);

    // Mock existing user for syncUser
    const mockUser = {
      id: "user-uuid",
      email: "test@test.com",
      mfaEnabled: false,
      isActive: true,
    };
    vi.mocked(userRepository.findById).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof userRepository.findById>>);
    vi.mocked(userRepository.upsert).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof userRepository.upsert>>);

    vi.mocked(adminAuth.createSessionCookie).mockResolvedValue("fake-session-cookie");

    await loginAction({ idToken: "fake-token", rememberMe: true });

    expect(cookieStore.set).toHaveBeenCalledWith(
      "session",
      "fake-session-cookie",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });

  it("[SESSION] loginAction with MFA SHOULD set mfa_pending cookie instead of session", async () => {
    const cookieStore = {
      set: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "user-uuid",
      email: "test@test.com",
    } as unknown as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);

    const mockUserMfa = {
      id: "user-uuid",
      email: "test@test.com",
      mfaEnabled: true,
      isActive: true,
    };
    vi.mocked(userRepository.findById).mockResolvedValue(mockUserMfa as unknown as Awaited<ReturnType<typeof userRepository.findById>>);
    vi.mocked(userRepository.upsert).mockResolvedValue(mockUserMfa as unknown as Awaited<ReturnType<typeof userRepository.upsert>>);

    vi.mocked(adminAuth.createSessionCookie).mockResolvedValue("fake-mfa-cookie");

    const result = await loginAction({ idToken: "fake-token" });

    expect(result.data?.mfaRequired).toBe(true);
    expect(cookieStore.set).toHaveBeenCalledWith(
      "mfa_pending",
      "fake-mfa-cookie",
      expect.objectContaining({
        maxAge: 300,
        httpOnly: true,
      })
    );
    expect(cookieStore.set).not.toHaveBeenCalledWith("session", expect.any(String), expect.any(Object));
  });

  it("[SESSION] logoutAction SHOULD delete both session and mfa_pending cookies", async () => {
    const cookieStore = {
      set: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    };
    vi.mocked(cookies).mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    await logoutAction();

    expect(cookieStore.delete).toHaveBeenCalledWith("session");
    expect(cookieStore.delete).toHaveBeenCalledWith("mfa_pending");
  });
});

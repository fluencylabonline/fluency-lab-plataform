import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction, logoutAction, verifyMfaLoginAction } from "@/modules/user/user.actions";
import { userService } from "@/modules/user/user.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { encrypt, decrypt } from "@/lib/cryptography";
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
  unstable_cache: (fn: unknown) => fn,
  updateTag: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 4 }),
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

    const result = await loginAction({ idToken: "fake-token" });

    expect(result.data?.mfaRequired).toBe(true);
    // Nenhuma sessão é criada antes do TOTP
    expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
    expect(cookieStore.set).toHaveBeenCalledWith(
      "mfa_pending",
      expect.any(String),
      expect.objectContaining({
        maxAge: 300,
        httpOnly: true,
      })
    );
    const pendingValue = vi.mocked(cookieStore.set).mock.calls[0][1] as string;
    expect(pendingValue).not.toContain("fake-token");
    expect(JSON.parse(decrypt(pendingValue))).toEqual({ uid: "user-uuid", idToken: "fake-token" });
    expect(cookieStore.set).not.toHaveBeenCalledWith("session", expect.any(String), expect.any(Object));
  });

  describe("verifyMfaLoginAction", () => {
    const pendingCookie = () => ({ value: encrypt(JSON.stringify({ uid: "user-uuid", idToken: "fake-token" })) });

    function mockCookieStore(pending: { value: string } | undefined) {
      const cookieStore = { set: vi.fn(), delete: vi.fn(), get: vi.fn().mockReturnValue(pending) };
      vi.mocked(cookies).mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
      return cookieStore;
    }

    beforeEach(() => {
      vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({ uid: "user-uuid" } as unknown as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);
      vi.mocked(adminAuth.createSessionCookie).mockResolvedValue("fake-session-cookie");
      vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 4 });
      vi.spyOn(userService, "getUserById").mockResolvedValue({ id: "user-uuid", isActive: true, role: "student" } as unknown as Awaited<ReturnType<typeof userService.getUserById>>);
    });

    it("[SESSION] cria a sessão só depois de um TOTP válido", async () => {
      const cookieStore = mockCookieStore(pendingCookie());
      vi.spyOn(userService, "verifyMfaToken").mockResolvedValue(true);

      const result = await verifyMfaLoginAction({ token: "123456" });

      expect(result.data?.success).toBe(true);
      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith("fake-token", true);
      expect(adminAuth.createSessionCookie).toHaveBeenCalledWith("fake-token", expect.anything());
      expect(cookieStore.set).toHaveBeenCalledWith("session", "fake-session-cookie", expect.any(Object));
      expect(cookieStore.delete).toHaveBeenCalledWith("mfa_pending");
    });

    it("[SESSION] não cria sessão com TOTP inválido", async () => {
      const cookieStore = mockCookieStore(pendingCookie());
      vi.spyOn(userService, "verifyMfaToken").mockResolvedValue(false);

      const result = await verifyMfaLoginAction({ token: "000000" });

      expect(result.data?.error).toBe("invalidToken");
      expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
      expect(cookieStore.set).not.toHaveBeenCalled();
    });

    it("[SESSION] bloqueia após exceder o limite de tentativas", async () => {
      mockCookieStore(pendingCookie());
      vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0 });
      const verifySpy = vi.spyOn(userService, "verifyMfaToken");

      const result = await verifyMfaLoginAction({ token: "123456" });

      expect(checkRateLimit).toHaveBeenCalledWith("mfa_verify", "user-uuid", 5, 5 * 60 * 1000);
      expect(result.data?.error).toBe("tooManyAttempts");
      expect(verifySpy).not.toHaveBeenCalled();
    });

    it("[SESSION] recusa cookie pendente adulterado", async () => {
      mockCookieStore({ value: "not-an-encrypted-value" });

      const result = await verifyMfaLoginAction({ token: "123456" });

      expect(result.data?.error).toBe("sessionExpired");
      expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
    });
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

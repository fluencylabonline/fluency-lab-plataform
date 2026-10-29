import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendPasswordResetConfirmationAction } from "@/modules/user/user.actions";
import { userService } from "@/modules/user/user.service";
import { adminAuth } from "@/lib/firebase-admin";
import { communicationService } from "@/modules/communication/communication.service";

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: { getUser: vi.fn() },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 2 }),
}));

vi.mock("@/modules/communication/communication.service", () => ({
  communicationService: { sendPasswordResetConfirmationEmail: vi.fn() },
}));

vi.mock("@/modules/user/user.repository", () => ({ userRepository: {} }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn, updateTag: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/auth-server", () => ({ getCurrentUser: vi.fn(), verifySudoMode: vi.fn() }));

const USER = { id: "uid-1", email: "aluno@test.com", name: "Aluno" };

function passwordChangedMinutesAgo(minutes: number) {
  vi.mocked(adminAuth.getUser).mockResolvedValue({
    tokensValidAfterTime: new Date(Date.now() - minutes * 60 * 1000).toUTCString(),
  } as unknown as Awaited<ReturnType<typeof adminAuth.getUser>>);
}

describe("sendPasswordResetConfirmationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia o e-mail quando a senha acabou de ser redefinida", async () => {
    vi.spyOn(userService, "getUserByEmail").mockResolvedValue(USER as never);
    passwordChangedMinutesAgo(1);

    const result = await sendPasswordResetConfirmationAction({ email: USER.email });

    expect(result.data).toEqual({ success: true });
    expect(adminAuth.getUser).toHaveBeenCalledWith("uid-1");
    expect(communicationService.sendPasswordResetConfirmationEmail).toHaveBeenCalledWith(USER.email, USER.name, "pt");
  });

  it("não envia quando a senha não mudou recentemente", async () => {
    vi.spyOn(userService, "getUserByEmail").mockResolvedValue(USER as never);
    passwordChangedMinutesAgo(60 * 24);

    const result = await sendPasswordResetConfirmationAction({ email: USER.email });

    expect(result.data).toEqual({ success: true });
    expect(communicationService.sendPasswordResetConfirmationEmail).not.toHaveBeenCalled();
  });

  it("responde igual para e-mail sem conta (sem enumeração)", async () => {
    vi.spyOn(userService, "getUserByEmail").mockResolvedValue(undefined as never);

    const result = await sendPasswordResetConfirmationAction({ email: "ninguem@test.com" });

    expect(result.data).toEqual({ success: true });
    expect(communicationService.sendPasswordResetConfirmationEmail).not.toHaveBeenCalled();
  });
});

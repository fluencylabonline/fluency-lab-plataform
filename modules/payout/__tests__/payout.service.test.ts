/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/env/server", () => ({ env: { ABACATEPAY_PAYOUT_FEE_CENTS: 80 } }));
vi.mock("@/lib/resend", () => ({ resend: { emails: { send: vi.fn() } } }));
vi.mock("@/lib/cryptography", () => ({ decrypt: (v: string) => v }));
vi.mock("../../communication/templates/TeacherPayoutEmail", () => ({ default: () => null }));
vi.mock("../../finance/finance.service", () => ({ financeService: { createTransaction: vi.fn() } }));

vi.mock("@/lib/abacate-pay", () => {
  class PixProviderRejectedError extends Error {}
  return { sendPix: vi.fn(), PixProviderRejectedError };
});

vi.mock("../../user/user.service", () => ({
  userService: {
    getUserById: vi.fn().mockResolvedValue({
      id: "t1", name: "Prof", email: "p@test.com", pixKey: "key", pixType: "email", teacherHourlyRate: 5000,
    }),
  },
}));

vi.mock("../payout.repository", () => ({
  payoutRepository: {
    reservePayout: vi.fn(),
    updatePayout: vi.fn(),
    releasePayoutClasses: vi.fn(),
  },
}));

import { payoutService } from "../payout.service";
import { payoutRepository } from "../payout.repository";
import { sendPix, PixProviderRejectedError } from "@/lib/abacate-pay";

const classes = [
  { id: "c2", teacherHourlyRate: 5000, startAt: new Date(), status: "completed", student: { name: "A" } },
  { id: "c1", teacherHourlyRate: null, startAt: new Date(), status: "completed", student: { name: "B" } },
];

function mockReserveCallingBuild() {
  (payoutRepository.reservePayout as any).mockImplementation(
    async (_t: string, _m: number, _y: number, _s: Date, _e: Date, build: (c: any[]) => any) => {
      const data = build(classes);
      return { payout: { id: "p1", status: "pending", ...data }, classes };
    }
  );
}

describe("payoutService.processPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (payoutRepository.updatePayout as any).mockImplementation(async (id: string, d: any) => ({ id, metadata: {}, ...d }));
  });

  it("reserva antes de enviar o PIX e usa externalId determinístico", async () => {
    mockReserveCallingBuild();
    (sendPix as any).mockResolvedValue({ id: "abc" });

    await payoutService.processPayout("t1", 10, 2026);
    const first = (sendPix as any).mock.calls[0][0];

    await payoutService.processPayout("t1", 10, 2026);
    const second = (sendPix as any).mock.calls[1][0];

    expect(first.amount).toBe(10000);
    expect(first.externalId).toMatch(/^payout-t1-2026-11-[0-9a-f]{16}$/);
    expect(second.externalId).toBe(first.externalId);
    expect((payoutRepository.reservePayout as any).mock.invocationCallOrder[0])
      .toBeLessThan((sendPix as any).mock.invocationCallOrder[0]);
    expect(payoutRepository.updatePayout).toHaveBeenCalledWith("p1", { status: "completed", abacatePayoutId: "abc" });
  });

  it("não envia PIX quando a reserva falha (outra execução já pegou as aulas)", async () => {
    (payoutRepository.reservePayout as any).mockRejectedValue(new Error("As aulas do período mudaram"));
    await expect(payoutService.processPayout("t1", 10, 2026)).rejects.toThrow("mudaram");
    expect(sendPix).not.toHaveBeenCalled();
  });

  it("recusa explícita do provedor marca failed e libera as aulas", async () => {
    mockReserveCallingBuild();
    (sendPix as any).mockRejectedValue(new PixProviderRejectedError("chave inválida"));
    await expect(payoutService.processPayout("t1", 10, 2026)).rejects.toThrow("chave inválida");
    expect(payoutRepository.updatePayout).toHaveBeenCalledWith("p1", { status: "failed" });
    expect(payoutRepository.releasePayoutClasses).toHaveBeenCalledWith("p1");
  });

  it("erro de rede mantém o repasse pendente e as aulas vinculadas", async () => {
    mockReserveCallingBuild();
    (sendPix as any).mockRejectedValue(new TypeError("fetch failed"));
    await expect(payoutService.processPayout("t1", 10, 2026)).rejects.toThrow("pendente");
    expect(payoutRepository.updatePayout).not.toHaveBeenCalled();
    expect(payoutRepository.releasePayoutClasses).not.toHaveBeenCalled();
  });
});

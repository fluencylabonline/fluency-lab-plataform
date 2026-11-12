/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const { whereMock } = vi.hoisted(() => ({ whereMock: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    // As duas atualizações rodam dentro de uma transação
    transaction: vi.fn(async (fn: any) =>
      fn({ update: vi.fn(() => ({ set: vi.fn(() => ({ where: whereMock })) })) })
    ),
  },
}));

import { billingRepository } from "../billing.repository";
import { billingService } from "../billing.service";

vi.mock("../../user/user.service", () => ({ userService: {} }));
vi.mock("../../communication/communication.service", () => ({ communicationService: {} }));
vi.mock("../../notification/notification.service", () => ({ notificationService: {} }));
vi.mock("../../settings/settings.service", () => ({ settingsService: {} }));
vi.mock("@/lib/abacate-pay", () => ({ abacate: {}, createPixCharge: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ stripe: {}, createStripeCheckoutSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("cancelar assinatura não apaga a dívida", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancela só pendentes/em atraso com vencimento depois do corte e deixa as vencidas como dívida", async () => {
    // Corte = último vencimento que já conta como vencido (antes de hoje em Brasília)
    const cutoff = new Date("2026-11-09T23:59:59.999Z");
    await billingRepository.cancelInstallmentsDueAfter("sub-1", cutoff);

    expect(whereMock).toHaveBeenCalledTimes(2);

    // 1) cancela: status em (pendente, em atraso), vencimento estritamente depois do corte
    const cancel = new PgDialect().sqlToQuery(whereMock.mock.calls[0][0]);
    expect(cancel.sql).toMatch(/"status" in \(\$\d+, \$\d+\)/);
    expect(cancel.params).toEqual(expect.arrayContaining(["sub-1", "pending", "overdue"]));
    expect(cancel.sql).toMatch(/"due_date" > \$\d+/);
    expect(cancel.params.some((p: any) => p instanceof Date || (typeof p === "string" && p.startsWith("2026-11-09")))).toBe(true);

    // 2) dívida que ficou: só as "pendentes" já vencidas viram "em atraso" (nunca "paid")
    const keep = new PgDialect().sqlToQuery(whereMock.mock.calls[1][0]);
    expect(keep.sql).toMatch(/"status" = \$\d+/);
    expect(keep.sql).toMatch(/"due_date" <= \$\d+/);
    expect(keep.params).toEqual(expect.arrayContaining(["sub-1", "pending"]));
    expect(keep.params).not.toContain("paid");
  });

  it("updateSubscription(cancelled) usa o corte do dia civil de Brasília", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 22:00 em Brasília de 10/11 = 01:00Z de 11/11: hoje é 10/11, então só o que venceu até 09/11 é dívida
    vi.setSystemTime(new Date("2026-11-11T01:00:00Z"));
    const spy = vi.spyOn(billingRepository, "cancelInstallmentsDueAfter").mockResolvedValue();
    vi.spyOn(billingRepository, "updateSubscription").mockResolvedValue();

    await billingService.updateSubscription("sub-1", { status: "cancelled" });

    expect(spy).toHaveBeenCalledWith("sub-1", new Date("2026-11-09T23:59:59.999Z"));
    vi.useRealTimers();
  });
});

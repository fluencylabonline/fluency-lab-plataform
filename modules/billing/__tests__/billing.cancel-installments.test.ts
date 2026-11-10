/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

const { whereMock } = vi.hoisted(() => ({ whereMock: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: whereMock })) })),
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

  it("só cancela parcelas pendentes/em atraso com vencimento no futuro", async () => {
    const now = new Date("2026-11-10T15:00:00Z");
    await billingRepository.cancelInstallmentsDueAfter("sub-1", now);

    const condition = whereMock.mock.calls[0][0];
    const { sql, params } = new PgDialect().sqlToQuery(condition);

    // status em (pendente, em atraso): nunca "paid" nem o que já foi cancelado
    expect(sql).toMatch(/"status" in \(\$\d+, \$\d+\)/);
    expect(params).toEqual(expect.arrayContaining(["sub-1", "pending", "overdue"]));
    // vencimento estritamente depois de "agora": parcela já vencida fica de fora
    expect(sql).toMatch(/"due_date" > \$\d+/);
    expect(params.some((p: any) => p instanceof Date || (typeof p === "string" && p.startsWith("2026-11-10")))).toBe(true);
  });

  it("updateSubscription(cancelled) usa a regra de parcelas futuras", async () => {
    const spy = vi.spyOn(billingRepository, "cancelInstallmentsDueAfter").mockResolvedValue();
    vi.spyOn(billingRepository, "updateSubscription").mockResolvedValue();

    await billingService.updateSubscription("sub-1", { status: "cancelled" });

    expect(spy).toHaveBeenCalledWith("sub-1", expect.any(Date));
  });
});

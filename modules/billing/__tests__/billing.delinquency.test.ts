/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: { query: {}, update: vi.fn(), insert: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/abacate-pay", () => ({ abacate: {}, createPixCharge: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { retrieve: vi.fn(), expire: vi.fn() } }, paymentIntents: { retrieve: vi.fn() } },
  createStripeCheckoutSession: vi.fn(),
}));

vi.mock("../billing.repository", () => ({
  billingRepository: {
    findUnpaidInstallmentsDueBefore: vi.fn(),
    findUnpaidInstallmentsOfActiveSubscription: vi.fn(),
    findInstallmentWithDetails: vi.fn(),
    findInstallmentById: vi.fn(),
    findInstallmentsInDateRange: vi.fn().mockResolvedValue([]),
    updateInstallment: vi.fn(),
    cancelInstallmentsDueAfter: vi.fn(),
    createAuditLog: vi.fn(),
    findSubscriptionById: vi.fn(),
    updateSubscription: vi.fn(),
  },
}));

vi.mock("../../user/user.service", () => ({
  userService: {
    getUser: vi.fn(),
    getUsersByRole: vi.fn().mockResolvedValue([{ id: "admin-1", name: "Admin", email: "admin@test.com", isActive: true }]),
    getActiveAdminsAndManagers: vi.fn().mockResolvedValue([]),
    updateUser: vi.fn(),
  },
}));

vi.mock("../../communication/communication.service", () => ({
  communicationService: {
    sendBillingOverdueEmail: vi.fn(),
    sendPaymentOverdueWhatsApp: vi.fn(),
    sendDelinquencyEmail: vi.fn().mockResolvedValue(true),
    sendDelinquencyStudentWhatsApp: vi.fn(),
    sendTeacherDelinquencyWhatsApp: vi.fn(),
    sendAccountCancelledDelinquencyWhatsApp: vi.fn(),
  },
}));

vi.mock("../../notification/notification.service", () => ({
  notificationService: { sendNotification: vi.fn() },
}));

vi.mock("../../scheduling/scheduling.service", () => ({
  schedulingService: {
    getStudentTeacherIds: vi.fn().mockResolvedValue(["teacher-1"]),
    cancelFutureClassesForStudent: vi.fn(),
  },
}));

vi.mock("../../contract/contract.service", () => ({
  contractService: { getContractBySubscriptionId: vi.fn(), finalizeCancellation: vi.fn() },
}));

import { env } from "@/env";
import { billingService } from "../billing.service";
import { billingRepository } from "../billing.repository";
import { userService } from "../../user/user.service";
import { communicationService } from "../../communication/communication.service";
import { contractService } from "../../contract/contract.service";

const student = { id: "student-1", name: "Aluno", email: "aluno@test.com", cellphone: "11999999999", isActive: true, locale: "pt" };
const teacher = { id: "teacher-1", name: "Prof", email: "prof@test.com", cellphone: "11888888888", isActive: true, locale: "pt" };

function makeInstallment(overrides: Record<string, any> = {}) {
  return {
    id: "inst-1",
    subscriptionId: "sub-1",
    status: "overdue",
    dueDate: new Date("2026-11-10T00:00:00Z"),
    amount: 16500,
    abacatePayBillingId: "bill_1",
    stripePaymentIntentId: null,
    pixPayload: "000201PIX",
    pixImage: "data:image/png;base64,xx",
    // Código válido por bastante tempo: ensureValidPayment não precisa regenerar.
    paymentExpiresAt: new Date("2027-06-01T00:00:00Z"),
    notifiedOverdueAt: new Date("2026-11-11T03:00:00Z"),
    lastOverdueReminderAt: new Date("2026-11-11T03:00:00Z"),
    overdueReminderCount: 1,
    notifiedFinalWarningAt: null,
    notifiedCancelWarningAt: null,
    blockedAt: null,
    subscription: {
      id: "sub-1",
      studentId: student.id,
      status: "active",
      student,
      plan: { currency: "BRL", durationMonths: 12, name: "Plano" },
    },
    ...overrides,
  };
}

/** Roda o cron "às 00:00 de Brasília" do dia informado. */
async function runOn(isoDate: string, installments: any[]) {
  const now = new Date(`${isoDate}T03:00:00Z`);
  vi.setSystemTime(now);
  (billingRepository.findUnpaidInstallmentsDueBefore as any).mockResolvedValue(installments);
  (billingRepository.findInstallmentWithDetails as any).mockImplementation(async (id: string) =>
    installments.find((i) => i.id === id)
  );
  await billingService.processDelinquency(now);
}

describe("Billing Service — política de inadimplência", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    (env as any).DELINQUENCY_POLICY_START = "2026-11-01";
    (env as any).DELINQUENCY_AUTO_CANCEL_ENABLED = false;
    (userService.getUser as any).mockImplementation(async (id: string) => (id === teacher.id ? teacher : student));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("lembretes de 3 em 3 dias", () => {
    it("envia lembrete quando passaram 3 dias do último", async () => {
      await runOn("2026-11-14", [makeInstallment()]);

      expect(communicationService.sendBillingOverdueEmail).toHaveBeenCalledTimes(1);
      expect(communicationService.sendPaymentOverdueWhatsApp).toHaveBeenCalledWith(
        expect.objectContaining({ pixPayload: "000201PIX" }),
        "pt"
      );
      expect(billingRepository.updateInstallment).toHaveBeenCalledWith(
        "inst-1",
        expect.objectContaining({ overdueReminderCount: 2 })
      );
    });

    it("não envia antes de completar 3 dias", async () => {
      await runOn("2026-11-13", [makeInstallment()]);
      expect(communicationService.sendBillingOverdueEmail).not.toHaveBeenCalled();
      expect(billingRepository.updateInstallment).not.toHaveBeenCalled();
    });

    it("só a parcela mais antiga da assinatura gera mensagem ao aluno", async () => {
      const older = makeInstallment({ id: "inst-old" });
      const newer = makeInstallment({ id: "inst-new", dueDate: new Date("2026-11-12T00:00:00Z") });
      await runOn("2026-11-14", [older, newer]);
      expect(communicationService.sendBillingOverdueEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("último dia do mês", () => {
    it("envia aviso final ao aluno e ao professor", async () => {
      await runOn("2026-11-30", [makeInstallment()]);

      const kinds = (communicationService.sendDelinquencyEmail as any).mock.calls.map((c: any[]) => c[1].kind);
      expect(kinds).toContain("studentFinalWarning");
      expect(kinds).toContain("teacherBlockWarning");
      expect(communicationService.sendDelinquencyStudentWhatsApp).toHaveBeenCalledWith(
        "payment_final_warning_v1",
        expect.objectContaining({ pixPayload: "000201PIX" }),
        "pt"
      );
      expect(communicationService.sendTeacherDelinquencyWhatsApp).toHaveBeenCalledWith(
        teacher.cellphone,
        "pt",
        expect.objectContaining({ kind: "block", blockDate: "01/12/2026" })
      );
      expect(billingRepository.updateInstallment).toHaveBeenCalledWith(
        "inst-1",
        expect.objectContaining({ notifiedFinalWarningAt: expect.any(Date) })
      );
    });

    it("não repete o aviso final", async () => {
      await runOn("2026-11-30", [makeInstallment({ notifiedFinalWarningAt: new Date("2026-11-30T03:00:00Z") })]);
      expect(communicationService.sendDelinquencyEmail).not.toHaveBeenCalled();
      expect(communicationService.sendBillingOverdueEmail).not.toHaveBeenCalled();
    });

    it("parcela anterior à política só recebe lembrete comum, sem aviso de bloqueio", async () => {
      await runOn("2026-10-31", [makeInstallment({
        dueDate: new Date("2026-10-10T00:00:00Z"),
        lastOverdueReminderAt: new Date("2026-10-25T03:00:00Z"),
      })]);
      expect(communicationService.sendDelinquencyEmail).not.toHaveBeenCalled();
      expect(communicationService.sendBillingOverdueEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("mês de bloqueio", () => {
    it("registra o bloqueio no dia 1", async () => {
      await runOn("2026-12-01", [makeInstallment({ notifiedFinalWarningAt: new Date("2026-11-30T03:00:00Z"), lastOverdueReminderAt: new Date("2026-11-30T03:00:00Z") })]);
      expect(billingRepository.updateInstallment).toHaveBeenCalledWith(
        "inst-1",
        expect.objectContaining({ blockedAt: expect.any(Date) })
      );
    });

    it("avisa no último dia do mês de bloqueio que a matrícula será cancelada", async () => {
      await runOn("2026-12-31", [makeInstallment({ blockedAt: new Date("2026-12-01T03:00:00Z") })]);
      const kinds = (communicationService.sendDelinquencyEmail as any).mock.calls.map((c: any[]) => c[1].kind);
      expect(kinds).toEqual(["studentCancelWarning"]);
      expect(communicationService.sendDelinquencyStudentWhatsApp).toHaveBeenCalledWith(
        "payment_cancel_warning_v1",
        expect.anything(),
        "pt"
      );
    });

    it("aluno com parcela do mês anterior em aberto está bloqueado", async () => {
      vi.setSystemTime(new Date("2026-12-05T15:00:00Z"));
      (billingRepository.findUnpaidInstallmentsOfActiveSubscription as any).mockResolvedValue({
        subscription: { id: "sub-1", plan: { currency: "BRL" } },
        installments: [makeInstallment()],
      });
      expect(await billingService.isStudentBlocked(student.id)).toBe(true);

      vi.setSystemTime(new Date("2026-11-25T15:00:00Z"));
      expect(await billingService.isStudentBlocked(student.id)).toBe(false);
    });

    it("sem DELINQUENCY_POLICY_START ninguém é bloqueado", async () => {
      (env as any).DELINQUENCY_POLICY_START = undefined;
      vi.setSystemTime(new Date("2026-12-05T15:00:00Z"));
      expect(await billingService.isStudentBlocked(student.id)).toBe(false);
      expect(billingRepository.findUnpaidInstallmentsOfActiveSubscription).not.toHaveBeenCalled();
    });

    it("lista os alunos bloqueados no dia seguinte (cancelamento de aulas)", async () => {
      (billingRepository.findUnpaidInstallmentsDueBefore as any).mockResolvedValue([makeInstallment()]);
      // Rodada das 21h do dia 30/11: amanhã (01/12) o aluno estará bloqueado
      expect(await billingService.getStudentIdsBlockedOn({ year: 2026, month: 11, day: 1 })).toEqual([student.id]);
    });
  });

  describe("cancelamento automático", () => {
    it("com a flag desligada só avisa os admins", async () => {
      await runOn("2027-01-01", [makeInstallment({ blockedAt: new Date("2026-12-01T03:00:00Z") })]);
      expect(contractService.finalizeCancellation).not.toHaveBeenCalled();
      expect(communicationService.sendDelinquencyEmail).toHaveBeenCalledWith(
        "admin@test.com",
        expect.objectContaining({ kind: "staffAutoCancelPreview" }),
        "pt"
      );
    });

    it("com a flag ligada cancela a matrícula sem multa", async () => {
      (env as any).DELINQUENCY_AUTO_CANCEL_ENABLED = true;
      (contractService.getContractBySubscriptionId as any).mockResolvedValue({ id: "contract-1" });
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: "PENDING" } }) }));

      await runOn("2027-01-01", [makeInstallment({ blockedAt: new Date("2026-12-01T03:00:00Z") })]);

      expect(billingRepository.cancelInstallmentsDueAfter).toHaveBeenCalledWith("sub-1", expect.any(Date));
      expect(contractService.finalizeCancellation).toHaveBeenCalledWith("contract-1");
      expect(communicationService.sendDelinquencyEmail).toHaveBeenCalledWith(
        student.email,
        expect.objectContaining({ kind: "studentAccountCancelled" }),
        "pt"
      );
      vi.unstubAllGlobals();
    });
  });

  describe("validade do código antes de enviar", () => {
    it("PIX vencido e já pago no gateway: dá baixa e não envia lembrete", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: "PAID" } }) }));
      const markPaid = vi.spyOn(billingService, "markInstallmentAsPaid").mockResolvedValue({ success: true });

      await runOn("2026-11-14", [makeInstallment({ paymentExpiresAt: new Date("2026-11-13T00:00:00Z") })]);

      expect(markPaid).toHaveBeenCalledWith("inst-1", "bill_1");
      expect(communicationService.sendBillingOverdueEmail).not.toHaveBeenCalled();
      markPaid.mockRestore();
      vi.unstubAllGlobals();
    });

    it("PIX vencido e não pago: gera outro sem notificar e envia o novo código", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: "EXPIRED" } }) }));
      const generate = vi.spyOn(billingService, "generateInvoiceForInstallment").mockResolvedValue(undefined);
      (billingRepository.findInstallmentById as any).mockResolvedValue({ id: "inst-1", pixPayload: "NOVO_PIX", pixImage: "img" });

      await runOn("2026-11-14", [makeInstallment({ paymentExpiresAt: new Date("2026-11-13T00:00:00Z") })]);

      expect(generate).toHaveBeenCalledWith("inst-1", true, { notify: false });
      expect(communicationService.sendPaymentOverdueWhatsApp).toHaveBeenCalledWith(
        expect.objectContaining({ pixPayload: "NOVO_PIX" }),
        "pt"
      );
      generate.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});

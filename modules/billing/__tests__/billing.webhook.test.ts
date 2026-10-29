import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { billingService } from "../billing.service";
import { billingRepository } from "../billing.repository";

vi.mock("../billing.repository", () => ({
  billingRepository: {
    findInstallmentById: vi.fn(),
    findSubscriptionById: vi.fn(),
  },
}));

const CHARGE_ID = "pix_char_abc";
const INST_ID = "11111111-1111-4111-8111-111111111111";
const SUB_ID = "22222222-2222-4222-8222-222222222222";

function paidEvent(metadata: Record<string, unknown>, id = CHARGE_ID) {
  return { id: "log_1", event: "transparent.completed", data: { transparent: { id, metadata } } };
}

function mockGateway(status: string, ok = true, id = CHARGE_ID) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    json: async () => ({ success: true, data: { id, status } }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("AbacatePay webhook: confirmação no gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(billingService, "markInstallmentAsPaid").mockResolvedValue(undefined as never);
    vi.spyOn(billingService, "confirmCancellationFeePayment").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("dá baixa quando a cobrança é da parcela e está paga no AbacatePay", async () => {
    vi.mocked(billingRepository.findInstallmentById).mockResolvedValue({ id: INST_ID, abacatePayBillingId: CHARGE_ID } as never);
    const fetchMock = mockGateway("PAID");

    await billingService.processWebhook(paidEvent({ installmentId: INST_ID }));

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`check?id=${CHARGE_ID}`), expect.anything());
    expect(billingService.markInstallmentAsPaid).toHaveBeenCalledWith(INST_ID, CHARGE_ID);
  });

  it("ignora quando o AbacatePay diz que a cobrança não está paga", async () => {
    vi.mocked(billingRepository.findInstallmentById).mockResolvedValue({ id: INST_ID, abacatePayBillingId: CHARGE_ID } as never);
    mockGateway("PENDING");

    await billingService.processWebhook(paidEvent({ installmentId: INST_ID }));

    expect(billingService.markInstallmentAsPaid).not.toHaveBeenCalled();
  });

  it("ignora cobrança paga que pertence a outra parcela", async () => {
    vi.mocked(billingRepository.findInstallmentById).mockResolvedValue({ id: INST_ID, abacatePayBillingId: "pix_char_other" } as never);
    const fetchMock = mockGateway("PAID");

    await billingService.processWebhook(paidEvent({ installmentId: INST_ID }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(billingService.markInstallmentAsPaid).not.toHaveBeenCalled();
  });

  it("lança erro quando a consulta ao AbacatePay falha, para o evento ser reenviado", async () => {
    vi.mocked(billingRepository.findInstallmentById).mockResolvedValue({ id: INST_ID, abacatePayBillingId: CHARGE_ID } as never);
    mockGateway("PAID", false);

    await expect(billingService.processWebhook(paidEvent({ installmentId: INST_ID }))).rejects.toThrow();
    expect(billingService.markInstallmentAsPaid).not.toHaveBeenCalled();
  });

  it("confirma a taxa de cancelamento só se a cobrança for a da assinatura e estiver paga", async () => {
    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({ id: SUB_ID, cancellationFeeInstallmentId: CHARGE_ID } as never);
    mockGateway("PAID");

    await billingService.processWebhook(paidEvent({ subscriptionId: SUB_ID, type: "cancellation_fee" }));

    expect(billingService.confirmCancellationFeePayment).toHaveBeenCalledWith(SUB_ID);
  });

  it("ignora taxa de cancelamento com cobrança de outra assinatura", async () => {
    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({ id: SUB_ID, cancellationFeeInstallmentId: "pix_char_other" } as never);
    mockGateway("PAID");

    await billingService.processWebhook(paidEvent({ subscriptionId: SUB_ID, type: "cancellation_fee" }));

    expect(billingService.confirmCancellationFeePayment).not.toHaveBeenCalled();
  });
});

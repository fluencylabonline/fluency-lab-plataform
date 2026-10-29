// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";
import { stripe } from "@/lib/stripe";
import { billingService } from "../billing.service";

vi.mock("@/env", () => ({ env: { STRIPE_WEBHOOK_SECRET: "whsec_test" } }));
vi.mock("@/lib/stripe", () => ({ stripe: { webhooks: { constructEvent: vi.fn() } } }));
vi.mock("@/lib/db", () => ({ db: { query: { installmentsTable: { findFirst: vi.fn() } } } }));
vi.mock("../billing.service", () => ({ billingService: { markInstallmentAsPaid: vi.fn() } }));

const INST_ID = "11111111-1111-4111-8111-111111111111";

function sendEvent(type: string, paymentStatus: string) {
  vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
    id: "evt_1",
    type,
    data: { object: { id: "cs_1", payment_intent: "pi_1", payment_status: paymentStatus, metadata: { installmentId: INST_ID } } },
  } as never);
  return POST(new Request("https://www.fluencylab.me/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=x" },
    body: "{}",
  }));
}

describe("POST /api/webhooks/stripe — Checkout Session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dá baixa quando a sessão completa já está paga", async () => {
    const res = await sendEvent("checkout.session.completed", "paid");
    expect(res.status).toBe(200);
    expect(billingService.markInstallmentAsPaid).toHaveBeenCalledWith(INST_ID, "pi_1");
  });

  it("não dá baixa quando a sessão completa ainda não foi paga", async () => {
    const res = await sendEvent("checkout.session.completed", "unpaid");
    expect(res.status).toBe(200);
    expect(billingService.markInstallmentAsPaid).not.toHaveBeenCalled();
  });

  it("dá baixa no async_payment_succeeded", async () => {
    await sendEvent("checkout.session.async_payment_succeeded", "paid");
    expect(billingService.markInstallmentAsPaid).toHaveBeenCalledWith(INST_ID, "pi_1");
  });
});

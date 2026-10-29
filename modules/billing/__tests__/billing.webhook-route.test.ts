// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import { POST } from "@/app/api/webhooks/abacatepay/route";
import { billingService } from "../billing.service";

vi.mock("@/env", () => ({
  env: {
    ABACATEPAY_WEBHOOK_SECRET: "test-webhook-secret",
    ABACATEPAY_PUBLIC_KEY: "test-public-key",
  },
}));

vi.mock("../billing.service", () => ({
  billingService: { processWebhook: vi.fn() },
}));

const BODY = JSON.stringify({ id: "log_1", event: "transparent.completed", data: {} });
const SIGNATURE = crypto.createHmac("sha256", "test-public-key").update(BODY).digest("base64");

function webhookRequest(query: string, signature: string | null = SIGNATURE) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature) headers["x-webhook-signature"] = signature;
  return new Request(`https://www.fluencylab.me/api/webhooks/abacatepay${query}`, { method: "POST", headers, body: BODY });
}

describe("POST /api/webhooks/abacatepay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processa o evento com secret e assinatura válidos", async () => {
    const res = await POST(webhookRequest("?webhookSecret=test-webhook-secret"));
    expect(res.status).toBe(200);
    expect(billingService.processWebhook).toHaveBeenCalledOnce();
  });

  it("recusa sem webhookSecret, mesmo com assinatura válida", async () => {
    const res = await POST(webhookRequest(""));
    expect(res.status).toBe(401);
    expect(billingService.processWebhook).not.toHaveBeenCalled();
  });

  it("recusa com webhookSecret errado", async () => {
    const res = await POST(webhookRequest("?webhookSecret=wrong"));
    expect(res.status).toBe(401);
    expect(billingService.processWebhook).not.toHaveBeenCalled();
  });

  it("recusa assinatura calculada com outra chave", async () => {
    const forged = crypto.createHmac("sha256", "test-webhook-secret").update(BODY).digest("base64");
    const res = await POST(webhookRequest("?webhookSecret=test-webhook-secret", forged));
    expect(res.status).toBe(401);
    expect(billingService.processWebhook).not.toHaveBeenCalled();
  });

  it("recusa sem assinatura", async () => {
    const res = await POST(webhookRequest("?webhookSecret=test-webhook-secret", null));
    expect(res.status).toBe(401);
  });
});

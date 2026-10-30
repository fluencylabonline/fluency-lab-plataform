import { NextResponse } from "next/server";
import { billingService } from "@/modules/billing/billing.service";
import { env } from "@/env/server";
import crypto from "node:crypto";

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // 1. Secret do webhook: o AbacatePay envia em ?webhookSecret= (configurado no painel)
  const providedSecret = new URL(req.url).searchParams.get("webhookSecret") ?? "";
  if (!safeEqual(Buffer.from(providedSecret), Buffer.from(env.ABACATEPAY_WEBHOOK_SECRET))) {
    console.error("[AbacatePay Webhook] Unauthorized: invalid webhookSecret.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signature = req.headers.get("x-webhook-signature");

  if (!signature) {
    console.error("[AbacatePay Webhook] Missing x-webhook-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // 2. Assinatura HMAC-SHA256 do corpo, calculada com a chave pública do AbacatePay
  const rawBody = await req.text();

  if (!env.ABACATEPAY_PUBLIC_KEY) {
    console.error("[AbacatePay Webhook] ABACATEPAY_PUBLIC_KEY não configurada.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const expected = crypto.createHmac("sha256", env.ABACATEPAY_PUBLIC_KEY).update(rawBody).digest();
  const sigBuffer = signature.length === 64 && /^[0-9a-fA-F]+$/.test(signature)
    ? Buffer.from(signature, "hex")
    : Buffer.from(signature, "base64");

  if (!safeEqual(sigBuffer, expected)) {
    console.error("[AbacatePay Webhook] Unauthorized: Invalid signature.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);

    console.log(`[AbacatePay Webhook] Event: ${event.event} | ID: ${event.id}`);

    // 3. Process the event in the service
    await billingService.processWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[AbacatePay Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

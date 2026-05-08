import { NextResponse } from "next/server";
import { billingService } from "@/modules/billing/billing.service";
import { env } from "@/env";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const signature = req.headers.get("x-webhook-signature");
  
  if (!signature) {
    console.error("[AbacatePay Webhook] Missing x-webhook-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // 1. Signature validation logic
  const rawBody = await req.text();
  const webhookSecret = env.ABACATEPAY_WEBHOOK_SECRET;

  // Calculate expected signatures
  const hmacBase64 = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("base64");
  const hmacHex = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  const sigBuffer = Buffer.from(signature);
  const isBase64Valid =
    sigBuffer.length === Buffer.from(hmacBase64).length &&
    crypto.timingSafeEqual(sigBuffer, Buffer.from(hmacBase64));
  const isHexValid =
    sigBuffer.length === Buffer.from(hmacHex).length &&
    crypto.timingSafeEqual(sigBuffer, Buffer.from(hmacHex));

  if (!isBase64Valid && !isHexValid) {
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

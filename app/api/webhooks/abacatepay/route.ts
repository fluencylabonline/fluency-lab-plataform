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

  // Try all possible candidate keys in the system for maximum resilience
  const candidateKeys = [
    env.ABACATEPAY_WEBHOOK_SECRET,
    env.ABACATEPAY_PUBLIC_KEY,
    env.ABACATEPAY_API_KEY,
  ].filter((key): key is string => !!key);

  let sigBuffer: Buffer;
  try {
    // Attempt to parse based on length and hexadecimal characters
    if (signature.length === 64 && /^[0-9a-fA-F]+$/.test(signature)) {
      sigBuffer = Buffer.from(signature, "hex");
    } else {
      sigBuffer = Buffer.from(signature, "base64");
    }
  } catch (e) {
    console.error("[AbacatePay Webhook] Failed to parse signature from header:", e);
    return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
  }

  let isValid = false;
  let matchingKeyIndex = -1;

  for (let i = 0; i < candidateKeys.length; i++) {
    const expectedBuffer = crypto
      .createHmac("sha256", candidateKeys[i])
      .update(rawBody)
      .digest();

    if (
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      isValid = true;
      matchingKeyIndex = i;
      break;
    }
  }

  if (!isValid) {
    console.error("[AbacatePay Webhook] Unauthorized: Invalid signature.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const keyNames = ["ABACATEPAY_WEBHOOK_SECRET", "ABACATEPAY_PUBLIC_KEY", "ABACATEPAY_API_KEY"];
  console.log(`[AbacatePay Webhook] Signature verified successfully using key: ${keyNames[matchingKeyIndex]}`);

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

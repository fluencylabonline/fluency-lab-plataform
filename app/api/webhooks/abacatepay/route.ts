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

  // Calculate expected raw Buffer directly
  const expectedBuffer = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest();
  
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

  const isValid =
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer);

  if (!isValid) {
    const maskedSecret = webhookSecret 
      ? `${webhookSecret.substring(0, 4)}...${webhookSecret.substring(webhookSecret.length - 4)}` 
      : "MISSING";
    const expectedHex = expectedBuffer.toString("hex");
    const expectedBase64 = expectedBuffer.toString("base64");

    console.error(
      `[AbacatePay Webhook] Unauthorized: Invalid signature.\n` +
      `- Secret Mask: ${maskedSecret} (len: ${webhookSecret?.length})\n` +
      `- Received Signature: ${signature} (len: ${signature.length})\n` +
      `- Expected Hex: ${expectedHex}\n` +
      `- Expected Base64: ${expectedBase64}\n` +
      `- Raw Body Len: ${rawBody.length}`
    );
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

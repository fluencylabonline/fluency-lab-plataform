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
    // Collect expected hashes for the main webhook secret for logging
    const defaultSecret = env.ABACATEPAY_WEBHOOK_SECRET;
    const defaultExpected = crypto.createHmac("sha256", defaultSecret).update(rawBody).digest();
    const expectedHex = defaultExpected.toString("hex");
    const expectedBase64 = defaultExpected.toString("base64");
    const maskedSecret = defaultSecret 
      ? `${defaultSecret.substring(0, 4)}...${defaultSecret.substring(defaultSecret.length - 4)}` 
      : "MISSING";
    
    // Safely collect headers for logging
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    console.error(
      `[AbacatePay Webhook] Unauthorized: Invalid signature.\n` +
      `- Secret Mask (Default): ${maskedSecret} (len: ${defaultSecret?.length})\n` +
      `- Received Signature: ${signature} (len: ${signature.length})\n` +
      `- Expected Hex (Default): ${expectedHex}\n` +
      `- Expected Base64 (Default): ${expectedBase64}\n` +
      `- Raw Body Len: ${rawBody.length}\n` +
      `- Raw Body: \`${rawBody}\`\n` +
      `- Headers: ${JSON.stringify(headersObj, null, 2)}`
    );
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

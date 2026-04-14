import { NextResponse } from "next/server";
import { billingService } from "@/modules/billing/billing.service";
import { env } from "@/env";
import crypto from "crypto";

export async function POST(req: Request) {
  const signature = req.headers.get("x-webhook-signature");
  
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const rawBody = await req.text();

  try {
    // 1. Verify signature manually using HMAC-SHA256
    const hmac = crypto.createHmac("sha256", env.ABACATEPAY_WEBHOOK_SECRET);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("base64");

    // 2. Use timingSafeEqual to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error("[AbacatePay Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // 3. Process the event in the service
    await billingService.processWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[AbacatePay Webhook] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

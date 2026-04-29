import { NextResponse } from "next/server";
import { billingService } from "@/modules/billing/billing.service";
import { env } from "@/env";
import crypto from "crypto";

export async function POST(req: Request) {
  const signature = req.headers.get("x-webhook-signature");
  
  if (!signature) {
    console.error("[AbacatePay Webhook] Missing x-webhook-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const urlSecret = searchParams.get("webhookSecret");
  
  // 1. Signature validation logic
  const rawBody = await req.text();
  const webhookSecret = env.ABACATEPAY_WEBHOOK_SECRET;

  // Calculate expected signatures
  const hmacBase64 = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("base64");
  const hmacHex = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  const isSignatureValid = signature === hmacBase64 || signature === hmacHex;
  const isDevBypass = process.env.NODE_ENV === "development" && !!urlSecret;

  if (!isSignatureValid && !isDevBypass) {
    console.error("[AbacatePay Webhook] Unauthorized: Invalid signature.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    
    if (isDevBypass) {
      console.log("[AbacatePay Webhook] Processing with development bypass.");
    }

    console.log(`[AbacatePay Webhook] Event: ${event.event} | ID: ${event.id}`);

    // 3. Process the event in the service
    await billingService.processWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[AbacatePay Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

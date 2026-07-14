import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { env } from "@/env";
import { communicationService } from "@/modules/communication/communication.service";
import { communicationRepository } from "@/modules/communication/communication.repository";

export async function POST(req: NextRequest) {
  const webhookSecret = env.RESEND_WEBHOOK_SECRET;

  const rawBody = await req.text();

  if (webhookSecret) {
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("[Resend Webhook] Missing svix headers");
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    try {
      resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: svixId,
          timestamp: svixTimestamp,
          signature: svixSignature,
        },
        webhookSecret,
      });
    } catch (err) {
      console.error("[Resend Webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    console.warn("[Resend Webhook] RESEND_WEBHOOK_SECRET is not configured. Signature verification bypassed.");
  }

  try {
    const event = JSON.parse(rawBody);
    console.log(`[Resend Webhook] Received event: ${event.type}`);

    // Route event types
    switch (event.type) {
      case "email.received":
        await communicationService.processInboundEmailWebhook(event.data);
        break;

      case "email.sent":
      case "email.delivered":
      case "email.opened":
      case "email.bounced":
      case "email.clicked": {
        const emailId = event.data.email_id;
        const status = event.type.replace("email.", ""); // sent, delivered, opened, bounced, clicked
        if (emailId) {
          await communicationRepository.updateEmailStatus(emailId, status, event.data);
        }
        break;
      }

      default:
        console.warn(`[Resend Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Resend Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

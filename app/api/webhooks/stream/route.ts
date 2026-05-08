import { NextResponse } from "next/server";
import { callService } from "@/modules/call/call.service";
import { env } from "@/env";
import crypto from "node:crypto";

/**
 * app/api/webhooks/stream/route.ts
 * Receives events from Stream (transcription, call events, etc.)
 */
export async function POST(req: Request) {
  const signature = req.headers.get("x-signature");

  if (!signature) {
    console.error("[Stream Webhook] Missing x-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const rawBody = await req.text();
  const expectedSignature = crypto
    .createHmac("sha256", env.STREAM_SECRET)
    .update(rawBody)
    .digest("hex");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    console.error("[Stream Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const { type, call_cid, call_transcription } = body;

    console.log(`[Stream Webhook] Received event: ${type}`);

    if (type === "call.transcription_ready") {
      // call_cid is in format "default:callId"
      const streamCallId = call_cid?.split(":")[1];
      const transcriptionUrl = call_transcription?.url;

      if (streamCallId && transcriptionUrl) {
        console.log(`[Stream Webhook] Processing transcription for ${streamCallId}`);
        await callService.handleTranscriptionWebhook(streamCallId, transcriptionUrl);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Stream Webhook] Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

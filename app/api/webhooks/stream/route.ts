import { NextResponse } from "next/server";
import { callService } from "@/modules/call/call.service";

/**
 * app/api/webhooks/stream/route.ts
 * Receives events from Stream (transcription, call events, etc.)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
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

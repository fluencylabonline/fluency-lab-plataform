import { aiRepository } from "@/modules/ai/ai.repository";
import { NextResponse } from "next/server";
import { env } from "@/env";
import crypto from "node:crypto";

/**
 * Daily cleanup job for the AI response cache.
 * Removes entries where expires_at < now.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${env.CRON_SECRET}`;
  const provided = authHeader ?? "";
  const isAuthorized =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await aiRepository.cleanupExpired();
    return NextResponse.json({ 
      success: true, 
      message: "Expired AI cache entries cleaned up successfully." 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[CRON] AI Cache Cleanup Failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}

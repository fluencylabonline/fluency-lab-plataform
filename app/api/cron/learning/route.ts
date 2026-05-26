import { NextResponse } from "next/server";
import { learningService } from "@/modules/learning/learning.service";
import { env } from "@/env";

import crypto from "node:crypto";

/**
 * CRON: Learning & Practice Reminders
 * This route should be called periodically (e.g., every 4 hours)
 * to remind students to practice and protect their streaks.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const provided = (authHeader ?? "").trim();
  const expected = `Bearer ${env.CRON_SECRET.trim()}`;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  const isAuthorized =
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.info("[Cron Learning] Starting practice reminder task...");

    const processed = await learningService.sendPracticeReminders();

    return NextResponse.json({ 
      success: true, 
      processedCount: processed 
    });
  } catch (error) {
    console.error("[Cron Learning] Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

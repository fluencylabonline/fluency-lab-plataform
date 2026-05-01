import { NextResponse } from "next/server";
import { learningService } from "@/modules/learning/learning.service";
import { env } from "@/env";

/**
 * CRON: Learning & Practice Reminders
 * This route should be called periodically (e.g., every 4 hours)
 * to remind students to practice and protect their streaks.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");

  // Validate CRON_SECRET
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
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

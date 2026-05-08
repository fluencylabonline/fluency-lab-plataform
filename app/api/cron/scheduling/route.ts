import { NextResponse } from "next/server";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { env } from "@/env";

import crypto from "node:crypto";

/**
 * CRON: Scheduling Tasks
 * This route is called by a scheduler (e.g., Vercel Cron or GitHub Actions)
 * to perform background maintenance on the scheduling system.
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
    console.info("[Cron Scheduling] Starting maintenance tasks...");

    // 1. Cleanup expired credits
    const expiredCredits = await schedulingService.cleanupExpiredCredits();
    console.info(`[Cron Scheduling] Expired ${expiredCredits.length} credits.`);

    // 2. Materialize future slots (4 weeks ahead)
    const generated = await schedulingService.materializeAllRules(4);

    // 3. Process overdue classes (2h delay)

    const overdue = await schedulingService.processOverdueClasses();

    // 4. Send class reminders (24h / 1h)
    const reminders = await schedulingService.sendClassReminders();

    return NextResponse.json({ 
      success: true, 
      processed: {
        generated,
        expired: expiredCredits.length,
        overdue,
        reminders
      } 
    });
  } catch (error) {
    console.error("[Cron Scheduling] Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

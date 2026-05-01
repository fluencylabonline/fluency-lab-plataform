import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { learningEngagementLogs } from "@/modules/learning/learning.schema";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const targetUrl = searchParams.get("url") || "/hub/student/practice";
  const notificationId = searchParams.get("id");
  const type = searchParams.get("type") || "general";

  const user = await getCurrentUser();

  if (user) {
    try {
      await db.insert(learningEngagementLogs).values({
        studentId: user.id,
        eventType: "notification_click",
        metadata: {
          notificationId,
          targetUrl,
          type,
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (error) {
      console.error("[ClickTracker] Error logging engagement:", error);
    }
  }

  // Always redirect to target, even if logging fails
  return NextResponse.redirect(new URL(targetUrl, req.url));
}

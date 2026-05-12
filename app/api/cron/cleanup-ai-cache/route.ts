import { aiRepository } from "@/modules/ai/ai.repository";
import { NextResponse } from "next/server";

/**
 * Daily cleanup job for the AI response cache.
 * Removes entries where expires_at < now.
 */
export async function POST(req: Request) {
  // Simple check for authorization if CRON_SECRET is set
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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

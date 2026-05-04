import { NextResponse } from "next/server";
import { notebookService } from "@/modules/notebook/notebook.service";

export async function POST(req: Request) {
  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Run Cleanup
    const results = await notebookService.cleanupExpiredAssets();

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Notebook assets cleanup failed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

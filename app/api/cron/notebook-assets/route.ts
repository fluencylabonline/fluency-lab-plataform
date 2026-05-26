import { NextResponse } from "next/server";
import { notebookService } from "@/modules/notebook/notebook.service";
import { env } from "@/env";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
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

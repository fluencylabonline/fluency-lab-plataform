import { NextResponse } from "next/server";
import { notebookService } from "@/modules/notebook/notebook.service";
import { env } from "@/env";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${env.CRON_SECRET}`;
    const provided = authHeader ?? "";
    const isAuthorized =
      provided.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Run Cleanup
    const results = await notebookService.cleanupExpiredNotebooks();

    return NextResponse.json({
      success: true,
      message: "Notebook cleanup completed",
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Notebook cleanup failed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

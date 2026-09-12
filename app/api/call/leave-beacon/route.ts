import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { callService } from "@/modules/call/call.service";

/**
 * POST /api/call/leave-beacon
 *
 * Best-effort call termination for an abrupt teacher tab/browser close,
 * called via navigator.sendBeacon from useStreamVideo's `pagehide` handler.
 * Neither the React unmount cleanup nor the UI's "end call" handler run
 * reliably when the tab is closed, which would otherwise leave the call
 * session orphaned (missing `endedAt` in Neon, `callId` stuck on the
 * student's Firestore doc forever).
 *
 * Student-side tab closes don't hit this endpoint — the call stays active
 * for them to rejoin, so there is nothing to clean up server-side.
 *
 * sendBeacon carries same-origin cookies, so the session cookie is present —
 * the request is still authenticated and scoped to the caller's own call.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await req.json();
    const { callId, studentId, notebookId } = body as {
      callId?: string;
      studentId?: string;
      notebookId?: string;
    };

    if (!callId || !studentId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const session = await callService.getCallByStreamId(callId);
    if (!session) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    if (user.role !== "admin" && session.teacherId !== user.id) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    await callService.endCall(callId, studentId, notebookId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[leave-beacon] Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

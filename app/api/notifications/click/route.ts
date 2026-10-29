import { NextRequest, NextResponse } from "next/server";
import { learningService } from "@/modules/learning/learning.service";
import { getCurrentUser } from "@/lib/auth-server";

const DEFAULT_TARGET = "/hub/student/practice";

// Só aceita caminhos do próprio site: bloqueia redirecionamento para domínios externos
// ("https://…", "//…", "/\\…" e variantes com caracteres de controle).
function resolveSafeTarget(target: string | null, base: string): URL {
  const fallback = new URL(DEFAULT_TARGET, base);
  if (!target || !target.startsWith("/")) return fallback;
  const resolved = new URL(target, base);
  return resolved.origin === fallback.origin ? resolved : fallback;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const target = resolveSafeTarget(searchParams.get("url"), req.url);
  const targetUrl = target.pathname + target.search + target.hash;
  const notificationId = searchParams.get("id");
  const type = searchParams.get("type") || "general";

  const user = await getCurrentUser();

  if (user) {
    try {
      await learningService.logEngagement(user.id, "notification_click", {
        notificationId,
        targetUrl,
        type,
        userAgent: req.headers.get("user-agent"),
      });
    } catch (error) {
      console.error("[ClickTracker] Error logging engagement:", error);
    }
  }

  // Always redirect to target, even if logging fails
  return NextResponse.redirect(target);
}

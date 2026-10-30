import { NextResponse } from "next/server";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { env } from "@/env/server";
import { isQuietHours } from "@/lib/quiet-hours";

import crypto from "node:crypto";

// Cancela as aulas de amanhã dos alunos bloqueados por inadimplência.
// Agendado às 00:00 UTC (21:00 de Brasília) em .github/workflows/blocked-classes-cron.yml.
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

  // Roda às 21h. Se a execução atrasar para dentro do silêncio (00:00-07:00) é
  // ignorada: o "amanhã" já seria outro dia e os avisos sairiam de madrugada.
  if (isQuietHours()) {
    return NextResponse.json({ success: true, skipped: "quiet-hours" });
  }

  try {
    const result = await schedulingService.cancelClassesForBlockedStudents();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Cron Blocked Classes] Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { billingService } from "@/modules/billing/billing.service";
import { env } from "@/env";
import { isQuietHours } from "@/lib/quiet-hours";

import crypto from "node:crypto";

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

  // Mensagens automáticas não saem de madrugada (00:00-07:00, Brasília).
  // Uma execução atrasada ou disparada à mão nesse horário apenas é ignorada;
  // a próxima rodada normal faz o trabalho.
  if (isQuietHours()) {
    return NextResponse.json({ success: true, skipped: "quiet-hours" });
  }

  try {
    await billingService.generatePendingInvoices();
    await billingService.processBillingNotifications();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cron Billing] Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { billingService } from "@/modules/billing/billing.service";
import { env } from "@/env";

import crypto from "node:crypto";

export async function POST(req: Request) {
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

  try {
    await billingService.generatePendingInvoices();
    await billingService.processBillingNotifications();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cron Billing] Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

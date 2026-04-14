import { NextResponse } from "next/server";
import { billingService } from "@/modules/billing/billing.service";
import { env } from "@/env";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");

  // Simple CRON_SECRET check to prevent unauthorized calls
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
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

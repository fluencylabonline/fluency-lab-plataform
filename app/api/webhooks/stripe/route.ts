import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
import { billingService } from "@/modules/billing/billing.service";
import { db } from "@/lib/db";
import { installmentsTable } from "@/modules/billing/billing.schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET in environment");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Stripe Webhook] Error verifying signature: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

      // Find the corresponding installment by stripePaymentIntentId
      const installment = await db.query.installmentsTable.findFirst({
        where: eq(installmentsTable.stripePaymentIntentId, intent.id),
      });

      if (installment) {
        console.log(`[Stripe Webhook] Marking installment ${installment.id} as PAID`);
        await billingService.markInstallmentAsPaid(installment.id, intent.id);
      } else {
        console.warn(`[Stripe Webhook] No installment found for Stripe PaymentIntent ID: ${intent.id}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";

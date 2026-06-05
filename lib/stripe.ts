import Stripe from "stripe";
import { env } from "@/env";

// Ensure the secret key exists before initializing, but handle cases in test gracefully
const stripeSecretKey = env.STRIPE_SECRET_KEY || "mock_secret_key";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as unknown as NonNullable<ConstructorParameters<typeof Stripe>[1]>["apiVersion"],
});

/**
 * Creates and confirms a Stripe PaymentIntent for a Pix payment.
 * Pix PaymentIntents require `confirm: true` and `payment_method_data` to trigger Pix action details.
 */
export async function createStripePixPaymentIntent(params: {
  amount: number; // in cents
  email: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
}) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key (STRIPE_SECRET_KEY) is missing in environment variables.");
  }

  return await stripe.paymentIntents.create({
    amount: params.amount,
    currency: "brl",
    payment_method_types: ["pix"],
    payment_method_data: {
      type: "pix",
    },
    confirm: true,
    return_url: "https://fluencylab.live/onboarding", // Fallback URL required by Stripe
    receipt_email: params.email,
    description: params.description.slice(0, 127), // Stripe limit
    metadata: params.metadata,
  });
}

/**
 * Creates a Stripe Checkout Session for a credit card payment in USD.
 */
export async function createStripeCheckoutSession(params: {
  amount: number; // in cents
  email: string;
  name: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key (STRIPE_SECRET_KEY) is missing in environment variables.");
  }

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: params.description.slice(0, 127),
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: params.email,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });
}


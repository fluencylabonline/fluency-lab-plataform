import { AbacatePay } from "@abacatepay/sdk";
import { env } from "@/env";

if (!env.ABACATEPAY_API_KEY) {
  throw new Error("Missing ABACATEPAY_API_KEY environment variable");
}

/**
 * AbacatePay instance for server-side operations.
 */
export const abacate = AbacatePay({
  secret: env.ABACATEPAY_API_KEY,
});

/**
 * Helper to create a PIX charge using direct REST call to bypass SDK validation bugs.
 * Follows official V2 documentation: { method: "PIX", data: { ... } }
 */
export async function createPixCharge(payload: {
  amount: number;
  description: string;
  expiresIn?: number;
  customer: {
    name: string;
    email: string;
    taxId: string;
    cellphone: string;
  };
  metadata?: Record<string, string>;
}) {
  const res = await fetch("https://api.abacatepay.com/v2/transparents/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.ABACATEPAY_API_KEY}`,
    },
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: payload.amount,
        description: payload.description,
        expiresIn: payload.expiresIn ?? 3600 * 24 * 7, // Default 7 days
        customer: payload.customer,
        metadata: payload.metadata,
      },
    }),
  });

  const result = await res.json();

  if (!result.success) {
    console.error("[AbacatePay] API Error Details:", result.error);
    throw new Error(result.error || "Failed to create PIX checkout");
  }

  return result.data as {
    id: string;
    brCode: string;
    brCodeBase64: string;
    expiresAt: string;
  };
}

/**
 * Helper to send a PIX transfer to a third party (e.g., teacher) using AbacatePay.
 * Docs: POST /pix/send
 */
export async function sendPix(payload: {
  amount: number;
  pixKey: string;
  pixKeyType: string;
  externalId: string;
  description?: string;
}) {
  const res = await fetch("https://api.abacatepay.com/v2/pix/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.ABACATEPAY_API_KEY}`,
    },
    body: JSON.stringify({
      amount: payload.amount,
      externalId: payload.externalId,
      description: payload.description,
      pix: {
        key: payload.pixKey,
        type: payload.pixKeyType,
      },
    }),
  });

  const result = await res.json();

  if (!result.success) {
    console.error("[AbacatePay] Send PIX Error:", result.error);
    throw new Error(result.error || "Failed to send PIX");
  }

  return result.data as {
    id: string;
    amount: number;
    status: string;
    externalId: string;
  };
}

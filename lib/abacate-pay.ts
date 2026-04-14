import { AbacatePay } from "@abacatepay/sdk";
import { env } from "@/env";

if (!env.ABACATEPAY_API_KEY) {
  throw new Error("Missing ABACATEPAY_API_KEY environment variable");
}

/**
 * AbacatePay instance for server-side operations.
 * Following official SDK best practices from skills.
 */
export const abacate = AbacatePay({
  secret: env.ABACATEPAY_API_KEY,
});

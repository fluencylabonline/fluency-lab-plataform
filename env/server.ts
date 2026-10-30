import "server-only";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { env as clientEnv } from "./client";

/**
 * Segredos e configuração do servidor. O `server-only` quebra o build se algum
 * client component (ou algo que ele importe) alcançar este arquivo.
 * Também expõe as variáveis públicas (via `extends`) para código de servidor.
 */
export const env = createEnv({
  extends: [clientEnv],
  server: {
    // Resend
    RESEND_API_KEY: z.string().min(1),
    RESEND_WEBHOOK_SECRET: z.string().optional(),

    // Database
    DATABASE_URL: z.string().url(),

    // Firebase Admin
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_CLIENT_EMAIL: z.string().email(),
    FIREBASE_PRIVATE_KEY: z.string().min(1),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    // Web Push (VAPID)
    VAPID_PUBLIC_KEY: z.string().min(1),
    VAPID_PRIVATE_KEY: z.string().min(1),
    VAPID_SUBJECT: z.string().min(1),

    // Node
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // AbacatePay
    ABACATEPAY_API_KEY: z.string().min(1),
    ABACATEPAY_WEBHOOK_SECRET: z.string().min(1),
    ABACATEPAY_PUBLIC_KEY: z.string().optional(),
    ABACATEPAY_TRANSACTION_FEE_CENTS: z.coerce.number().int().default(80),
    ABACATEPAY_PAYOUT_FEE_CENTS: z.coerce.number().int().default(80),

    // Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Automation
    CRON_SECRET: z.string().min(1),
    // AI & External Services
    GEMINI_API_KEY: z.string().min(1),
    YOUTUBE_API_KEY: z.string().min(1),
    UNSPLASH_ACCESS_KEY: z.string().min(1),
    UNSPLASH_SECRET_KEY: z.string().min(1),

    // Stream Video
    STREAM_SECRET: z.string().min(1),

    // Security
    ENCRYPTION_KEY: z.string().length(64), // 32 bytes in hex

    // WhatsApp Business API
    WHATSAPP_ACCESS_TOKEN: z.string().min(1),
    WHATSAPP_APP_SECRET: z.string().min(1),
    WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
    WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  },
  experimental__runtimeEnv: process.env,
});

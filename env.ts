import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
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
  client: {
    // Firebase Client (public)
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: z.string().min(1),

    // Web Push
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),

    //URL
    NEXT_PUBLIC_APP_URL: z.string().min(1),

    // Stream Video (public API key)
    NEXT_PUBLIC_STREAM_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    // Server
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    NODE_ENV: process.env.NODE_ENV,

    // AbacatePay
    ABACATEPAY_API_KEY: process.env.ABACATEPAY_API_KEY,
    ABACATEPAY_WEBHOOK_SECRET: process.env.ABACATEPAY_WEBHOOK_SECRET,
    ABACATEPAY_PUBLIC_KEY: process.env.ABACATEPAY_PUBLIC_KEY,
    ABACATEPAY_TRANSACTION_FEE_CENTS: process.env.ABACATEPAY_TRANSACTION_FEE_CENTS,
    ABACATEPAY_PAYOUT_FEE_CENTS: process.env.ABACATEPAY_PAYOUT_FEE_CENTS,

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // Automation
    CRON_SECRET: process.env.CRON_SECRET,

    // AI & External Services
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    UNSPLASH_SECRET_KEY: process.env.UNSPLASH_SECRET_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    STREAM_SECRET: process.env.STREAM_SECRET,

    // Client
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STREAM_API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY,
  },
});

import { config } from 'dotenv';
import path from 'path';
import { vi } from 'vitest';

// Load .env.test
config({ path: path.resolve(__dirname, '.env.test') });

// Mock @/env globally to bypass T3 validation during tests
vi.mock('@/env', () => ({
  env: {
    RESEND_API_KEY: 'test',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    FIREBASE_PROJECT_ID: 'test',
    FIREBASE_CLIENT_EMAIL: 'test@test.com',
    FIREBASE_PRIVATE_KEY: 'test',
    GOOGLE_CLIENT_ID: 'test',
    GOOGLE_CLIENT_SECRET: 'test',
    VAPID_PUBLIC_KEY: 'test',
    VAPID_PRIVATE_KEY: 'test',
    VAPID_SUBJECT: 'test',
    NODE_ENV: 'test',
    ABACATEPAY_API_KEY: 'test',
    ABACATEPAY_WEBHOOK_SECRET: 'test',
    CRON_SECRET: 'test',
    GEMINI_API_KEY: 'test',
    UNSPLASH_ACCESS_KEY: 'test',
    UNSPLASH_SECRET_KEY: 'test',
    NEXT_PUBLIC_FIREBASE_API_KEY: 'test',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'test',
    NEXT_PUBLIC_FIREBASE_APP_ID: 'test',
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: 'test',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}));

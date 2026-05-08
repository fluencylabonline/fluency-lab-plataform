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
    VAPID_SUBJECT: 'mailto:test@test.com',
    NODE_ENV: 'test',
    ABACATEPAY_API_KEY: 'test',
    ABACATEPAY_WEBHOOK_SECRET: 'test',
    CRON_SECRET: 'test',
    GEMINI_API_KEY: 'test',
    UNSPLASH_ACCESS_KEY: 'test',
    UNSPLASH_SECRET_KEY: 'test',
    ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
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

// Mock firebase-admin globally to avoid PEM issues in tests
vi.mock('web-push', () => {
  const mock = {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  };
  return { default: mock, ...mock };
});

vi.mock('firebase-admin', () => {
  const admin = {
    apps: [],
    initializeApp: vi.fn(),
    credential: {
      cert: vi.fn(),
    },
    auth: vi.fn(() => ({
      verifyIdToken: vi.fn(),
      createSessionCookie: vi.fn(),
      verifySessionCookie: vi.fn(),
      revokeRefreshTokens: vi.fn(),
      getUser: vi.fn(),
      getUserByEmail: vi.fn(),
      createUser: vi.fn(),
      setCustomUserClaims: vi.fn(),
      generatePasswordResetLink: vi.fn(),
    })),
    firestore: vi.fn(() => ({
      collection: vi.fn(),
      doc: vi.fn(),
      settings: vi.fn(),
    })),
    storage: vi.fn(() => ({
      bucket: vi.fn(),
    })),
  };
  return { default: admin, ...admin };
});


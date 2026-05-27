import admin from "firebase-admin";
import { env } from "@/env";

/**
 * Initialize Firebase Admin SDK.
 * Used exclusively in Server Components, Server Actions, and API Routes.
 */
if (!admin.apps.length) {
  // Safe parsing for Firebase private key (removes surrounding quotes and fixes escaped/unescaped newlines)
  const privateKey = env.FIREBASE_PRIVATE_KEY
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminRtdb = admin.database();
export { admin };


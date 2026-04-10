import admin from "firebase-admin";
import { env } from "@/env";

/**
 * Initialize Firebase Admin SDK.
 * Used exclusively in Server Components, Server Actions, and API Routes.
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export { admin };

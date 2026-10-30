import { initializeApp, getApps, getApp } from "firebase/app";
import { env } from "@/env/client";

/**
 * App cliente do Firebase. Cada serviço (auth, storage, firestore, rtdb) fica
 * no seu próprio módulo para o bundler só incluir o SDK que a tela usa — antes
 * a sidebar importava `rtdb` e levava junto Firestore, Auth e Storage.
 */
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

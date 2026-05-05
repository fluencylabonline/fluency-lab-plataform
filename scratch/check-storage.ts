import admin from "firebase-admin";
import * as dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

async function checkStorage() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  const bucket = admin.storage().bucket();
  console.log("Bucket Name:", bucket.name);

  const [files] = await bucket.getFiles({ prefix: "certificates/" });
  console.log(`Found ${files.length} files in certificates/`);

  for (const file of files.slice(0, 5)) {
    const [metadata] = await file.getMetadata();
    console.log("File:", file.name);
    console.log("Metadata:", JSON.stringify(metadata.metadata, null, 2));
    
    const token = metadata.metadata?.firebaseStorageDownloadTokens;
    if (token) {
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
      console.log("Generated URL:", url);
    } else {
      console.log("No token found for this file.");
    }
    console.log("---");
  }
}

checkStorage().catch(console.error);

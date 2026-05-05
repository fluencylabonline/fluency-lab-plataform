import admin from "firebase-admin";
import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Load .env
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

async function fixCertificates() {
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

  // Initialize DB locally to avoid env.ts validation
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const [files] = await bucket.getFiles({ prefix: "certificates/" });
  console.log(`Found ${files.length} files in certificates/`);

  for (const file of files) {
    const parts = file.name.split("/");
    if (parts.length !== 3) continue;

    const code = parts[2].replace(".pdf", "");
    console.log(`Processing certificate: ${code}`);

    try {
      // 1. Set metadata
      await file.setMetadata({
        metadata: {
          firebaseStorageDownloadTokens: code,
        },
      });
      console.log(`  - Metadata updated for ${code}`);

      // 2. Update DB URL
      const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${code}`;
      
      // Use raw SQL or drizzle without schema
      // Table name is 'certificates'
      // @ts-ignore
      await db.execute(`UPDATE certificates SET pdf_url = '${pdfUrl}' WHERE code = '${code}'`);
      console.log(`  - DB updated for ${code}`);
    } catch (err) {
      console.error(`  - Error processing ${code}:`, err);
    }
    console.log("---");
  }
}

fixCertificates().catch(console.error);

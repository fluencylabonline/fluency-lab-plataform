import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🚀 Starting migration: Create notebook_assets table...");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "notebook_assets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "notebook_id" uuid NOT NULL REFERENCES "notebooks"("id") ON DELETE CASCADE,
        "file_path" text NOT NULL UNIQUE,
        "file_name" text NOT NULL,
        "content_type" text NOT NULL,
        "size_bytes" integer NOT NULL,
        "uploaded_by" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "deleted_at" timestamp
      );
    `;
    console.log("✅ Table 'notebook_assets' created successfully.");
  } catch (error) {
    console.error("❌ Error creating table:", error);
    process.exit(1);
  }
}

main();

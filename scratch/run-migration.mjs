import { neon } from "@neondatabase/serverless";
import fs from "fs";

async function run() {
  const sqlFile = process.argv[2];
  if (!sqlFile) throw new Error("SQL file path required");
  
  const sql = fs.readFileSync(sqlFile, "utf8");
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) throw new Error("DATABASE_URL not found");
  
  const query = neon(connectionString);
  
  console.log(`Executing migration: ${sqlFile}`);
  
  // Drizzle migrations often have multiple statements separated by statement-breakpoint
  const statements = sql.split("--> statement-breakpoint");
  
  for (const statement of statements) {
    if (statement.trim()) {
      await query.query(statement);
    }
  }
  
  console.log("Migration applied successfully!");
}

run().catch(console.error);

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

// Manually parse .env.local to find DATABASE_URL
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
let databaseUrl = "";

for (const line of envContent.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    databaseUrl = line.split("=")[1].trim();
    break;
  }
}

if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

async function main() {
  console.log("Connecting directly to database...");
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    console.log("Connected successfully!");

    // Query installments status count
    const countRes = await client.query("SELECT status, COUNT(*) FROM installments GROUP BY status;");
    console.log("Installment counts by status:", countRes.rows);

    // Query transactions details
    const txRes = await client.query("SELECT id, type, amount, status, category, description FROM transactions;");
    console.log("All transactions in database:", txRes.rows);

  } catch (err) {
    console.error("Database query error:", err);
  } finally {
    await client.end();
  }
}

main();

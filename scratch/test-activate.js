const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_moZjBgq2n3hP@ep-orange-night-amttbcdo.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function main() {
  await client.connect();
  console.log("Starting transaction...");
  await client.query("BEGIN;");
  
  const type = "student";
  const region = "BR";
  const id = "e6841122-cae9-44fe-9867-b167833a1cc7";

  await client.query("UPDATE contract_templates SET is_active = false WHERE type = $1 AND region = $2;", [type, region]);
  const resUpdate = await client.query("UPDATE contract_templates SET is_active = true WHERE id = $1 RETURNING *;", [id]);
  
  await client.query("COMMIT;");
  console.log("Transaction committed!");
  
  console.log("Updated row from RETURNING:");
  console.log(resUpdate.rows[0]);

  const resAll = await client.query("SELECT id, name, type, region, is_active FROM contract_templates ORDER BY created_at DESC;");
  console.log("All rows after transaction:");
  console.log(resAll.rows);

  await client.end();
}

main().catch(console.error);

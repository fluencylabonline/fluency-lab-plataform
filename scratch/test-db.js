const { Client } = require("pg");

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_moZjBgq2n3hP@ep-orange-night-amttbcdo.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT id, name, type, region, is_active FROM contract_templates ORDER BY created_at DESC;");
  console.log("Templates in DB:");
  console.log(res.rows);
  await client.end();
}

main().catch(console.error);

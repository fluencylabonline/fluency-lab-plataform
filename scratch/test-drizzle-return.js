const { Client } = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");
const { eq } = require("drizzle-orm");
const { contractTemplatesTable } = require("../modules/contract/contract.schema");

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_moZjBgq2n3hP@ep-orange-night-amttbcdo.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function main() {
  await client.connect();
  const db = drizzle(client);

  const id = "e6841122-cae9-44fe-9867-b167833a1cc7";
  const [updated] = await db.update(contractTemplatesTable)
    .set({ isActive: true })
    .where(eq(contractTemplatesTable.id, id))
    .returning();

  console.log("Updated row returned by Drizzle:");
  console.log(updated);

  await client.end();
}

main().catch(console.error);

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const contractSchema = require('./modules/contract/contract.schema');

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: contractSchema });

async function main() {
  try {
    const templates = await db.query.contractTemplatesTable.findMany();
    console.log("TEMPLATES IN DB:", JSON.stringify(templates, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();

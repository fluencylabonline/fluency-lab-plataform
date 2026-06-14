import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as contractSchema from '../modules/contract/contract.schema';

if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = ws;
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

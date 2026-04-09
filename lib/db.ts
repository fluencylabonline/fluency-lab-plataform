import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, {
  // Schemas will be added as modules are created.
  // Example: import * as userSchema from "@/modules/user/user.schema";
  // Then pass: schema: { ...userSchema }
});

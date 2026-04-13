import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";

import * as userSchema from "@/modules/user/user.schema";
import * as communicationSchema from "@/modules/communication/communication.schema";

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, {
  schema: { ...userSchema, ...communicationSchema },
});

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as userSchema from "@/modules/user/user.schema";
import * as notificationSchema from "@/modules/notification/notification.schema";
import * as billingSchema from "@/modules/billing/billing.schema";

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, {
  schema: { ...userSchema, ...notificationSchema, ...billingSchema },
});

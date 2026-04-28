import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/env";
import * as userSchema from "@/modules/user/user.schema";
import * as notificationSchema from "@/modules/notification/notification.schema";
import * as billingSchema from "@/modules/billing/billing.schema";
import * as schedulingSchema from "@/modules/scheduling/scheduling.schema";
import * as curriculumSchema from "@/modules/curriculum/curriculum.schema";
import * as learningSchema from "@/modules/learning/learning.schema";
import * as placementSchema from "@/modules/placement/placement.schema";
import * as contractSchema from "@/modules/contract/contract.schema";
import * as payoutSchema from "@/modules/payout/payout.schema";
import * as financeSchema from "@/modules/finance/finance.schema";
import * as courseSchema from "@/modules/course/course.schema";

// Required for Node.js environments when using WebSockets
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, {
  schema: { 
    ...userSchema, 
    ...notificationSchema, 
    ...billingSchema, 
    ...schedulingSchema,
    ...curriculumSchema,
    ...learningSchema,
    ...placementSchema,
    ...contractSchema,
    ...payoutSchema,
    ...financeSchema,
    ...courseSchema,
  },
});

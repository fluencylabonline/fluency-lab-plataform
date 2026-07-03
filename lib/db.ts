import { neonConfig, Pool } from "@neondatabase/serverless";
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
import * as communicationSchema from "@/modules/communication/communication.schema";
import * as notebookSchema from "@/modules/notebook/notebook.schema";
import * as callSchema from "@/modules/call/call.schema";
import * as certificateSchema from "@/modules/certificate/certificate.schema";
import * as taskSchema from "@/modules/task/task.schema";
import * as immersionSchema from "@/modules/immersion/immersion.schema";
import * as audioSchema from "@/modules/audio/audio.schema";
import * as procedureSchema from "@/modules/procedure/procedure.schema";

// Only inject external ws if global WebSocket is not available (e.g. older local Node environments)
if (typeof globalThis.WebSocket === "undefined") {
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
    ...communicationSchema,
    ...notebookSchema,
    ...callSchema,
    ...certificateSchema,
    ...taskSchema,
    ...immersionSchema,
    ...audioSchema,
    ...procedureSchema,
  },
});


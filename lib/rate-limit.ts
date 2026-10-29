import "server-only";
import { db } from "./db";
import { rateLimits } from "@/modules/curriculum/curriculum.schema";
import { sql } from "drizzle-orm";

export async function checkRateLimit(
  serviceName: string,
  identifier: string,
  limit: number,
  windowMs: number = 24 * 60 * 60 * 1000 // Default 24h
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const windowExpired = sql`${rateLimits.windowStart} < ${windowStart.toISOString()}::timestamp`;

  // Upsert atômico: abre uma janela nova (count = 1) ou incrementa a atual numa única
  // instrução, para que requisições simultâneas não passem do limite.
  const [record] = await db.insert(rateLimits)
    .values({
      serviceName,
      identifier,
      windowStart: now,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [rateLimits.serviceName, rateLimits.identifier],
      set: {
        count: sql`CASE WHEN ${windowExpired} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${windowExpired} THEN ${now.toISOString()}::timestamp ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ count: rateLimits.count });

  if (record.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - record.count };
}

export async function checkDailyBudget(
  serviceName: string,
  identifier: string,
  limit: number
) {
  // Uses a fixed 24h window for daily budget
  const DAILY_WINDOW = 24 * 60 * 60 * 1000;
  return checkRateLimit(`${serviceName}_daily`, identifier, limit, DAILY_WINDOW);
}

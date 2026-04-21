import { db } from "./db";
import { rateLimits } from "@/modules/curriculum/curriculum.schema";
import { and, eq, sql } from "drizzle-orm";

export async function checkRateLimit(
  serviceName: string,
  identifier: string,
  limit: number,
  windowMs: number = 24 * 60 * 60 * 1000 // Default 24h
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // 1. Get or create record for this window
  let [record] = await db.select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.serviceName, serviceName),
        eq(rateLimits.identifier, identifier)
      )
    );

  if (!record || record.windowStart < windowStart) {
    // Reset or initial
    [record] = await db.insert(rateLimits)
      .values({
        serviceName,
        identifier,
        windowStart: now,
        count: 1,
      })
      .onConflictDoUpdate({
        target: rateLimits.id,
        set: { windowStart: now, count: 1 }
      })
      .returning();
    
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  // 2. Increment
  const [updated] = await db.update(rateLimits)
    .set({ count: sql`${rateLimits.count} + 1` })
    .where(eq(rateLimits.id, record.id))
    .returning();

  return { success: true, remaining: limit - updated.count };
}

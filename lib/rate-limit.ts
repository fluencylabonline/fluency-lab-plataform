import { db } from "./db";
import { rateLimitsTable } from "@/modules/user/user.schema";
import { eq } from "drizzle-orm";

/**
 * TEMPORARY: This is a database-backed rate limiter.
 * This will be replaced by Upstash/Redis in the future for better performance
 * and lower latency in serverless environments.
 * 
 * @param key Unique identifier for the action (e.g., "userId:action_name")
 * @param limit Maximum number of points allowed in the window
 * @param windowSeconds Window size in seconds
 * @throws Error if rate limit is exceeded
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const now = new Date();
  
  // 1. Find existing record
  const current = await db.query.rateLimitsTable.findFirst({
    where: eq(rateLimitsTable.key, key),
  });

  // 2. If no record or expired, reset
  if (!current || now > current.resetAt) {
    const resetAt = new Date(now.getTime() + windowSeconds * 1000);
    
    await db.insert(rateLimitsTable)
      .values({
        key,
        points: 1,
        resetAt,
      })
      .onConflictDoUpdate({
        target: rateLimitsTable.key,
        set: {
          points: 1,
          resetAt,
          updatedAt: now,
        },
      });
      
    return { success: true, remaining: limit - 1 };
  }

  // 3. Check if limit exceeded
  if (current.points >= limit) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  // 4. Increment points
  await db.update(rateLimitsTable)
    .set({
      points: current.points + 1,
      updatedAt: now,
    })
    .where(eq(rateLimitsTable.key, key));

  return { success: true, remaining: limit - (current.points + 1) };
}

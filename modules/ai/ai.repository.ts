import { db } from "@/lib/db";
import { aiCache } from "@/modules/curriculum/curriculum.schema";
import { eq, and, lt } from "drizzle-orm";

export const aiRepository = {
  /**
   * Retrieves a cached AI response if it exists and hasn't expired.
   */
  async getCache(hash: string, serviceName: string): Promise<unknown | null> {
    const cached = await db.query.aiCache.findFirst({
      where: and(
        eq(aiCache.hash, hash),
        eq(aiCache.serviceName, serviceName)
      ),
    });

    if (!cached) return null;

    // Check expiration
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      // Cleanup expired entry (async, don't wait)
      db.delete(aiCache).where(eq(aiCache.id, cached.id)).execute();
      return null;
    }

    return cached.response;
  },

  /**
   * Stores an AI response in the cache with an optional expiration.
   */
  async setCache(hash: string, serviceName: string, response: unknown, ttlDays: number = 30) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await db.insert(aiCache).values({
      hash,
      serviceName,
      response,
      expiresAt,
    }).onConflictDoUpdate({
      target: aiCache.hash,
      set: {
        response,
        expiresAt,
        createdAt: new Date(),
      }
    });
  },

  /**
   * Cleans up all expired cache entries.
   */
  async cleanupExpired() {
    return db.delete(aiCache).where(lt(aiCache.expiresAt, new Date()));
  }
};

import { db } from "@/lib/db";
import { immersionProgress, immersionHistory } from "./immersion.schema";
import { eq, and, desc } from "drizzle-orm";

export const immersionRepository = {
  // Progress
  async findProgress(userId: string, gameId: string) {
    return db.query.immersionProgress.findFirst({
      where: and(
        eq(immersionProgress.userId, userId),
        eq(immersionProgress.gameId, gameId)
      ),
    });
  },

  async upsertProgress(data: typeof immersionProgress.$inferInsert) {
    const existing = await this.findProgress(data.userId, data.gameId);

    if (existing) {
      const [result] = await db.update(immersionProgress)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(immersionProgress.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(immersionProgress).values(data).returning();
      return result;
    }
  },

  async deleteProgress(userId: string, gameId: string) {
    return db.delete(immersionProgress)
      .where(and(
        eq(immersionProgress.userId, userId),
        eq(immersionProgress.gameId, gameId)
      ));
  },

  // History
  async findHistory(userId: string, gameId: string, limit: number = 30) {
    return db.query.immersionHistory.findMany({
      where: and(
        eq(immersionHistory.userId, userId),
        eq(immersionHistory.gameId, gameId)
      ),
      orderBy: [desc(immersionHistory.playedAt)],
      limit,
    });
  },

  async createHistoryEntry(data: typeof immersionHistory.$inferInsert) {
    const [result] = await db.insert(immersionHistory).values(data).returning();
    return result;
  }
};

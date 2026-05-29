import { db } from "@/lib/db";
import { notebooksTable, notebookSessionsTable, notebookAssetsTable, notebookQuizLimitsTable } from "./notebook.schema";
import { eq, and, lte } from "drizzle-orm";

export const notebookRepository = {
  async findById(id: string) {
    return db.query.notebooksTable.findFirst({
      where: eq(notebooksTable.id, id),
    });
  },

  async findAll() {
    return db.query.notebooksTable.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async findByStudent(studentId: string) {
    return db.query.notebooksTable.findMany({
      where: eq(notebooksTable.studentId, studentId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async findByStudentAndTeacher(studentId: string, teacherId: string) {
    return db.query.notebooksTable.findMany({
      where: and(
        eq(notebooksTable.studentId, studentId),
        eq(notebooksTable.teacherId, teacherId)
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async create(data: {
    title: string;
    studentId: string;
    teacherId: string;
  }) {
    const [notebook] = await db
      .insert(notebooksTable)
      .values(data)
      .returning();
    return notebook;
  },

  async delete(id: string) {
    await db.delete(notebooksTable).where(eq(notebooksTable.id, id));
  },

  async updateNotebookContent(id: string, content: string) {
    const [updated] = await db
      .update(notebooksTable)
      .set({ content })
      .where(eq(notebooksTable.id, id))
      .returning();
    return updated;
  },

  // --- Session Tracking ---

  async createSession(data: { notebookId: string; userId: string }) {
    const [session] = await db
      .insert(notebookSessionsTable)
      .values(data)
      .returning();
    return session;
  },

  async findSessionById(sessionId: string): Promise<typeof notebookSessionsTable.$inferSelect | undefined> {
    return db.query.notebookSessionsTable.findFirst({
      where: eq(notebookSessionsTable.id, sessionId),
    });
  },

  async updateSessionHeartbeat(sessionId: string) {
    const now = new Date();
    const session = await db.query.notebookSessionsTable.findFirst({
      where: eq(notebookSessionsTable.id, sessionId),
    });

    if (!session) return null;

    const durationSeconds = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 1000
    );

    const [updated] = await db
      .update(notebookSessionsTable)
      .set({
        lastHeartbeatAt: now,
        durationSeconds,
      })
      .where(eq(notebookSessionsTable.id, sessionId))
      .returning();
    return updated;
  },

  async endSession(sessionId: string) {
    const now = new Date();
    const session = await db.query.notebookSessionsTable.findFirst({
      where: eq(notebookSessionsTable.id, sessionId),
    });

    if (!session) return null;

    const durationSeconds = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 1000
    );

    const [updated] = await db
      .update(notebookSessionsTable)
      .set({
        endedAt: now,
        durationSeconds,
      })
      .where(eq(notebookSessionsTable.id, sessionId))
      .returning();
    return updated;
  },

  // --- Asset Management ---

  async addNotebookAsset(asset: typeof notebookAssetsTable.$inferInsert) {
    return db.insert(notebookAssetsTable).values(asset).returning();
  },

  async getNotebookAssets(notebookId: string) {
    return db.query.notebookAssetsTable.findMany({
      where: eq(notebookAssetsTable.notebookId, notebookId),
    });
  },

  async markAssetAsDeleted(filePath: string) {
    await db
      .update(notebookAssetsTable)
      .set({ deletedAt: new Date() })
      .where(eq(notebookAssetsTable.filePath, filePath));
  },

  async unmarkAssetAsDeleted(filePath: string) {
    await db
      .update(notebookAssetsTable)
      .set({ deletedAt: null })
      .where(eq(notebookAssetsTable.filePath, filePath));
  },

  async getExpiredAssets(thresholdDate: Date) {
    return db.query.notebookAssetsTable.findMany({
      where: lte(notebookAssetsTable.deletedAt, thresholdDate),
    });
  },

  async deleteAssetRecord(filePath: string) {
    await db.delete(notebookAssetsTable).where(eq(notebookAssetsTable.filePath, filePath));
  },

  // --- Quiz Limits ---

  async getQuizLimitCount(teacherId: string, studentId: string): Promise<number> {
    const record = await db.query.notebookQuizLimitsTable.findFirst({
      where: and(
        eq(notebookQuizLimitsTable.teacherId, teacherId),
        eq(notebookQuizLimitsTable.studentId, studentId)
      ),
    });
    return record?.count ?? 0;
  },

  async incrementQuizLimitCount(teacherId: string, studentId: string): Promise<number> {
    const existing = await db.query.notebookQuizLimitsTable.findFirst({
      where: and(
        eq(notebookQuizLimitsTable.teacherId, teacherId),
        eq(notebookQuizLimitsTable.studentId, studentId)
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(notebookQuizLimitsTable)
        .set({ count: existing.count + 1 })
        .where(eq(notebookQuizLimitsTable.id, existing.id))
        .returning();
      return updated.count;
    } else {
      const [inserted] = await db
        .insert(notebookQuizLimitsTable)
        .values({
          teacherId,
          studentId,
          count: 1,
        })
        .returning();
      return inserted.count;
    }
  },
};


import "server-only";
import { db } from "@/lib/db";
import { notebooksTable, notebookSessionsTable, notebookAssetsTable, notebookQuizLimitsTable } from "./notebook.schema";
import { eq, and, lte, isNull, or, ilike, sql } from "drizzle-orm";

export const notebookRepository = {
  async findById(id: string) {
    return db.query.notebooksTable.findFirst({
      where: and(eq(notebooksTable.id, id), isNull(notebooksTable.deletedAt)),
    });
  },

  async findAll() {
    return db.query.notebooksTable.findMany({
      where: isNull(notebooksTable.deletedAt),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  // Listagens não trazem `content` (o documento inteiro de cada aula).
  async findByStudent(studentId: string) {
    return db.query.notebooksTable.findMany({
      where: and(
        eq(notebooksTable.studentId, studentId),
        isNull(notebooksTable.deletedAt)
      ),
      columns: { content: false },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async findByStudentAndTeacher(studentId: string, teacherId: string) {
    return db.query.notebooksTable.findMany({
      where: and(
        eq(notebooksTable.studentId, studentId),
        eq(notebooksTable.teacherId, teacherId),
        isNull(notebooksTable.deletedAt)
      ),
      columns: { content: false },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async searchByStudent(studentId: string, term: string, teacherId?: string, limit = 50) {
    const pattern = `%${term}%`;
    return db.query.notebooksTable.findMany({
      where: and(
        eq(notebooksTable.studentId, studentId),
        teacherId ? eq(notebooksTable.teacherId, teacherId) : undefined,
        isNull(notebooksTable.deletedAt),
        or(ilike(notebooksTable.title, pattern), ilike(notebooksTable.content, pattern))
      ),
      columns: { id: true, content: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit,
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

  async softDelete(id: string) {
    await db
      .update(notebooksTable)
      .set({ deletedAt: new Date() })
      .where(eq(notebooksTable.id, id));
  },

  async getExpiredNotebooks(thresholdDate: Date) {
    return db.query.notebooksTable.findMany({
      where: lte(notebooksTable.deletedAt, thresholdDate),
    });
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

  /**
   * Reserva atomicamente uma geração de quiz para o par professor/aluno. Devolve o novo contador,
   * ou null se o limite já foi atingido. O lock consultivo serializa cliques/abas simultâneas
   * (a tabela não tem índice único, então um upsert sozinho não basta).
   */
  async reserveQuizSlot(teacherId: string, studentId: string, max: number): Promise<number | null> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`quiz-limit:${teacherId}:${studentId}`}))`);

      const existing = await tx.query.notebookQuizLimitsTable.findFirst({
        where: and(
          eq(notebookQuizLimitsTable.teacherId, teacherId),
          eq(notebookQuizLimitsTable.studentId, studentId)
        ),
      });

      if (!existing) {
        const [inserted] = await tx
          .insert(notebookQuizLimitsTable)
          .values({ teacherId, studentId, count: 1 })
          .returning();
        return inserted.count;
      }
      if (existing.count >= max) return null;

      const [updated] = await tx
        .update(notebookQuizLimitsTable)
        .set({ count: existing.count + 1 })
        .where(eq(notebookQuizLimitsTable.id, existing.id))
        .returning();
      return updated.count;
    });
  },

  /** Devolve uma geração reservada quando a IA falhou (tentativa sem resultado não conta no limite). */
  async releaseQuizSlot(teacherId: string, studentId: string): Promise<void> {
    await db
      .update(notebookQuizLimitsTable)
      .set({ count: sql`greatest(${notebookQuizLimitsTable.count} - 1, 0)` })
      .where(
        and(
          eq(notebookQuizLimitsTable.teacherId, teacherId),
          eq(notebookQuizLimitsTable.studentId, studentId)
        )
      );
  },
};


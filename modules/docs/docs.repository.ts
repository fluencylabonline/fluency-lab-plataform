import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { docsQuestionsTable, type NewDocsQuestion } from "./docs.schema";

export const docsRepository = {
  async createQuestion(data: NewDocsQuestion) {
    const [row] = await db.insert(docsQuestionsTable).values(data).returning();
    return row;
  },

  /**
   * Grava o 👍/👎. Restrito ao autor da pergunta — sem isso qualquer usuário
   * autenticado poderia alterar o feedback de perguntas alheias.
   */
  async setFeedback(questionId: string, userId: string, feedback: string) {
    const [row] = await db
      .update(docsQuestionsTable)
      .set({ feedback })
      .where(
        and(
          eq(docsQuestionsTable.id, questionId),
          eq(docsQuestionsTable.userId, userId),
        ),
      )
      .returning();
    return row ?? null;
  },

  /** Listagem para a tela de revisão do admin. */
  async listQuestions(filters: {
    audience?: string;
    onlyUnanswered?: boolean;
    limit?: number;
  }) {
    const conditions = [];
    if (filters.audience) {
      conditions.push(eq(docsQuestionsTable.audience, filters.audience));
    }
    if (filters.onlyUnanswered) {
      conditions.push(eq(docsQuestionsTable.foundAnswer, false));
    }

    return db.query.docsQuestionsTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(docsQuestionsTable.createdAt)],
      limit: filters.limit ?? 200,
      with: {
        user: { columns: { name: true, role: true } },
      },
    });
  },

  /** Contadores do cabeçalho da tela de revisão. */
  async getStats() {
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unanswered: sql<number>`count(*) filter (where ${docsQuestionsTable.foundAnswer} = false)::int`,
        notHelpful: sql<number>`count(*) filter (where ${docsQuestionsTable.feedback} = 'not_helpful')::int`,
      })
      .from(docsQuestionsTable);

    return row ?? { total: 0, unanswered: 0, notHelpful: 0 };
  },
};

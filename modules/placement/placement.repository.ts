import { db } from "@/lib/db";
import { placementTestsTable, questionsTable, testAnswersTable, Question, PlacementTest, TestAnswer } from "./placement.schema";
import { eq, and, notInArray, desc, sql } from "drizzle-orm";
import { media } from "../curriculum/curriculum.schema";

export const placementRepository = {
  // Test Management
  async getActiveTest(userId: string, languageId: string): Promise<PlacementTest | undefined> {
    return db.query.placementTestsTable.findFirst({
      where: and(
        eq(placementTestsTable.userId, userId),
        eq(placementTestsTable.languageId, languageId),
        eq(placementTestsTable.status, "in_progress")
      ),
    });
  },

  async getActiveTestById(testId: number, userId: string): Promise<PlacementTest | undefined> {
    return db.query.placementTestsTable.findFirst({
      where: and(
        eq(placementTestsTable.id, testId),
        eq(placementTestsTable.userId, userId),
        eq(placementTestsTable.status, "in_progress")
      ),
    });
  },

  async createNewTest(userId: string, languageId: string, initialEloScore: number): Promise<PlacementTest> {
    const [test] = await db.insert(placementTestsTable).values({
      userId,
      languageId,
      initialEloScore,
      status: "in_progress",
    }).returning();
    return test;
  },

  async completeTest(testId: number, finalEloScore: number) {
    await db.update(placementTestsTable)
      .set({
        status: "completed",
        finalEloScore,
        completedAt: new Date(),
      })
      .where(eq(placementTestsTable.id, testId));
  },

  async abandonTests(userId: string) {
    await db.update(placementTestsTable)
      .set({ status: "abandoned" })
      .where(and(
        eq(placementTestsTable.userId, userId),
        eq(placementTestsTable.status, "in_progress")
      ));
  },

  // Answers & Progress
  async countTestAnswers(testId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(testAnswersTable)
      .where(eq(testAnswersTable.testId, testId));
    return Number(result[0]?.count || 0);
  },

  async getLastAnswerScore(testId: number): Promise<number | undefined> {
    const result = await db.query.testAnswersTable.findFirst({
      where: eq(testAnswersTable.testId, testId),
      orderBy: [desc(testAnswersTable.answeredAt)],
    });
    return result?.eloScoreAfterAnswer;
  },

  async insertTestAnswer(
    testId: number,
    questionId: number,
    selectedOptionId: string,
    isCorrect: boolean,
    eloScoreAfterAnswer: number
  ): Promise<TestAnswer> {
    const [answer] = await db.insert(testAnswersTable).values({
      testId,
      questionId,
      selectedOptionId,
      isCorrect,
      eloScoreAfterAnswer,
    }).returning();
    return answer;
  },

  async getAnsweredQuestionIds(testId: number): Promise<number[]> {
    const answers = await db.query.testAnswersTable.findMany({
      where: eq(testAnswersTable.testId, testId),
      columns: { questionId: true },
    });
    return answers.map(a => a.questionId!).filter((id: number) => id != null);
  },

  // Questions
  async getQuestionById(questionId: number): Promise<Question | undefined> {
    return db.query.questionsTable.findFirst({
      where: eq(questionsTable.id, questionId),
    });
  },

  async getNextAdaptiveQuestion(
    languageId: string,
    targetSkill: "grammar" | "vocabulary" | "reading" | "listening",
    targetDifficulty: number,
    excludeQuestionIds: number[]
  ): Promise<Question | undefined> {

    // Build basic where clause
    const conditions = [
      eq(questionsTable.languageId, languageId),
      eq(questionsTable.status, "active"),
      eq(questionsTable.skill, targetSkill),
    ];

    if (excludeQuestionIds.length > 0) {
      conditions.push(notInArray(questionsTable.id, excludeQuestionIds));
    }

    // Custom sort: order by difference between question difficulty and target
    // We want the question whose difficulty is closest to the user's current target.
    // In Drizzle, we can sort by ABS(difficulty_level - targetDifficulty).

    const questions = await db.select()
      .from(questionsTable)
      .where(and(...conditions))
      .orderBy(sql`ABS(${questionsTable.difficultyLevel} - ${targetDifficulty}) ASC`)
      .limit(1);

    return questions[0];
  },

  async updateQuestionCalibration(questionId: number, newDifficulty: number) {
    await db.update(questionsTable)
      .set({
        difficultyLevel: newDifficulty,
        timesAnswered: sql`${questionsTable.timesAnswered} + 1`
      })
      .where(eq(questionsTable.id, questionId));
  },

  // Admin Operations
  async getQuestionsByStatus(languageId: string, status: "draft" | "active" | "archived"): Promise<Question[]> {
    return db.query.questionsTable.findMany({
      where: and(
        eq(questionsTable.languageId, languageId),
        eq(questionsTable.status, status)
      ),
      orderBy: [desc(questionsTable.createdAt)]
    });
  },

  async updateQuestionStatus(questionId: number, status: "draft" | "active" | "archived") {
    await db.update(questionsTable)
      .set({ status })
      .where(eq(questionsTable.id, questionId));
  },

  async bulkInsertQuestions(questions: (typeof questionsTable.$inferInsert)[]) {
    return db.insert(questionsTable).values(questions).returning();
  },

  async createQuestion(data: typeof questionsTable.$inferInsert) {
    return db.insert(questionsTable).values(data).returning();
  },

  async deleteQuestion(id: number) {
    await db.delete(questionsTable).where(eq(questionsTable.id, id));
  },

  async updateQuestion(id: number, data: Partial<typeof questionsTable.$inferInsert>) {
    return db.update(questionsTable).set(data).where(eq(questionsTable.id, id)).returning();
  },

  async getQuestionsWithFilters(filters: {
    languageId?: string;
    cefrLevel?: string;
    skill?: string;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [];
    if (filters.languageId) conditions.push(eq(questionsTable.languageId, filters.languageId));
    if (filters.cefrLevel) conditions.push(eq(questionsTable.cefrLevel, filters.cefrLevel));
    if (filters.skill) conditions.push(eq(questionsTable.skill, filters.skill as 'grammar' | 'vocabulary' | 'reading' | 'listening'));
    if (filters.status) conditions.push(eq(questionsTable.status, filters.status as 'draft' | 'active' | 'archived'));
    if (filters.type) conditions.push(eq(questionsTable.type, filters.type as 'multiple_choice' | 'unscramble' | 'audio_comprehension' | 'grammar' | 'context' | 'writing'));

    const result = await db.select({
      id: questionsTable.id,
      content: questionsTable.content,
      context: questionsTable.context,
      options: questionsTable.options,
      correctOptionId: questionsTable.correctOptionId,
      skill: questionsTable.skill,
      type: questionsTable.type,
      difficultyLevel: questionsTable.difficultyLevel,
      cefrLevel: questionsTable.cefrLevel,
      languageId: questionsTable.languageId,
      status: questionsTable.status,
      audioScript: questionsTable.audioScript,
      learningItemId: questionsTable.learningItemId,
      sourceMediaId: questionsTable.sourceMediaId,
      metadata: questionsTable.metadata,
      createdAt: questionsTable.createdAt,
      mediaUrl: media.url,
    })
      .from(questionsTable)
      .leftJoin(media, eq(questionsTable.sourceMediaId, media.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questionsTable.createdAt))
      .limit(filters.limit ?? 50)
      .offset(filters.offset ?? 0);

    return result;
  },

  async getPlacementStats(languageId: string) {
    const result = await db.select({
      status: questionsTable.status,
      count: sql<number>`count(*)`
    })
      .from(questionsTable)
      .where(eq(questionsTable.languageId, languageId))
      .groupBy(questionsTable.status);

    const cefrResult = await db.select({
      cefrLevel: questionsTable.cefrLevel,
      count: sql<number>`count(*)`
    })
      .from(questionsTable)
      .where(eq(questionsTable.languageId, languageId))
      .groupBy(questionsTable.cefrLevel);

    return {
      byStatus: result,
      byLevel: cefrResult
    };
  },

  async getTestHistory(userId: string) {
    return db.query.placementTestsTable.findMany({
      where: eq(placementTestsTable.userId, userId),
      with: {
        language: true,
      },
      orderBy: [desc(placementTestsTable.startedAt)],
    });
  },

  async getActiveTests(userId: string) {
    return db.query.placementTestsTable.findMany({
      where: and(
        eq(placementTestsTable.userId, userId),
        eq(placementTestsTable.status, "in_progress")
      ),
      with: {
        language: true,
      }
    });
  },

  async getTestById(testId: number, userId: string) {
    return db.query.placementTestsTable.findFirst({
      where: and(
        eq(placementTestsTable.id, testId),
        eq(placementTestsTable.userId, userId)
      ),
      with: {
        language: true,
      }
    });
  },

  async getTestAnswers(testId: number) {
    return db.query.testAnswersTable.findMany({
      where: eq(testAnswersTable.testId, testId),
      with: {
        question: true,
      }
    });
  }
};

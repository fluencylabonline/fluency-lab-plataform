import { db } from "@/lib/db";
import { placementTestsTable, questionsTable, testAnswersTable, Question, PlacementTest, TestAnswer } from "./placement.schema";
import { eq, and, notInArray, desc, sql } from "drizzle-orm";

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
  }
};

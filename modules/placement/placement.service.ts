import { db } from "@/lib/db";
import { placementRepository } from "./placement.repository";
import { userRepository } from "../user/user.repository";
import { calculateElo } from "@/lib/adaptive-scoring";
import { Question, PlacementTest, placementTestsTable } from "./placement.schema";
import { curriculumService } from "../curriculum/curriculum.service";
import { curriculumRepository } from "../curriculum/curriculum.repository";
import { aiService } from "../ai/ai.service";
import { learningService } from "../learning/learning.service";
import { CEFRLevel } from "../curriculum/curriculum.types";
import { and, eq } from "drizzle-orm";

const PLACEMENT_TEST_LESSON_ID = "00000000-0000-0000-0000-000000000000"; // Mock ID for diagnostic records

export const placementService = {
  /**
   * Check if user is eligible to take the placement test.
   * A user can only take the test once every 6 months.
   */
  async checkEligibility(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    if (!user.lastPlacementTestDate) return true;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return user.lastPlacementTestDate <= sixMonthsAgo;
  },

  /**
   * Starts a new placement test or resumes an existing one.
   */
  async startOrResumeTest(userId: string, languageId: string): Promise<{ test: PlacementTest; answeredCount: number; currentElo: number }> {
    const isEligible = await this.checkEligibility(userId);
    if (!isEligible) {
      throw new Error("You must wait 6 months before taking the test again.");
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    // Check if there is an active test for this specific language
    let test = await placementRepository.getActiveTest(userId, languageId);

    // If not, create one
    if (!test) {
      test = await placementRepository.createNewTest(userId, languageId, user.currentEloScore);
    }

    const answeredCount = await placementRepository.countTestAnswers(test.id);
    const lastScore = await placementRepository.getLastAnswerScore(test.id);
    const currentElo = lastScore ?? test.initialEloScore;

    return { test, answeredCount, currentElo };
  },

  /**
   * Gets the next adaptive question from the circular queue.
   */
  async getNextQuestion(userId: string, testId: number, languageId: string, currentElo: number, answeredCount: number): Promise<Question | null> {
    const skills: Array<"grammar" | "vocabulary" | "reading" | "listening"> = ["grammar", "vocabulary", "reading", "listening"];
    const targetSkill = skills[answeredCount % 4];

    const excludeIds = await placementRepository.getAnsweredQuestionIds(testId);

    const question = await placementRepository.getNextAdaptiveQuestion(languageId, targetSkill, currentElo, excludeIds);
    return question ?? null;
  },

  /**
   * Submits an answer and updates the Elo score and difficulty parameters.
   */
  async submitAnswer(
    userId: string,
    data: { testId: number; questionId: number; selectedOptionId: string }
  ): Promise<{
    isFinished: boolean;
    isCorrect: boolean;
    currentElo: number;
    finalElo?: number;
    nextQuestion: Question | null;
  }> {
    // 1. Verify user owns this test
    // We don't have languageId in the answer payload, but the test table has it.
    // We just find any active test for this user.
    const test = await db.query.placementTestsTable.findFirst({
      where: and(
        eq(placementTestsTable.id, data.testId),
        eq(placementTestsTable.userId, userId),
        eq(placementTestsTable.status, "in_progress")
      )
    });

    if (!test) {
      throw new Error("Active test not found or belongs to another user.");
    }

    // 2. Fetch the question
    const question = await placementRepository.getQuestionById(data.questionId);
    if (!question) {
      throw new Error("Question not found.");
    }

    const isCorrect = question.correctOptionId === data.selectedOptionId;

    // 3. Get current progress to calculate dynamic K-Factors
    const studentQuestionsAnswered = await placementRepository.countTestAnswers(test.id);
    const lastScore = await placementRepository.getLastAnswerScore(test.id);
    const currentEloBefore = lastScore ?? test.initialEloScore;

    // 4. Calculate new Elo scores
    const { newStudentScore, newQuestionDifficulty } = calculateElo(
      currentEloBefore,
      question.difficultyLevel,
      isCorrect,
      studentQuestionsAnswered,
      question.timesAnswered ?? 0
    );

    // 5. Save the answer
    await placementRepository.insertTestAnswer(
      test.id,
      question.id,
      data.selectedOptionId,
      isCorrect,
      newStudentScore
    );

    // 6. Update Question calibration
    await placementRepository.updateQuestionCalibration(question.id, newQuestionDifficulty);

    // 7. Track diagnostics (Learning Item Link)
    if (question.learningItemId) {
      try {
        // q factor: 5 if correct, 0 if incorrect
        await learningService.recordPracticeResult(
          userId,
          question.learningItemId,
          isCorrect ? 5 : 0,
          PLACEMENT_TEST_LESSON_ID
        );
      } catch (e) {
        console.error("Failed to track placement diagnostic for learning item:", e);
      }
    }

    // 7. Check if test should finish (25 total questions, meaning 24 were answered before this one = 25 now)
    const totalAnsweredNow = studentQuestionsAnswered + 1;
    if (totalAnsweredNow >= 25) {
      // Finish the test
      await placementRepository.completeTest(test.id, newStudentScore);

      // Update User profile
      await userRepository.update(userId, {
        currentEloScore: newStudentScore,
        lastPlacementTestDate: new Date(),
      });

      return {
        isFinished: true,
        isCorrect,
        currentElo: newStudentScore,
        finalElo: newStudentScore,
        nextQuestion: null,
      };
    }

    // 8. Otherwise, fetch next question
    const nextQuestion = await this.getNextQuestion(userId, test.id, test.languageId, newStudentScore, totalAnsweredNow);

    return {
      isFinished: false,
      isCorrect,
      currentElo: newStudentScore,
      nextQuestion,
    };
  },

  /**
   * Bulk generate questions for a specific level and language.
   * Ensures at least one question for each skill.
   * This is used by admins to pre-populate the test bank.
   */
  async generateBulkQuestions(
    languageId: string,
    cefrLevel: CEFRLevel,
    count: number,
    userId?: string
  ) {
    if (count < 4) throw new Error("Bulk generation requires at least 4 questions to cover all skills.");

    const language = await curriculumRepository.findLanguageById(languageId);
    if (!language) throw new Error("Language not found");

    const skills: Array<"grammar" | "vocabulary" | "reading" | "listening"> = ["grammar", "vocabulary", "reading", "listening"];

    // 1. Get random items from curriculum
    const items = await curriculumService.getRandomItemsByLevel(languageId, cefrLevel, count);
    if (items.length < count) {
      throw new Error(`Only ${items.length} items found for level ${cefrLevel}. Need ${count}.`);
    }

    const createdQuestions: Question[] = [];

    // 2. Sequential generation with skill distribution
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const skill = skills[i % 4];

      try {
        const aiQuestion = await aiService.generatePlacementQuestionFromItem(
          { lemma: item.lemma, type: item.type, metadata: item.metadata as Record<string, unknown> },
          cefrLevel,
          skill,
          userId
        );

        const [created] = await placementRepository.createQuestion({
          languageId,
          skill: skill,
          difficultyLevel: 1000,
          cefrLevel: cefrLevel,
          content: aiQuestion.content,
          context: aiQuestion.context,
          options: aiQuestion.options,
          correctOptionId: aiQuestion.correct_option_id,
          audioScript: aiQuestion.audio_script,
          learningItemId: item.id,
          status: "draft",
        });

        createdQuestions.push(created);

        // Throttle to avoid Gemini 429
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        console.error(`Failed to generate AI question for item ${item.lemma}:`, e);
      }
    }

    if (createdQuestions.length === 0) throw new Error("Failed to generate any questions.");

    return createdQuestions;
  },

  /**
   * Administrative review of draft questions.
   */
  async reviewQuestion(questionId: number, status: "active" | "archived") {
    return placementRepository.updateQuestionStatus(questionId, status);
  },

  /**
   * Get draft questions for review.
   */
  async getDraftQuestions(languageId: string) {
    return placementRepository.getQuestionsByStatus(languageId, "draft");
  }
};

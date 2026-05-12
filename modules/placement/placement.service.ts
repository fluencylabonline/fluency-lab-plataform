import { placementRepository } from "./placement.repository";
import { userRepository } from "../user/user.repository";
import { calculateElo, mapEloToCEFR } from "@/lib/adaptive-scoring";
import { Question, PlacementTest } from "./placement.schema";
import { curriculumService } from "../curriculum/curriculum.service";
import { curriculumRepository } from "../curriculum/curriculum.repository";
import { aiService } from "../ai/ai.service";
import { learningService } from "../learning/learning.service";
import { CEFRLevel, LearningItemMetadata } from "../curriculum/curriculum.types";
import { questionsTable } from "./placement.schema";

const PLACEMENT_TEST_LESSON_ID = "00000000-0000-0000-0000-000000000000"; // Mock ID for diagnostic records

export const placementService = {
  /**
   * Check if user is eligible to take the placement test.
   * A user can only take the test once every 6 months and cannot have another active test.
   */
  async checkEligibility(userId: string): Promise<{ isEligible: boolean; reason?: 'cooldown' | 'active_test' }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    // 1. Check for active tests first
    const activeTests = await placementRepository.getActiveTests(userId);
    if (activeTests.length > 0) {
      return { isEligible: false, reason: 'active_test' };
    }

    // 2. Check 6-month cooldown
    if (!user.lastPlacementTestDate) return { isEligible: true };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const isEligible = user.lastPlacementTestDate <= sixMonthsAgo;
    return { isEligible, reason: isEligible ? undefined : 'cooldown' };
  },

  /**
   * Starts a new placement test or resumes an existing one.
   */
  async startOrResumeTest(userId: string, languageId: string): Promise<{ test: PlacementTest; answeredCount: number; currentElo: number }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    // 1. Check if there is an active test for this specific language
    let test = await placementRepository.getActiveTest(userId, languageId);

    // 2. If it's a new test, verify eligibility
    if (!test) {
      const eligibility = await this.checkEligibility(userId);
      if (!eligibility.isEligible) {
        if (eligibility.reason === 'active_test') {
          throw new Error("You already have an active test in progress. Please finish or cancel it before starting a new one.");
        }
        throw new Error("You must wait 6 months before taking the test again.");
      }
      
      // Create new test
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
    
    // 1. Try the ideal skill in rotation
    const targetSkill = skills[answeredCount % 4];
    const excludeIds = await placementRepository.getAnsweredQuestionIds(testId);

    let question = await placementRepository.getNextAdaptiveQuestion(languageId, targetSkill, currentElo, excludeIds);

    // 2. If not found, try other skills in order
    if (!question) {
      console.log(`[PlacementService] No questions found for target skill ${targetSkill}. Trying other skills...`);
      for (const skill of skills) {
        if (skill === targetSkill) continue;
        question = await placementRepository.getNextAdaptiveQuestion(languageId, skill, currentElo, excludeIds);
        if (question) break;
      }
    }

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
    const test = await placementRepository.getActiveTestById(data.testId, userId);

    if (!test) {
      throw new Error("Active test not found or belongs to another user.");
    }

    // 2. Fetch the question
    const question = await placementRepository.getQuestionById(data.questionId);
    if (!question) {
      throw new Error("Question not found.");
    }

    let isCorrect = false;

    const textTypes = ["unscramble", "writing", "gapfill"];

    if (textTypes.includes(question.type || "")) {
      // Normalize both strings: lowercase, remove punctuation, trim extra spaces
      const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();
      
      // For writing/gapfill, the correct answer might be in correctOptionId (as string) or context
      const expected = question.type === "unscramble" 
        ? (question.context || "") 
        : (question.correctOptionId || "");
        
      isCorrect = normalize(data.selectedOptionId) === normalize(expected);
    } else {
      isCorrect = question.correctOptionId === data.selectedOptionId;
    }

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
          { lemma: item.lemma, type: item.type, metadata: item.metadata as LearningItemMetadata },
          cefrLevel,
          skill,
          language.name,
          "Portuguese",
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
   * Get questions for management.
   */
  async getQuestions(filters: {
    languageId?: string;
    cefrLevel?: string;
    skill?: string;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    return placementRepository.getQuestionsWithFilters(filters);
  },

  /**
   * Get placement stats.
   */
  async getStats(languageId: string) {
    return placementRepository.getPlacementStats(languageId);
  },

  /**
   * Deletes a question.
   */
  async deleteQuestion(id: number) {
    return placementRepository.deleteQuestion(id);
  },

  /**
   * Updates a question.
   */
  async updateQuestion(id: number, data: Partial<typeof questionsTable.$inferInsert>) {
    return placementRepository.updateQuestion(id, data);
  },

  /**
   * Deterministic gap fill generation from a sentence.
   */
  generateDeterministicGapFill(sentence: string): { sentenceWithGap: string, correctAnswer: string } {
    const words = sentence.trim().split(/\s+/);
    if (words.length < 2) return { sentenceWithGap: "____", correctAnswer: sentence };

    const gapIndex = Math.floor(Math.random() * words.length);
    const correctAnswer = words[gapIndex].replace(/[.,!?;:]/g, ""); // Clean punctuation
    const sentenceWithGap = words.map((w, i) => i === gapIndex ? "____" : w).join(" ");

    return { sentenceWithGap, correctAnswer };
  },

  /**
   * Orchestrates batch generation based on multiple items and audios.
   */
  async generateBatch(
    languageId: string,
    itemIds: string[],
    mediaIds: string[],
    types: string[],
    userId?: string
  ) {
    const questions: (typeof questionsTable.$inferInsert)[] = [];

    // 1. Fetch Items and Media
    const items = await Promise.all(itemIds.map(id => curriculumRepository.findItemById(id)));
    const medias = await Promise.all(mediaIds.map(id => curriculumRepository.findMediaById(id)));

    const validItems = items.filter((i): i is NonNullable<typeof i> => !!i);
    const validMedias = medias.filter((m): m is NonNullable<typeof m> => !!m);

    console.log(`[PlacementService] Generating batch for types: ${types.join(", ")}`);
    console.log(`[PlacementService] Selected items: ${validItems.length}, Selected medias: ${validMedias.length}`);

    // 2. Generation Logic per Type
    for (const type of types) {
      console.log(`[PlacementService] Processing type: ${type}`);

      if (type === "writing" && validMedias.length > 0) {
        let deterministicCount = 0;
        for (const mediaRecord of validMedias) {
          const segments = mediaRecord.config?.segments || [];
          if (segments.length === 0) continue;

          // Use the segments as sentences
          const selection = segments.sort(() => 0.5 - Math.random()).slice(0, 5);

          for (const s of selection) {
            const { sentenceWithGap, correctAnswer } = this.generateDeterministicGapFill(s.word);
            questions.push({
              languageId,
              type: "writing",
              skill: "listening",
              content: "Ouça o áudio e escreva a palavra que falta:",
              context: sentenceWithGap,
              correctOptionId: "gap",
              options: [{ id: "gap", text: correctAnswer }],
              cefrLevel: "A1",
              difficultyLevel: 1000,
              sourceMediaId: mediaRecord.id,
              metadata: {
                audioRange: { start: s.start, end: s.end },
                mediaUrl: mediaRecord.url,
                gapFillData: { sentenceWithGap, correctAnswer }
              }
            });
            deterministicCount++;
          }
        }
        if (deterministicCount > 0) {
          console.log(`[PlacementService] Generated ${deterministicCount} deterministic writing questions`);
          continue; // Only skip AI if we actually generated deterministic ones
        }
      }

      if (type === "unscramble") {
        for (const item of validItems) {
          if (item.type !== "STRUCTURE") continue;
          const meta = item.metadata as LearningItemMetadata;
          const example = meta.examples?.[0];
          if (!example) continue;

          const words = example.text.split(/\s+/).filter(Boolean);
          // Create objects with unique IDs to handle duplicate words correctly
          const indexedWords = words.map((word, originalIndex) => ({
            word,
            originalIndex,
          }));

          const shuffledWordsWithMeta = [...indexedWords].sort(() => 0.5 - Math.random());
          const shuffledWords = shuffledWordsWithMeta.map(w => w.word);

          // correctOrder[i] is the index in shuffledWords that holds the word originally at words[i]
          const correctOrder = indexedWords.map(original =>
            shuffledWordsWithMeta.findIndex(shuffled => shuffled.originalIndex === original.originalIndex)
          );

          questions.push({
            languageId,
            type: "unscramble",
            skill: "grammar",
            content: "Reordene as palavras para formar a frase correta:",
            context: example.text,
            correctOptionId: "unscramble",
            options: [{ id: "unscramble", text: example.text }],
            cefrLevel: meta.level || "A1",
            difficultyLevel: 1000,
            learningItemId: item.id,
            metadata: {
              unscrambleData: { words: shuffledWords, correctOrder }
            }
          });
        }
      }

      if (type === "grammar" || type === "context" || type === "multiple_choice" || type === "writing") {
        const skillMap: Record<string, "grammar" | "vocabulary" | "reading" | "listening"> = {
          grammar: "grammar",
          context: "vocabulary",
          multiple_choice: "reading",
          writing: "listening"
        };

        const skill = skillMap[type] || "grammar";
        console.log(`[PlacementService] AI Batch Generation starting for ${type} with ${validItems.length} items`);

        // Group items in batches of 5 to optimize API calls and respect quotas
        const batchSize = 5;
        for (let i = 0; i < validItems.length; i += batchSize) {
          const itemBatch = validItems.slice(i, i + batchSize);
          try {
            const language = await curriculumRepository.findLanguageById(languageId);
            const targetLangName = language?.name || "English";
            
            const { questions: aiQuestions } = await aiService.generatePlacementQuestionsBatch(
              itemBatch as Array<{ lemma: string; type: string; metadata: LearningItemMetadata }>,
              "A1", // Target level, could be dynamic
              skill,
              targetLangName,
              "Portuguese",
              userId
            );

            for (const aiQ of aiQuestions) {
              const originalItem = itemBatch.find(it => it.lemma === aiQ.learningItemId);
              questions.push({
                languageId,
                type: type as 'multiple_choice' | 'unscramble' | 'audio_comprehension' | 'grammar' | 'context' | 'writing',
                skill,
                content: aiQ.content,
                context: aiQ.context,
                correctOptionId: aiQ.correct_option_id,
                options: aiQ.options,
                cefrLevel: ((originalItem?.metadata as LearningItemMetadata)?.level as string) || "A1",
                difficultyLevel: 1000,
                learningItemId: originalItem?.id,
                metadata: {
                  aiGenerated: true,
                  audioScript: aiQ.audio_script
                }
              });
            }
            console.log(`[PlacementService] AI Batch Success: ${i + itemBatch.length}/${validItems.length}`);
          } catch (error) {
            console.error(`[PlacementService] AI Batch Error for items starting at ${i}:`, error);
          }
        }
        console.log(`[PlacementService] AI Generation finished for ${type}`);
      }
    }

    console.log(`[PlacementService] Total questions generated: ${questions.length}`);
    return questions;
  },

  /**
   * Gets all necessary data for the placement dashboard.
   */
  async getPlacementDashboard(userId: string) {
    const [history, activeTests, languages] = await Promise.all([
      placementRepository.getTestHistory(userId),
      placementRepository.getActiveTests(userId),
      curriculumService.findAllLanguages(),
    ]);

    // Enhance languages with information about available questions
    const availableLanguages = await Promise.all(languages.map(async (lang) => {
      const stats = await placementRepository.getPlacementStats(lang.id);
      const activeCount = stats.byStatus.find(s => s.status === 'active')?.count || 0;
      return {
        ...lang,
        hasActiveTest: activeCount >= 20
      };
    }));

    const user = await userRepository.findById(userId);
    const lastDate = user?.lastPlacementTestDate;
    
    // Check eligibility using the internal method for consistency
    const eligibilityResult = await this.checkEligibility(userId);
    
    let nextEligibleDate = null;
    if (lastDate) {
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 6);
      nextEligibleDate = nextDate;
    }

    return {
      history,
      activeTests,
      availableLanguages: availableLanguages.filter(l => l.hasActiveTest),
      eligibility: {
        isEligible: eligibilityResult.isEligible,
        reason: eligibilityResult.reason,
        nextEligibleDate,
        lastTestDate: lastDate
      }
    };
  },

  /**
   * Gets the detailed results of a completed test.
   */
  async getTestResult(testId: number, userId: string) {
    const test = await placementRepository.getTestById(testId, userId);
    if (!test) throw new Error("Test not found");

    const answers = await placementRepository.getTestAnswers(testId);

    // Calculate skill scores (0-100)
    const skills = ['grammar', 'vocabulary', 'reading', 'listening'];
    const skillStats = skills.map(skill => {
      const skillAnswers = answers.filter(a => a.question?.skill === skill);
      const correct = skillAnswers.filter(a => a.isCorrect).length;
      const total = skillAnswers.length;
      const score = total > 0 ? (correct / total) * 100 : 0;
      return { subject: skill, score, fullMark: 100 };
    });

    return {
      level: mapEloToCEFR(test.finalEloScore || 600),
      score: test.finalEloScore,
      skillStats,
      totalQuestions: answers.length,
      correctAnswers: answers.filter(a => a.isCorrect).length,
      startedAt: test.startedAt,
      completedAt: test.completedAt,
    };
  }
};

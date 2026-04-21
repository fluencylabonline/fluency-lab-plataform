"use server";

import { adminAction, protectedAction } from "@/lib/safe-action";
import { placementService } from "./placement.service";
import { insertQuestionSchema, submitAnswerSchema } from "./placement.schema";
import { db } from "@/lib/db";
import { questionsTable } from "./placement.schema";
import { mapEloToCEFR } from "@/lib/adaptive-scoring";

import { z } from "zod";

export const startPlacementTestAction = protectedAction
  .schema(z.object({ languageId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    // 1. Will throw if not eligible
    const { test, answeredCount, currentElo } = await placementService.startOrResumeTest(ctx.user.id, parsedInput.languageId);

    // 2. Fetch question
    const nextQuestion = await placementService.getNextQuestion(ctx.user.id, test.id, parsedInput.languageId, currentElo, answeredCount);

    return {
      testId: test.id,
      currentElo,
      answeredCount,
      nextQuestion
    };
  });

export const submitPlacementAnswerAction = protectedAction
  .schema(submitAnswerSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await placementService.submitAnswer(ctx.user.id, {
      testId: parsedInput.testId,
      questionId: parsedInput.questionId,
      selectedOptionId: parsedInput.selectedOptionId,
    });

    if (result.isFinished && result.finalElo) {
      return {
        isFinished: true,
        cefrLevel: mapEloToCEFR(result.finalElo),
        finalElo: result.finalElo,
        isCorrect: result.isCorrect
      };
    }

    return {
      isFinished: false,
      isCorrect: result.isCorrect,
      currentElo: result.currentElo,
      nextQuestion: result.nextQuestion
    };
  });

export const generateBulkPlacementQuestionsAction = adminAction
  .schema(z.object({
    languageId: z.string().uuid(),
    cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    count: z.number().min(4).max(50)
  }))
  .action(async ({ parsedInput, ctx }) => {
    const questions = await placementService.generateBulkQuestions(
      parsedInput.languageId,
      parsedInput.cefrLevel,
      parsedInput.count,
      ctx.user.id
    );
    return { count: questions.length };
  });

export const reviewPlacementQuestionAction = adminAction
  .schema(z.object({
    questionId: z.number(),
    status: z.enum(['active', 'archived'])
  }))
  .action(async ({ parsedInput }) => {
    await placementService.reviewQuestion(parsedInput.questionId, parsedInput.status);
    return { success: true };
  });

export const getDraftQuestionsAction = adminAction
  .schema(z.object({ languageId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const questions = await placementService.getDraftQuestions(parsedInput.languageId);
    return { questions };
  });

export const createManualQuestionAction = adminAction
  .schema(insertQuestionSchema)
  .action(async ({ parsedInput }) => {
    const [question] = await db.insert(questionsTable).values(parsedInput).returning();
    return { question };
  });

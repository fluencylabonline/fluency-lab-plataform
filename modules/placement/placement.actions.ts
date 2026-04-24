"use server";

import { protectedAction, managerAction } from "@/lib/safe-action";
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

export const generateBatchPlacementQuestionsAction = managerAction
  .schema(z.object({
    languageId: z.string().uuid(),
    itemIds: z.array(z.string()),
    mediaIds: z.array(z.string().uuid()),
    types: z.array(z.string())
  }))
  .action(async ({ parsedInput, ctx }) => {
    return await placementService.generateBatch(
      parsedInput.languageId,
      parsedInput.itemIds,
      parsedInput.mediaIds,
      parsedInput.types,
      ctx.user.id
    );
  });

export const commitBatchPlacementQuestionsAction = managerAction
  .schema(z.array(insertQuestionSchema))
  .action(async ({ parsedInput }) => {
    const results = [];
    for (const q of parsedInput) {
      const [created] = await db.insert(questionsTable).values(q).returning();
      results.push(created);
    }
    return { count: results.length };
  });

export const getPlacementQuestionsAction = managerAction
  .schema(z.object({
    languageId: z.string().uuid(),
    cefrLevel: z.string().optional(),
    skill: z.string().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }))
  .action(async ({ parsedInput }) => {
    return await placementService.getQuestions(parsedInput);
  });

export const deletePlacementQuestionAction = managerAction
  .schema(z.object({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    await placementService.deleteQuestion(parsedInput.id);
    return { success: true };
  });

export const updatePlacementQuestionAction = managerAction
  .schema(z.object({
    id: z.number(),
    data: insertQuestionSchema.partial()
  }))
  .action(async ({ parsedInput }) => {
    await placementService.updateQuestion(parsedInput.id, parsedInput.data);
    return { success: true };
  });

export const getPlacementStatsAction = managerAction
  .schema(z.object({ languageId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    return await placementService.getStats(parsedInput.languageId);
  });

export const getPlacementDashboardAction = protectedAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    return await placementService.getPlacementDashboard(ctx.user.id);
  });

export const getTestResultAction = protectedAction
  .schema(z.object({ testId: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    return await placementService.getTestResult(parsedInput.testId, ctx.user.id);
  });

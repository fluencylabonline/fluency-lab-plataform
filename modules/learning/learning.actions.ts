"use server";

import { protectedAction } from "@/lib/safe-action";
import { learningService } from "./learning.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ================= SCHEMAS =================

const recordPracticeResultSchema = z.object({
  itemId: z.string(),
  lessonId: z.string().uuid(),
  quality: z.number().int().min(0).max(5),
});

const generatePlanSchema = z.object({
    languageId: z.string(),
});

const startLessonSchema = z.object({
  lessonId: z.string().uuid(),
});

const syncPracticeBatchSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    lessonId: z.string().uuid(),
    quality: z.number().int().min(0).max(5),
    practicedAt: z.coerce.date(),
  })),
});

// ================= ACTIONS =================

/**
 * Action to record the result of a practice session (SRS).
 */
export const recordPracticeResultAction = protectedAction
  .schema(recordPracticeResultSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await learningService.recordPracticeResult(
      ctx.user.id, 
      parsedInput.itemId, 
      parsedInput.quality,
      parsedInput.lessonId
    );
    
    // Revalidation logic
    revalidatePath("/student/learning");
    
    return result;
  });

/**
 * Action to generate a personalized plan for the student.
 */
export const generatePlanAction = protectedAction
  .schema(generatePlanSchema)
  .action(async ({ parsedInput, ctx }) => {
    const plan = await learningService.generatePersonalizedPlan(ctx.user.id, parsedInput.languageId);
    
    revalidatePath("/student/learning/plans");
    
    return { success: true, planId: plan.id };
  });

/**
 * Action to start a lesson (unlocks items).
 */
export const startLessonAction = protectedAction
  .schema(startLessonSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await learningService.startLesson(ctx.user.id, parsedInput.lessonId);
    revalidatePath("/student/learning");
    return result;
  });

/**
 * Action to sync a batch of practices from the offline queue.
 */
export const syncPracticeBatchAction = protectedAction
  .schema(syncPracticeBatchSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await learningService.recordBatchResult(
      ctx.user.id, 
      parsedInput.items.map(i => ({
        itemId: i.itemId,
        lessonId: i.lessonId,
        q: i.quality, // Map 'quality' from schema to 'q' expected by service
        practicedAt: i.practicedAt,
      }))
    );
    
    revalidatePath("/student/learning");
    revalidatePath("/student/curriculum"); // Revalidate curriculum if items status changed
    
    return result;
  });

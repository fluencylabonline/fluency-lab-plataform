"use server";

import { adminAction } from "@/lib/safe-action";
import { curriculumService } from "./curriculum.service";
import { mediaService } from "@/modules/media/media.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ================= SCHEMAS =================

const createLessonSchema = z.object({
  title: z.string().min(3),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  languageId: z.string().uuid(),
});

const attachMediaSchema = z.object({
  lessonId: z.string().uuid(),
  mediaUrl: z.string().url(),
});

const analyzeLessonSchema = z.object({
  lessonId: z.string().uuid(),
});

const enrichItemsSchema = z.object({
  lessonId: z.string().uuid(),
  items: z.array(z.object({
    lemma: z.string(),
    type: z.string(),
    contextual_meaning: z.string(),
  })),
});

const generateQuizSchema = z.object({
  lessonId: z.string().uuid(),
});

const updateQuizSchema = z.object({
  lessonId: z.string().uuid(),
  quizData: z.any(),
});

const finalizeLessonSchema = z.object({
  lessonId: z.string().uuid(),
});

const deleteLessonSchema = z.object({
  lessonId: z.string().uuid(),
});

const cloneLessonSchema = z.object({
  lessonId: z.string().uuid(),
});

const getSignedMediaUploadUrlSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
});

// ================= ACTIONS =================

/**
 * Action to create a new lesson (Step 1).
 */
export const createLessonAction = adminAction
  .schema(createLessonSchema)
  .action(async ({ parsedInput }) => {
    const lesson = await curriculumService.createLesson(parsedInput);
    revalidatePath("/manager/curriculum/lessons");
    return lesson;
  });

/**
 * Action to generate a signed URL for client-side direct upload.
 */
export const getSignedMediaUploadUrlAction = adminAction
  .schema(getSignedMediaUploadUrlSchema)
  .action(async ({ parsedInput, ctx }) => {
    const path = `curriculum/media/${ctx.user.id}/${Date.now()}-${parsedInput.fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const url = await mediaService.getSignedUploadUrl(path, parsedInput.contentType, ctx.user.id);
    return { url, path };
  });

/**
 * Action to attach media and transcribe (Step 2).
 */
export const attachMediaAction = adminAction
  .schema(attachMediaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await curriculumService.processLessonMedia(
      parsedInput.lessonId,
      parsedInput.mediaUrl,
      ctx.user.id
    );
    revalidatePath(`/manager/curriculum/lessons/${parsedInput.lessonId}`);
    return result;
  });

/**
 * Action to analyze lesson content (Step 3).
 */
export const analyzeLessonAction = adminAction
  .schema(analyzeLessonSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await curriculumService.analyzeLesson(parsedInput.lessonId, ctx.user.id);
    revalidatePath(`/manager/curriculum/lessons/${parsedInput.lessonId}`);
    return result;
  });

/**
 * Action to enrich items (Step 5).
 */
export const enrichItemsAction = adminAction
  .schema(enrichItemsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await curriculumService.enrichItems(parsedInput.lessonId, parsedInput.items, ctx.user.id);
    revalidatePath(`/manager/curriculum/lessons/${parsedInput.lessonId}`);
    return { success: true };
  });

/**
 * Action to generate quiz (Step 6).
 */
export const generateQuizAction = adminAction
  .schema(generateQuizSchema)
  .action(async ({ parsedInput, ctx }) => {
    const quiz = await curriculumService.generateQuiz(parsedInput.lessonId, ctx.user.id);
    revalidatePath(`/manager/curriculum/lessons/${parsedInput.lessonId}`);
    return quiz;
  });

/**
 * Action to update quiz data (Step 7).
 */
export const updateQuizAction = adminAction
  .schema(updateQuizSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateLessonQuiz(parsedInput.lessonId, parsedInput.quizData);
    revalidatePath(`/manager/curriculum/lessons/${parsedInput.lessonId}`);
    return { success: true };
  });

/**
 * Action to finalize lesson (Step 8/9).
 */
export const finalizeLessonAction = adminAction
  .schema(finalizeLessonSchema)
  .action(async ({ parsedInput }) => {
    const result = await curriculumService.finalizeLesson(parsedInput.lessonId);
    revalidatePath(`/manager/curriculum/lessons/${parsedInput.lessonId}`);
    revalidatePath(`/student/learning/plans`);
    return { success: true, practicesCount: result.practiceItems.length };
  });

/**
 * Action to delete a lesson.
 */
export const deleteLessonAction = adminAction
  .schema(deleteLessonSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.deleteLesson(parsedInput.lessonId);
    revalidatePath("/manager/curriculum/lessons");
    return { success: true };
  });

/**
 * Action to clone a lesson (Versioning).
 */
export const cloneLessonAction = adminAction
  .schema(cloneLessonSchema)
  .action(async ({ parsedInput }) => {
    const newLesson = await curriculumService.cloneLesson(parsedInput.lessonId);
    revalidatePath("/manager/curriculum/lessons");
    return newLesson;
  });

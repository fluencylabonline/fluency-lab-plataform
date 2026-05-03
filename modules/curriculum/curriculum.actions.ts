"use server";

import { protectedAction, managerAction } from "@/lib/safe-action";
import { curriculumService } from "./curriculum.service";
import { mediaService } from "@/modules/media/media.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { curriculumRepository } from "./curriculum.repository";
import { LanguageWithLessons, MediaWithLessons } from "./curriculum.types";

const createLessonSchema = z.object({
  title: z.string().min(3),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  languageId: z.uuid(),
});

const attachMediaSchema = z.object({
  lessonId: z.uuid(),
  mediaUrl: z.url(),
});

const analyzeLessonSchema = z.object({
  lessonId: z.uuid(),
});

const enrichItemsSchema = z.object({
  lessonId: z.uuid(),
  items: z.array(z.object({
    lemma: z.string(),
    type: z.string(),
    context: z.string(),
  })),
});

const updateItemsPrioritySchema = z.object({
  lessonId: z.uuid(),
  priorities: z.array(z.object({
    itemId: z.string(),
    priority: z.enum(["CORE", "SECONDARY"]),
  })),
});

const generateQuizSchema = z.object({
  lessonId: z.uuid(),
});

const updateQuizSchema = z.object({
  lessonId: z.uuid(),
  quizData: z.any(),
});

const finalizeLessonSchema = z.object({
  lessonId: z.uuid(),
});

const deleteLessonSchema = z.object({
  lessonId: z.uuid(),
});

const updateMediaSchema = z.object({
  mediaId: z.uuid(),
  transcriptionText: z.string().optional(),
  transcriptionTimestamps: z.any().optional(),
  config: z.any().optional(),
});

const updateLessonActionSchema = z.object({
  id: z.uuid(),
  contentText: z.string().optional(),
  contentJson: z.any().optional(),
  creationStep: z.number().optional(),
  analysisResultJson: z.any().optional(),
});

const cloneLessonSchema = z.object({
  lessonId: z.uuid(),
});

const getSignedMediaUploadUrlSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
});

const upsertRecessActivitySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  languageId: z.string().uuid(),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  contentJson: z.any().optional(),
  quizData: z.any().optional(),
});


/**
 * Action to update media record (Step 3).
 */
export const updateMediaAction = managerAction
  .inputSchema(updateMediaSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateMedia(parsedInput.mediaId, parsedInput);
    return { success: true };
  });

/**
 * Action to update lesson record (Step 5, 10, etc).
 */
export const updateLessonAction = managerAction
  .inputSchema(updateLessonActionSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateLesson(parsedInput.id, parsedInput);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.id}`);
    return { success: true };
  });

/**
 * Action to create a new lesson (Step 1).
 */
export const createLessonAction = managerAction
  .inputSchema(createLessonSchema)
  .action(async ({ parsedInput }) => {
    const lesson = await curriculumService.createLesson(parsedInput);
    revalidatePath("/hub/manager/learning/lessons");
    return lesson;
  });

/**
 * Action to generate a signed URL for client-side direct upload.
 */
export const getSignedMediaUploadUrlAction = managerAction
  .inputSchema(getSignedMediaUploadUrlSchema)
  .action(async ({ parsedInput, ctx }) => {
    const path = `curriculum/media/${ctx.user.id}/${Date.now()}-${parsedInput.fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const url = await mediaService.getSignedUploadUrl(path, parsedInput.contentType, ctx.user.id);
    return { url, path };
  });

/**
 * Action to attach media and transcribe (Step 2).
 */
export const attachMediaAction = managerAction
  .inputSchema(attachMediaSchema)
  .action(async ({ parsedInput }) => {
    const result = await curriculumService.processLessonMedia(
      parsedInput.lessonId,
      parsedInput.mediaUrl
    );
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return result;
  });

/**
 * Action to analyze lesson content (Step 3).
 */
export const analyzeLessonAction = managerAction
  .inputSchema(analyzeLessonSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await curriculumService.analyzeLesson(parsedInput.lessonId, ctx.user.id);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return result;
  });

/**
 * Action to enrich items (Step 5).
 */
export const enrichItemsAction = managerAction
  .inputSchema(enrichItemsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await curriculumService.enrichItems(parsedInput.lessonId, parsedInput.items, ctx.user.id);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return { success: true };
  });

/**
 * Action to enrich all items from analysisResultJson and link them to the lesson.
 * Called at the start of Step 8 to process merged items (transcription + lesson).
 */
export const enrichLinkedItemsAction = managerAction
  .inputSchema(z.object({ lessonId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const result = await curriculumService.enrichLinkedItems(parsedInput.lessonId, ctx.user.id);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return result;
  });

/**
 * Action to update the CORE/SECONDARY priority of linked lesson items.
 * Called after the manager reviews enriched items in Step 8.
 */
export const updateItemsPriorityAction = managerAction
  .inputSchema(updateItemsPrioritySchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateItemsPriority(parsedInput.lessonId, parsedInput.priorities);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return { success: true };
  });

/**
 * Action to generate quiz (Step 6).
 */
export const generateQuizAction = managerAction
  .inputSchema(generateQuizSchema)
  .action(async ({ parsedInput, ctx }) => {
    const quiz = await curriculumService.generateQuiz(parsedInput.lessonId, ctx.user.id);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return quiz;
  });

/**
 * Action to update quiz data (Step 7).
 */
export const updateQuizAction = managerAction
  .inputSchema(updateQuizSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateLessonQuiz(parsedInput.lessonId, parsedInput.quizData);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return { success: true };
  });

/**
 * Action to finalize lesson (Step 8/9).
 */
export const finalizeLessonAction = managerAction
  .inputSchema(finalizeLessonSchema)
  .action(async ({ parsedInput }) => {
    const result = await curriculumService.finalizeLesson(parsedInput.lessonId);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    revalidatePath(`/student/learning/plans`);
    return { success: true, practicesCount: result.practiceItems.length };
  });

/**
 * Action to delete a lesson.
 */
export const deleteLessonAction = managerAction
  .inputSchema(deleteLessonSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.deleteLesson(parsedInput.lessonId);
    revalidatePath("/hub/manager/learning/lessons");
    return { success: true };
  });

/**
 * Action to clone a lesson (Versioning).
 */
export const cloneLessonAction = managerAction
  .inputSchema(cloneLessonSchema)
  .action(async ({ parsedInput }) => {
    const newLesson = await curriculumService.cloneLesson(parsedInput.lessonId);
    revalidatePath("/hub/manager/learning/lessons");
    return newLesson;
  });

const deleteLessonItemSchema = z.object({
  lessonId: z.uuid(),
  itemId: z.string(),
});

/**
 * Action to remove a learning item from a lesson.
 */
export const deleteLessonItemAction = managerAction
  .inputSchema(deleteLessonItemSchema)
  .action(async ({ parsedInput }) => {
    await curriculumRepository.unlinkItemFromLesson(parsedInput.lessonId, parsedInput.itemId);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return { success: true };
  });

/**
 * Action to fetch all available languages.
 */
export const getLanguagesAction = protectedAction
  .inputSchema(z.object({}))
  .action(async () => {
    return await curriculumRepository.findAllLanguages() as LanguageWithLessons[];
  });

/**
 * Action to create a new language.
 */
export const createLanguageAction = managerAction
  .inputSchema(z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10),
  }))
  .action(async ({ parsedInput }) => {
    const result = await curriculumService.createLanguage(parsedInput);
    revalidatePath("/hub/manager/learning");
    return result;
  });

/**
 * Action to delete a language.
 */
export const deleteLanguageAction = managerAction
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput }) => {
    await curriculumService.deleteLanguage(parsedInput.id);
    revalidatePath("/hub/manager/learning");
    return { success: true };
  });

/**
 * Action to get all media for the library.
 */
export const getMediaListAction = managerAction
  .inputSchema(z.object({}))
  .action(async () => {
    return await curriculumService.getAllMedia() as MediaWithLessons[];
  });

/**
 * Action to create a media record from a URL.
 */
export const createMediaAction = managerAction
  .inputSchema(z.object({ url: z.string().url() }))
  .action(async ({ parsedInput }) => {
    const result = await curriculumService.createMedia(parsedInput.url);
    return result;
  });

/**
 * Action to delete a media record.
 */
export const deleteMediaAction = managerAction
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput }) => {
    await curriculumService.deleteMedia(parsedInput.id);
    return { success: true };
  });

/**
 * Action to trigger standalone transcription.
 */
export const transcribeMediaAction = managerAction
  .inputSchema(z.object({ mediaId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const result = await curriculumService.transcribeMediaStandalone(parsedInput.mediaId, ctx.user.id);
    return result;
  });

/**
 * Action to get learning items with filters.
 */
export const getLearningItemsAction = managerAction
  .inputSchema(z.object({
    languageId: z.uuid(),
    type: z.enum(["VOCABULARY", "STRUCTURE"]).optional(),
    search: z.string().optional(),
    limit: z.number().optional().default(50),
  }))
  .action(async ({ parsedInput }) => {
    return await curriculumService.getLearningItems(parsedInput);
  });

/**
 * Action to get lessons with filters.
 */
export const getLessonsAction = protectedAction
  .inputSchema(z.object({
    search: z.string().optional(),
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
    languageId: z.string().optional(),
    difficulty: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    return await curriculumRepository.findLessons(parsedInput);
  });

export const getLessonByIdAction = protectedAction
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    return await curriculumRepository.findLessonById(parsedInput.id);
  });

export const getRecessActivitiesAction = protectedAction
  .inputSchema(z.object({
    teacherId: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const activities = await curriculumService.getRecessActivities(parsedInput.teacherId);
      return { success: true, data: activities };
    } catch (error) {
      console.error("[getRecessActivitiesAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const upsertRecessActivityAction = protectedAction
  .inputSchema(upsertRecessActivitySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await curriculumService.upsertRecessActivity({
        ...parsedInput,
        teacherId: ctx.user.id,
      });
      revalidatePath("/hub/teacher/recess");
      return { success: true, data: result };
    } catch (error) {
      console.error("[upsertRecessActivityAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });



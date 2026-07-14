"use server";

import { protectedAction, managerAction } from "@/lib/safe-action";
import { curriculumService } from "./curriculum.service";
import { mediaService } from "@/modules/media/media.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { curriculumRepository } from "./curriculum.repository";
import { LanguageWithLessons, MediaWithLessons, Segment, QuizData, QuizQuestion, AnalysisResult, QualityResult, MediaConfig } from "./curriculum.types";
import type { JSONContent } from "@tiptap/core";
import crypto from "node:crypto";

const createLessonSchema = z.object({
  title: z.string().min(3),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  languageId: z.uuid(),
  nativeLanguageId: z.uuid(),
  isRecessActivity: z.boolean().optional(),
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
  quizData: z.unknown(),
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
  transcriptionTimestamps: z.unknown().optional(),
  config: z.unknown().optional(),
});

const updateLessonActionSchema = z.object({
  id: z.uuid(),
  contentText: z.string().optional(),
  contentJson: z.unknown().optional(),
  creationStep: z.number().optional(),
  analysisResultJson: z.unknown().optional(),
  qualityAnalysisJson: z.unknown().optional(),
  status: z.enum(["draft", "transcribing", "analyzing", "processing_items", "reviewing", "reviewing_quiz", "ready", "error"]).optional(),
  isRecessActivity: z.boolean().optional(),
});

const cloneLessonSchema = z.object({
  lessonId: z.uuid(),
});

const getSignedMediaUploadUrlSchema = z.object({
  lessonId: z.uuid().optional(),
  fileName: z.string(),
  contentType: z.string(),
});

const upsertRecessActivitySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  languageId: z.string().uuid(),
  nativeLanguageId: z.string().uuid(),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  contentJson: z.unknown().optional(),
  quizData: z.unknown().optional(),
});


/**
 * Action to update media record (Step 3).
 */
export const updateMediaAction = managerAction
  .metadata({ name: "updateMedia" })
  .inputSchema(updateMediaSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateMedia(parsedInput.mediaId, {
      ...parsedInput,
      transcriptionTimestamps: parsedInput.transcriptionTimestamps as Segment[],
      config: parsedInput.config as MediaConfig,
    });
    return { success: true };
  });

/**
 * Action to update lesson record (Step 5, 10, etc).
 */
export const updateLessonAction = managerAction
  .metadata({ name: "updateLesson" })
  .inputSchema(updateLessonActionSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateLesson(parsedInput.id, {
      ...parsedInput,
      contentJson: parsedInput.contentJson as JSONContent,
      analysisResultJson: parsedInput.analysisResultJson as AnalysisResult,
      qualityAnalysisJson: parsedInput.qualityAnalysisJson as QualityResult,
    });
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.id}`);
    revalidatePath("/hub/manager/learning/lessons");
    return { success: true };
  });

/**
 * Action to create a new lesson (Step 1).
 */
export const createLessonAction = managerAction
  .metadata({ name: "createLesson" })
  .inputSchema(createLessonSchema)
  .action(async ({ parsedInput }) => {
    const lesson = await curriculumService.createLesson(parsedInput);
    revalidatePath("/hub/manager/learning/lessons");
    return lesson;
  });

/**
 * Action to generate a signed URL for client-side direct upload.
 * Uses a deterministic path based on lessonId to prevent storage pollution.
 */
export const getSignedMediaUploadUrlAction = managerAction
  .metadata({ name: "getSignedMediaUploadUrl" })
  .inputSchema(getSignedMediaUploadUrlSchema)
  .action(async ({ parsedInput, ctx }) => {
    let path: string;

    if (parsedInput.lessonId) {
      // 1. Reserve the record in the DB first (only for lesson-linked media)
      await curriculumService.reserveMedia(parsedInput.lessonId);

      // 2. Generate the deterministic path for the lesson
      const extension = parsedInput.fileName.split(".").pop();
      const sanitizedName = `main.${extension}`;
      path = `curriculum/lessons/${parsedInput.lessonId}/media/${sanitizedName}`;
    } else {
      // General library upload path
      const extension = parsedInput.fileName.split(".").pop();
      const randomId = crypto.randomUUID();
      path = `media-library/${ctx.user.id}/${randomId}.${extension}`;
    }

    const url = await mediaService.getSignedUploadUrl(path, parsedInput.contentType, ctx.user.id);
    return { url, path };
  });

/**
 * Action to attach media and transcribe (Step 2).
 */
export const attachMediaAction = managerAction
  .metadata({ name: "attachMedia" })
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
  .metadata({ name: "analyzeLesson" })
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
  .metadata({ name: "enrichItems" })
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
  .metadata({ name: "enrichLinkedItems" })
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
  .metadata({ name: "updateItemsPriority" })
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
  .metadata({ name: "generateQuiz" })
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
  .metadata({ name: "updateQuiz" })
  .inputSchema(updateQuizSchema)
  .action(async ({ parsedInput }) => {
    await curriculumService.updateLessonQuiz(parsedInput.lessonId, parsedInput.quizData as QuizData);
    revalidatePath(`/hub/manager/learning/lessons/${parsedInput.lessonId}`);
    return { success: true };
  });

/**
 * Action to finalize lesson (Step 8/9).
 */
export const finalizeLessonAction = managerAction
  .metadata({ name: "finalizeLesson" })
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
  .metadata({ name: "deleteLesson" })
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
  .metadata({ name: "cloneLesson" })
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
  .metadata({ name: "deleteLessonItem" })
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
  .metadata({ name: "getLanguages" })
  .inputSchema(z.object({}))
  .action(async () => {
    return await curriculumRepository.findAllLanguages() as LanguageWithLessons[];
  });

/**
 * Action to create a new language.
 */
export const createLanguageAction = managerAction
  .metadata({ name: "createLanguage" })
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
  .metadata({ name: "deleteLanguage" })
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
  .metadata({ name: "getMediaList" })
  .inputSchema(z.object({}))
  .action(async () => {
    return await curriculumService.getAllMedia() as MediaWithLessons[];
  });

/**
 * Action to create a media record from a URL.
 */
export const createMediaAction = managerAction
  .metadata({ name: "createMedia" })
  .inputSchema(z.object({ url: z.string().url() }))
  .action(async ({ parsedInput }) => {
    const result = await curriculumService.createMedia(parsedInput.url);
    return result;
  });

/**
 * Action to delete a media record.
 */
export const deleteMediaAction = managerAction
  .metadata({ name: "deleteMedia" })
  .inputSchema(z.object({ id: z.uuid() }))
  .action(async ({ parsedInput }) => {
    await curriculumService.deleteMedia(parsedInput.id);
    return { success: true };
  });

/**
 * Action to trigger standalone transcription.
 */
export const transcribeMediaAction = managerAction
  .metadata({ name: "transcribeMedia" })
  .inputSchema(z.object({ mediaId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const result = await curriculumService.transcribeMediaStandalone(parsedInput.mediaId, ctx.user.id);
    return result;
  });

/**
 * Action to get learning items with filters.
 */
export const getLearningItemsAction = managerAction
  .metadata({ name: "getLearningItems" })
  .inputSchema(z.object({
    languageId: z.string().uuid().optional(),
    type: z.enum(["VOCABULARY", "STRUCTURE"]).optional(),
    level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    search: z.string().optional(),
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
  }))
  .action(async ({ parsedInput }) => {
    return await curriculumService.getLearningItems(parsedInput);
  });

export const enrichSingleItemAction = managerAction
  .metadata({ name: "enrichSingleItem" })
  .inputSchema(z.object({
    itemId: z.string(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const result = await curriculumService.enrichSingleItem(parsedInput.itemId, ctx.user.id);
    return result;
  });

/**
 * Action to get lessons with filters.
 */
export const getLessonsAction = protectedAction
  .metadata({ name: "getLessons" })
  .inputSchema(z.object({
    search: z.string().optional(),
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0),
    languageId: z.string().optional(),
    difficulty: z.string().optional(),
    status: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    return await curriculumRepository.findLessons(parsedInput);
  });

export const getLessonByIdAction = protectedAction
  .metadata({ name: "getLessonById" })
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    return await curriculumRepository.findLessonById(parsedInput.id);
  });

export const getRecessActivitiesAction = protectedAction
  .metadata({ name: "getRecessActivities" })
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
  .metadata({ name: "upsertRecessActivity" })
  .inputSchema(upsertRecessActivitySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await curriculumService.upsertRecessActivity({
        ...parsedInput,
        contentJson: parsedInput.contentJson as Record<string, unknown>,
        quizData: (parsedInput.quizData as unknown) as { questions: QuizQuestion[]; passingScore: number } | null,
        teacherId: ctx.user.id,
      });
      revalidatePath("/hub/teacher/recess");
      revalidatePath("/hub/manager/learning/lessons");
      return { success: true, data: result };
    } catch (error) {
      console.error("[upsertRecessActivityAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getWordOfTheDayAction = protectedAction
  .metadata({ name: "getWordOfTheDay" })
  .inputSchema(z.object({}))
  .action(async ({ ctx }) => {
    return await curriculumService.getWordOfTheDay(ctx.user.id);
  });



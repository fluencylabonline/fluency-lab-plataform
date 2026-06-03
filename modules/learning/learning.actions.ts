"use server";

import { protectedAction, permissionAction } from "@/lib/safe-action";
import { learningService } from "./learning.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { studentProfileSurveySchema } from "./learning.schema";


// ================= SCHEMAS =================

const recordPracticeResultSchema = z.object({
  itemId: z.string(),
  lessonId: z.uuid(),
  quality: z.number().int().min(0).max(5),
});

const generatePlanSchema = z.object({
  languageId: z.string(),
});

const startLessonSchema = z.object({
  lessonId: z.uuid(),
});

const syncPracticeBatchSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    lessonId: z.uuid(),
    quality: z.number().int().min(0).max(5),
    practicedAt: z.coerce.date(),
  })),
});

const createPlanTemplateSchema = z.object({
  name: z.string().min(3),
  languageId: z.uuid(),
  description: z.string().optional(),
});

const assignPlanSchema = z.object({
  templateId: z.uuid(),
  studentId: z.string(),
  startClassId: z.string().optional(),
});

const getStudentPlanGapSchema = z.object({
  studentId: z.string(),
});

const getStudentPlansSchema = z.object({
  studentId: z.string(),
});

const reorderLessonsSchema = z.object({
  planId: z.uuid(),
  lessonIds: z.array(z.uuid()),
});

const addLessonToPlanSchema = z.object({
  planId: z.uuid(),
  lessonId: z.uuid(),
});

const removeLessonFromPlanSchema = z.object({
  planId: z.uuid(),
  lessonId: z.uuid(),
});

const saveProfileSurveySchema = z.object({
  id: z.uuid().optional(),
  studentId: z.string().optional(),
  responses: z.any(),
});

const finalizeProfileSchema = z.object({
  profileId: z.uuid(),
});

const associateProfileSchema = z.object({
  profileId: z.uuid(),
  studentId: z.string(),
});


// ================= ACTIONS =================

/**
 * Action to record the result of a practice session (SRS).
 */
export const recordPracticeResultAction = protectedAction
  .metadata({ name: "recordPracticeResult" })
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
  .metadata({ name: "generatePlan" })
  .schema(generatePlanSchema)
  .action(async ({ ctx }) => {
    // Find the active profile for this student
    const profile = await learningService.findProfileByStudentId(ctx.user.id);
    if (!profile) throw new Error("Student profile not found. Please complete assessment.");

    const plan = await learningService.generatePersonalizedPlan(
      ctx.user.id, 
      profile.id,
      { allowSuggestions: false }
    );

    revalidatePath("/student/learning/plans");

    return { success: true, planId: plan.id };
  });

/**
 * Action to start a lesson (unlocks items).
 */
export const startLessonAction = protectedAction
  .metadata({ name: "startLesson" })
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
  .metadata({ name: "syncPracticeBatch" })
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

/**
 * Action for managers to create a generic plan template.
 */
export const createPlanTemplateAction = permissionAction("material.create")
  .metadata({ name: "createPlanTemplate" })
  .schema(createPlanTemplateSchema)
  .action(async ({ parsedInput }) => {
    const plan = await learningService.createPlanTemplate(parsedInput);
    revalidatePath("/hub/manager/learning");
    return { success: true, planId: plan.id };
  });

/**
 * Action for managers to assign a plan to a student.
 */
export const assignPlanAction = permissionAction("material.create")
  .metadata({ name: "assignPlan" })
  .schema(assignPlanSchema)
  .action(async ({ parsedInput }) => {
    const plan = await learningService.assignPlanToStudent(
      parsedInput.templateId, 
      parsedInput.studentId,
      parsedInput.startClassId
    );
    revalidatePath("/hub/manager/learning");
    return { success: true, planId: plan.id };
  });

/**
 * Action to get plan gap analysis for a student.
 */
export const getStudentPlanGapAction = permissionAction("material.view")
  .metadata({ name: "getStudentPlanGap" })
  .schema(getStudentPlanGapSchema)
  .action(async ({ parsedInput }) => {
    try {
      const data = await learningService.getStudentCurriculumGap(parsedInput.studentId);
      return { success: true, data };
    } catch (error) {
      console.error("[getStudentPlanGapAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Action to fetch all templates for the manager hub.
 */
export const getTemplatesAction = permissionAction("material.view")
  .metadata({ name: "getTemplates" })
  .schema(z.object({}))
  .action(async () => {
    try {
      const data = await learningService.getTemplatesForHub();
      return { success: true, data };
    } catch (error) {
      console.error("[getTemplatesAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Action to reorder lessons in a plan.
 */
export const reorderLessonsAction = permissionAction("material.create")
  .metadata({ name: "reorderLessons" })
  .schema(reorderLessonsSchema)
  .action(async ({ parsedInput }) => {
    await learningService.reorderLessons(parsedInput.planId, parsedInput.lessonIds);
    revalidatePath(`/hub/manager/learning/${parsedInput.planId}`);
    return { success: true };
  });

/**
 * Action to add a lesson to a plan.
 */
export const addLessonToPlanAction = permissionAction("material.create")
  .metadata({ name: "addLessonToPlan" })
  .schema(addLessonToPlanSchema)
  .action(async ({ parsedInput }) => {
    await learningService.addLessonToPlan(parsedInput.planId, parsedInput.lessonId);
    revalidatePath(`/hub/manager/learning/${parsedInput.planId}`);
    return { success: true };
  });

/**
 * Action to remove a lesson from a plan.
 */
export const removeLessonFromPlanAction = permissionAction("material.create")
  .metadata({ name: "removeLessonFromPlan" })
  .schema(removeLessonFromPlanSchema)
  .action(async ({ parsedInput }) => {
    await learningService.removeLessonFromPlan(parsedInput.planId, parsedInput.lessonId);
    revalidatePath(`/hub/manager/learning/${parsedInput.planId}`);
    return { success: true };
  });

/**
 * Action to fetch all plans assigned to a specific student.
 */
export const getStudentPlansAction = permissionAction("material.view")
  .metadata({ name: "getStudentPlans" })
  .schema(getStudentPlansSchema)
  .action(async ({ parsedInput }) => {
    try {
      const data = await learningService.getStudentPlans(parsedInput.studentId);
      return { success: true, data };
    } catch (error) {
      console.error("[getStudentPlansAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Action to save a draft of the student profile survey.
 */
export const saveProfileSurveyAction = protectedAction
  .metadata({ name: "saveProfileSurvey" })
  .schema(saveProfileSurveySchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await learningService.saveProfileSurvey(parsedInput, ctx.user.id);
    return { success: true, profile: result };
  });

/**
 * Action to finalize the student profile, triggering AI analysis and embedding.
 */
export const finalizeProfileAction = protectedAction
  .metadata({ name: "finalizeProfile" })
  .schema(finalizeProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // 1. Fetch current profile to validate responses against full schema
    const profile = await learningService.findProfileById(parsedInput.profileId);
    if (!profile) return { success: false, error: "Perfil não encontrado" };

    const validation = studentProfileSurveySchema.safeParse(profile.responses);
    if (!validation.success) {
      return { success: false, error: "Questionário incompleto ou inválido" };
    }

    const result = await learningService.finalizeProfile(parsedInput.profileId, ctx.user.id);
    revalidatePath("/hub/manager/students");
    revalidatePath("/hub/admin/students");
    return { success: true, profile: result };
  });

/**
 * Action for managers to associate an orphan profile to a student.
 */
export const associateProfileToStudentAction = permissionAction("student.support")
  .metadata({ name: "associateProfileToStudent" })
  .schema(associateProfileSchema)
  .action(async ({ parsedInput }) => {
    await learningService.associateStudentProfile(parsedInput.profileId, parsedInput.studentId);
    revalidatePath("/hub/manager/students");
    revalidatePath("/hub/admin/students");
    return { success: true };
  });

export const generatePersonalizedPlanAction = protectedAction
  .metadata({ name: "generatePersonalizedPlan" })
  .schema(z.object({
    profileId: z.string(),
    studentId: z.string(),
    allowSuggestions: z.boolean().default(false),
  }))
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
      throw new Error("Unauthorized");
    }

    const plan = await learningService.generatePersonalizedPlan(
      parsedInput.studentId,
      parsedInput.profileId,
      { allowSuggestions: parsedInput.allowSuggestions },
      ctx.user.id
    );

    revalidatePath(`/hub/manager/students/onboarding/${parsedInput.profileId}/view`);
    revalidatePath(`/hub/admin/students/onboarding/${parsedInput.profileId}/view`);
    return { success: true, planId: plan.id };
  });

const archiveProfileSchema = z.object({
  profileId: z.string().uuid(),
});

export const archiveProfileAction = permissionAction("student.support")
  .metadata({ name: "archiveProfile" })
  .schema(archiveProfileSchema)
  .action(async ({ parsedInput }) => {
    const profile = await learningService.findProfileById(parsedInput.profileId);
    if (!profile) return { success: false, error: "Perfil não encontrado" };

    if (profile.studentId) {
      return { success: false, error: "Apenas perfis sem alunos vinculados podem ser desativados" };
    }

    await learningService.archiveProfile(parsedInput.profileId);
    revalidatePath("/hub/manager/students/onboarding");
    revalidatePath("/hub/admin/students/onboarding");
    return { success: true };
  });


// ===================== PRACTICE SESSION ACTIONS =====================

const getDailyPracticeSchema = z.object({
  planId: z.string(),
  dayOverride: z.number().int().min(1).max(6).optional(),
});

const sessionProgressSchema = z.object({
  planId: z.string(),
  state: z.object({
    planId: z.string(),
    currentDay: z.number(),
    mode: z.string(),
    currentIndex: z.number(),
    results: z.array(z.object({
      itemId: z.string(),
      lessonId: z.string(),
      grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
      type: z.enum(["item", "structure"]),
      timestamp: z.coerce.date(),
    })),
    items: z.array(z.unknown()),
    lastUpdated: z.coerce.date(),
  }),
});

const processResultsSchema = z.object({
  planId: z.string(),
  results: z.array(z.object({
    itemId: z.string(),
    lessonId: z.string(),
    grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    type: z.enum(["item", "structure"]),
    timestamp: z.coerce.date(),
  })),
  isReplay: z.boolean().default(false),
  streak: z.number().int().min(0).default(0),
});

const purchaseReplaySchema = z.object({
  planId: z.string(),
  targetDay: z.number().int().min(1).max(6),
  currentDay: z.number().int().min(1).max(6),
});

/**
 * Fetches the daily practice session for a student's plan.
 * Returns PracticeItems ready to be rendered by the PracticeSession component.
 */
export const getDailyPracticeAction = protectedAction
  .metadata({ name: "getDailyPractice" })
  .schema(getDailyPracticeSchema)
  .action(async ({ parsedInput }) => {
    const session = await learningService.getPracticeCycle(
      parsedInput.planId,
      parsedInput.dayOverride
    );
    return session;
  });

/**
 * Retrieves the saved session state for resuming an interrupted practice session.
 */
export const getSessionProgressAction = protectedAction
  .metadata({ name: "getSessionProgress" })
  .schema(z.object({ planId: z.string() }))
  .action(async ({ parsedInput }) => {
    return learningService.getSessionState(parsedInput.planId);
  });

/**
 * Saves the current session state so the student can resume later.
 */
export const saveSessionProgressAction = protectedAction
  .metadata({ name: "saveSessionProgress" })
  .schema(sessionProgressSchema)
  .action(async ({ parsedInput, ctx }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return learningService.saveSessionState(ctx.user.id, parsedInput.planId, parsedInput.state as any);
  });

/**
 * Clears the session state after a session is successfully completed.
 */
export const clearSessionProgressAction = protectedAction
  .metadata({ name: "clearSessionProgress" })
  .schema(z.object({ planId: z.string() }))
  .action(async ({ parsedInput }) => {
    return learningService.clearSessionState(parsedInput.planId);
  });

/**
 * Processes and records the results of a completed practice session.
 * Calculates XP, updates SRS for each item, and returns the summary.
 */
export const processSessionResultsAction = protectedAction
  .metadata({ name: "processSessionResults" })
  .schema(processResultsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await learningService.processSessionResults(
      ctx.user.id,
      parsedInput.planId,
      parsedInput.results,
      parsedInput.isReplay,
      parsedInput.streak
    );
    revalidatePath("/hub/student/practice");
    return result;
  });

/**
 * Allows a student to purchase a replay of a completed practice day using XP.
 */
export const purchaseReplaySessionAction = protectedAction
  .metadata({ name: "purchaseReplaySession" })
  .schema(purchaseReplaySchema)
  .action(async ({ parsedInput, ctx }) => {
    return learningService.purchaseReplaySession(
      ctx.user.id,
      parsedInput.planId,
      parsedInput.targetDay,
      parsedInput.currentDay
    );
  });

export const getRoadmapAction = protectedAction
  .metadata({ name: "getRoadmap" })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    return learningService.getStudentRoadmap(ctx.user.id);
  });

export const getArchivedPlansAction = protectedAction
  .metadata({ name: "getArchivedPlans" })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    return learningService.getArchivedPlans(ctx.user.id);
  });

/**
 * Action to fetch learning statistics for the current student.
 */
export const getStudentLearningStatsAction = protectedAction
  .metadata({ name: "getStudentLearningStats" })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    try {
      const data = await learningService.getStudentLearningStats(ctx.user.id);
      return { success: true, data };
    } catch (error) {
      console.error("[getStudentLearningStatsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Action to fetch detailed info about items learned by the student.
 */
export const getLearnedItemsAction = protectedAction
  .metadata({ name: "getLearnedItems" })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    try {
      const data = await learningService.getLearnedItemsDetails(ctx.user.id);
      return { success: true, data };
    } catch (error) {
      console.error("[getLearnedItemsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

/**
 * Action to fetch detailed info about items reviewed today.
 */
export const getReviewedItemsAction = protectedAction
  .metadata({ name: "getReviewedItems" })
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    try {
      const data = await learningService.getReviewedItemsDetails(ctx.user.id);
      return { success: true, data };
    } catch (error) {
      console.error("[getReviewedItemsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

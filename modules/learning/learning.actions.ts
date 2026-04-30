"use server";

import { protectedAction, permissionAction } from "@/lib/safe-action";
import { learningService } from "./learning.service";
import { learningRepository } from "./learning.repository";
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
  .action(async ({ ctx }) => {
    // Find the active profile for this student
    const profile = await learningRepository.findProfileByStudentId(ctx.user.id);
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

/**
 * Action for managers to create a generic plan template.
 */
export const createPlanTemplateAction = permissionAction("material.create")
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
  .schema(saveProfileSurveySchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await learningService.saveProfileSurvey(parsedInput, ctx.user.id);
    return { success: true, profile: result };
  });

/**
 * Action to finalize the student profile, triggering AI analysis and embedding.
 */
export const finalizeProfileAction = protectedAction
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
    return { success: true, profile: result };
  });

/**
 * Action for managers to associate an orphan profile to a student.
 */
export const associateProfileToStudentAction = permissionAction("student.support")
  .schema(associateProfileSchema)
  .action(async ({ parsedInput }) => {
    await learningService.associateStudentProfile(parsedInput.profileId, parsedInput.studentId);
    revalidatePath("/hub/manager/students");
    return { success: true };
  });

export const generatePersonalizedPlanAction = protectedAction
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
    return { success: true, planId: plan.id };
  });

const archiveProfileSchema = z.object({
  profileId: z.string().uuid(),
});

export const archiveProfileAction = permissionAction("student.support")
  .schema(archiveProfileSchema)
  .action(async ({ parsedInput }) => {
    const profile = await learningService.findProfileById(parsedInput.profileId);
    if (!profile) return { success: false, error: "Perfil não encontrado" };

    if (profile.studentId) {
      return { success: false, error: "Apenas perfis sem alunos vinculados podem ser desativados" };
    }

    await learningService.archiveProfile(parsedInput.profileId);
    revalidatePath("/hub/manager/students/onboarding");
    return { success: true };
  });


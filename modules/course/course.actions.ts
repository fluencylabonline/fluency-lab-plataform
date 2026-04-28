"use server";

import { permissionAction } from "@/lib/safe-action";
import { courseService } from "./course.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { insertCourseSchema } from "./course.schema";

export const createCourseAction = permissionAction("course.manage")
  .inputSchema(insertCourseSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const course = await courseService.createCourse(ctx.user, parsedInput);
      revalidatePath("/hub/admin/courses");
      return { success: true, data: course };
    } catch (error) {
      console.error("[createCourseAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const updateCourseAction = permissionAction("course.manage")
  .inputSchema(z.object({
    id: z.string().uuid(),
    data: insertCourseSchema.partial()
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const course = await courseService.updateCourse(ctx.user, parsedInput.id, parsedInput.data);
      revalidatePath("/hub/admin/courses");
      return { success: true, data: course };
    } catch (error) {
      console.error("[updateCourseAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const deleteCourseAction = permissionAction("course.manage")
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.deleteCourse(ctx.user, parsedInput.id);
      revalidatePath("/hub/admin/courses");
      return { success: true, id: parsedInput.id };
    } catch (error) {
      console.error("[deleteCourseAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const enrollAction = permissionAction("course.learn")
  .inputSchema(z.object({ courseId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.enroll(ctx.user, parsedInput.courseId);
      revalidatePath("/hub/student/my-courses");
      return { success: true };
    } catch (error) {
      console.error("[enrollAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const updateProgressAction = permissionAction("course.learn")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    lessonId: z.string().uuid(),
    percentage: z.number().min(0).max(100)
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.updateProgress(
        ctx.user, 
        parsedInput.courseId, 
        parsedInput.lessonId, 
        parsedInput.percentage
      );
      return { success: true };
    } catch (error) {
      console.error("[updateProgressAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const addSectionAction = permissionAction("course.manage")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    title: z.string().min(1),
    order: z.number().int()
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const section = await courseService.addSection(ctx.user, parsedInput);
      revalidatePath(`/hub/admin/courses/${parsedInput.courseId}`);
      return { success: true, data: section };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const addLessonAction = permissionAction("course.manage")
  .inputSchema(z.object({
    sectionId: z.string().uuid(),
    courseId: z.string().uuid(), // For revalidation
    title: z.string().min(1),
    contentType: z.enum(["video", "text", "quiz"]),
    order: z.number().int()
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const lesson = await courseService.addLesson(ctx.user, parsedInput);
      revalidatePath(`/hub/admin/courses/${parsedInput.courseId}`);
      return { success: true, data: lesson };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const deleteSectionAction = permissionAction("course.manage")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    sectionId: z.string().uuid()
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.deleteSection(ctx.user, parsedInput.sectionId);
      revalidatePath(`/hub/admin/courses/${parsedInput.courseId}`);
      return { success: true, id: parsedInput.sectionId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const deleteLessonAction = permissionAction("course.manage")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    lessonId: z.string().uuid()
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.deleteLesson(ctx.user, parsedInput.lessonId);
      revalidatePath(`/hub/admin/courses/${parsedInput.courseId}`);
      return { success: true, id: parsedInput.lessonId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const updateLessonAction = permissionAction("course.manage")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    lessonId: z.string().uuid(),
    data: z.object({
      title: z.string().optional(),
      duration: z.string().optional(),
      contentBlocks: z.array(z.any()).optional(),
      quizId: z.string().uuid().nullable().optional(),
    })
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.updateLesson(ctx.user, parsedInput.courseId, parsedInput.lessonId, parsedInput.data);
      revalidatePath(`/hub/admin/courses/${parsedInput.courseId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const reorderLessonsAction = permissionAction("course.manage")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    lessonIds: z.array(z.string().uuid()),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.reorderLessons(ctx.user, parsedInput.lessonIds);
      revalidatePath(`/hub/admin/courses/${parsedInput.courseId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const reorderSectionsAction = permissionAction("course.manage")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    sectionIds: z.array(z.string().uuid()),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await courseService.reorderSections(ctx.user, parsedInput.sectionIds);
      revalidatePath(`/hub/admin/courses/${parsedInput.courseId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const createQuizAction = permissionAction("course.manage")
  .inputSchema(z.object({
    courseId: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    questions: z.array(z.any()),
    passingScore: z.number().min(0).max(100),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const quiz = await courseService.createQuiz(ctx.user, parsedInput);
      return { success: true, data: quiz };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

export const submitQuizAction = permissionAction("course.learn")
  .inputSchema(z.object({
    quizId: z.string().uuid(),
    answers: z.record(z.string(), z.string()),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await courseService.submitQuiz(ctx.user, parsedInput.quizId, parsedInput.answers);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

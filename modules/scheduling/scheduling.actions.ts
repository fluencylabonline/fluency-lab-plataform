"use server";

import { protectedAction, permissionAction } from "@/lib/safe-action";
import { schedulingService } from "./scheduling.service";
import { userService } from "@/modules/user/user.service";
import {
  allocateStudentSchema,
  updateSlotStatusSchema,
  grantCreditSchema,
  cancelClassSchema,
  rescheduleWithCreditSchema,
  createRecurrenceRuleSchema
} from "./scheduling.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { startOfMonth, endOfMonth } from "date-fns";
import { schedulingRepository } from "./scheduling.repository";

export const createRecurrenceRuleAction = permissionAction("class.update.any")
  .inputSchema(createRecurrenceRuleSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.createRule(ctx.user, {
        ...parsedInput,
        studentId: parsedInput.studentId || null,
        endDate: parsedInput.endDate || null,
      });
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[createRecurrenceRuleAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const allocateStudentAction = permissionAction("class.update.any")
  .inputSchema(allocateStudentSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.allocateStudentToRule(ctx.user, parsedInput.ruleId, parsedInput.studentId);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[allocateStudentAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const updateClassStatusAction = protectedAction
  .inputSchema(updateSlotStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.updateClassStatus(ctx.user, parsedInput.classId, parsedInput.status);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[updateClassStatusAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const grantCreditAction = permissionAction("credits.grant")
  .inputSchema(grantCreditSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.grantCredit(ctx.user, {
        ...parsedInput,
        expiresAt: parsedInput.expiresAt, // already a Date from schema if using z.date()
      });
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[grantCreditAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getStudentCreditsAction = protectedAction
  .inputSchema(z.object({ studentId: z.string(), onlyActive: z.boolean().default(true) }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      if (ctx.user.role !== "admin" && ctx.user.id !== parsedInput.studentId) {
        throw new Error("Acesso não autorizado aos dados do aluno.");
      }
      const credits = await schedulingRepository.findCreditsByStudent(parsedInput.studentId, parsedInput.onlyActive);
      return { success: true, data: credits };
    } catch (error) {
      console.error("[getStudentCreditsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const cancelClassAction = protectedAction
  .inputSchema(cancelClassSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.cancelClass(ctx.user, parsedInput.classId, parsedInput.reason);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[cancelClassAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const rescheduleWithCreditAction = protectedAction
  .inputSchema(rescheduleWithCreditSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.rescheduleWithCredit(
        ctx.user.id,
        parsedInput.originalClassId,
        parsedInput.newSlotId,
        parsedInput.creditId
      );
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[rescheduleWithCreditAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const convertToAvailableAction = protectedAction
  .inputSchema(z.object({ classId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.convertToAvailable(ctx.user, parsedInput.classId);
      revalidatePath("/");
      return { success: true } as { success: boolean; error?: string };
    } catch (error) {
      console.error("[convertToAvailableAction] Error:", error);
      return { success: false, error: (error as Error).message } as { success: boolean; error: string };
    }
  });

export const getTeacherScheduleAction = permissionAction("class.update.any")
  .inputSchema(z.object({
    teacherId: z.string(),
    month: z.number().min(0).max(11),
    year: z.number(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const start = new Date(parsedInput.year, parsedInput.month, 1);
      const end = new Date(parsedInput.year, parsedInput.month + 1, 0, 23, 59, 59);
      const schedule = await schedulingService.getTeacherClassesInRange(parsedInput.teacherId, start, end);
      return { success: true, data: schedule };
    } catch (error) {
      console.error("[getTeacherScheduleAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const checkSlotConflictAction = protectedAction
  .inputSchema(z.object({
    teacherId: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    excludeSlotId: z.string().uuid().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const conflict = await schedulingRepository.findOverlappingSlot(
        parsedInput.teacherId,
        new Date(parsedInput.startAt),
        new Date(parsedInput.endAt),
        parsedInput.excludeSlotId
      );

      if (conflict) {
        return {
          success: true,
          hasConflict: true,
          conflict: {
            startAt: conflict.startAt,
            endAt: conflict.endAt,
          }
        };
      }

      return { success: true, hasConflict: false };
    } catch (error) {
      console.error("[checkSlotConflictAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const deleteSlotAction = protectedAction
  .inputSchema(z.object({
    slotId: z.string().uuid(),
    scope: z.enum(["single", "future"])
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.deleteSlot(ctx.user, parsedInput.slotId, parsedInput.scope);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[deleteSlotAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const updateSlotAction = protectedAction
  .inputSchema(z.object({
    slotId: z.string().uuid(),
    scope: z.enum(["single", "future"]),
    data: z.object({
      lessonTitle: z.string().optional(),
      lessonId: z.string().uuid().optional().nullable(),
      planId: z.string().uuid().optional().nullable(),
      planName: z.string().optional().nullable(),
      startAt: z.string().datetime().optional(),
      endAt: z.string().datetime().optional(),
    })
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.updateSlot(
        ctx.user,
        parsedInput.slotId,
        {
          ...parsedInput.data,
          startAt: parsedInput.data.startAt ? new Date(parsedInput.data.startAt) : undefined,
          endAt: parsedInput.data.endAt ? new Date(parsedInput.data.endAt) : undefined,
        },
        parsedInput.scope
      );
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[updateSlotAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const swapSlotTeacherAction = permissionAction("class.update.any")
  .inputSchema(z.object({
    slotId: z.string().uuid(),
    newTeacherId: z.string(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.swapSlotTeacher(ctx.user, parsedInput.slotId, parsedInput.newTeacherId);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[swapSlotTeacherAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const updateSlotLessonAction = protectedAction
  .inputSchema(z.object({
    slotId: z.string().uuid(),
    lessonId: z.string().uuid(),
    lessonTitle: z.string(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.updateSlotLesson(ctx.user, parsedInput.slotId, parsedInput.lessonId, parsedInput.lessonTitle);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[updateSlotLessonAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getStudentScheduleAction = protectedAction
  .inputSchema(z.object({
    studentId: z.string(),
    month: z.number().min(0).max(11),
    year: z.number(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      if (ctx.user.role !== "admin" && ctx.user.id !== parsedInput.studentId) {
        throw new Error("Acesso não autorizado aos dados do aluno.");
      }
      const baseDate = new Date(parsedInput.year, parsedInput.month, 1);
      const start = startOfMonth(baseDate);
      const end = endOfMonth(baseDate);
      
      const schedule = await schedulingService.getStudentClassesInRange(parsedInput.studentId, start, end);
      return { success: true, data: schedule };
    } catch (error) {
      console.error("[getStudentScheduleAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getStudentCreditBalanceAction = protectedAction
  .inputSchema(z.object({ studentId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      if (ctx.user.role !== "admin" && ctx.user.id !== parsedInput.studentId) {
        throw new Error("Acesso não autorizado aos dados do aluno.");
      }
      const balance = await schedulingService.getStudentCreditBalance(parsedInput.studentId);
      return { success: true, data: balance } as { success: boolean; data: unknown; error?: string };
    } catch (error) {
      console.error("[getStudentCreditBalanceAction] Error:", error);
      return { success: false, error: (error as Error).message } as { success: boolean; data?: unknown; error: string };
    }
  });

export const getStudentRescheduleStatsAction = protectedAction
  .inputSchema(z.object({
    studentId: z.string(),
    month: z.number().min(0).max(11),
    year: z.number(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      if (ctx.user.role !== "admin" && ctx.user.id !== parsedInput.studentId) {
        throw new Error("Acesso não autorizado aos dados do aluno.");
      }
      const stats = await schedulingService.getStudentRescheduleStats(
        parsedInput.studentId,
        parsedInput.month,
        parsedInput.year
      );
      return { success: true, data: stats } as { success: boolean; data: unknown; error?: string };
    } catch (error) {
      console.error("[getStudentRescheduleStatsAction] Error:", error);
      return { success: false, error: (error as Error).message } as { success: boolean; data?: unknown; error: string };
    }
  });
export const getAvailableRulesAction = permissionAction("class.update.any")
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      const rules = await schedulingRepository.findAllRules();
      // Filter rules that don't have a student assigned AND are NORMAL type
      const available = rules.filter((r) => !r.studentId && r.type === "NORMAL");
      return { success: true, data: available };
    } catch (error) {
      console.error("[getAvailableRulesAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getStudentRulesAction = protectedAction
  .inputSchema(z.object({ studentId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      if (ctx.user.role !== "admin" && ctx.user.id !== parsedInput.studentId) {
        throw new Error("Acesso não autorizado aos dados do aluno.");
      }
      const rules = await schedulingRepository.findAllRules();
      const studentRules = rules.filter((r) => r.studentId === parsedInput.studentId && r.type === "NORMAL");
      return { success: true, data: studentRules };
    } catch (error) {
      console.error("[getStudentRulesAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const deallocateStudentAction = permissionAction("class.update.any")
  .inputSchema(z.object({ ruleId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.deallocateStudentFromRule(ctx.user, parsedInput.ruleId);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[deallocateStudentAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });
export const getTeacherEarningsAction = permissionAction("class.update.any")
  .inputSchema(z.object({
    teacherId: z.string(),
    month: z.number().min(0).max(11),
    year: z.number(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const start = new Date(parsedInput.year, parsedInput.month, 1);
      const end = new Date(parsedInput.year, parsedInput.month + 1, 0, 23, 59, 59);

      const teacherClasses = await schedulingService.getTeacherCompletedClasses(parsedInput.teacherId, start, end);

      const user = await userService.getUserById(parsedInput.teacherId);
      if (!user) throw new Error("Teacher not found");

      const count = teacherClasses.length;
      const total = teacherClasses.reduce((acc, cls) => {
        return acc + (cls.teacherHourlyRate ?? user.teacherHourlyRate);
      }, 0);

      return {
        success: true,
        data: {
          teacherClasses,
          earningsSummary: { count, total }
        }
      };
    } catch (error) {
      console.error("[getTeacherEarningsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const updateClassEarningsAction = permissionAction("class.update.any")
  .inputSchema(z.object({
    classId: z.string().uuid(),
    teacherHourlyRate: z.number().int().min(0),
  }))
  .action(async ({ parsedInput }) => {
    try {
      await schedulingRepository.updateSlot(parsedInput.classId, {
        teacherHourlyRate: parsedInput.teacherHourlyRate
      });
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[updateClassEarningsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getRecessImpactAction = protectedAction
  .inputSchema(z.object({
    startDate: z.date(),
    endDate: z.date(),
    teacherId: z.string().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const targetTeacherId = parsedInput.teacherId || ctx.user.id;
      const start = startOfDay(parsedInput.startDate);
      const end = endOfDay(parsedInput.endDate);
      const impact = await schedulingService.getRecessImpact(targetTeacherId, start, end);
      return { success: true, data: impact };
    } catch (error) {
      console.error("[getRecessImpactAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const validateRecessSLAAction = protectedAction
  .inputSchema(z.object({
    startDate: z.date(),
    endDate: z.date(),
    teacherId: z.string().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const targetTeacherId = parsedInput.teacherId || ctx.user.id;
      const start = startOfDay(parsedInput.startDate);
      const end = endOfDay(parsedInput.endDate);
      const result = await schedulingService.validateRecessSLA(targetTeacherId, start, end);
      return result; // result already has { success, data/error }
    } catch (error) {
      console.error("[validateRecessSLAAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getTeacherRecessesAction = protectedAction
  .inputSchema(z.object({
    teacherId: z.string().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const targetTeacherId = parsedInput.teacherId || ctx.user.id;
      const recesses = await schedulingService.getTeacherRecesses(targetTeacherId);
      return { success: true, data: recesses };
    } catch (error) {
      console.error("[getTeacherRecessesAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const confirmRecessAction = protectedAction
  .inputSchema(z.object({
    startDate: z.date(),
    endDate: z.date(),
    fallbackConfig: z.record(z.string(), z.object({
      lessonId: z.string(),
      message: z.string().optional(),
    })),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const start = startOfDay(parsedInput.startDate);
      const end = endOfDay(parsedInput.endDate);
      await schedulingService.registerRecess(ctx.user, {
        ...parsedInput,
        startDate: start,
        endDate: end
      });
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[confirmRecessAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getStudentClassesByTeacherAction = protectedAction
  .inputSchema(z.object({
    studentId: z.string(),
    month: z.number().min(0).max(11),
    year: z.number(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      if (ctx.user.role !== "admin" && ctx.user.id !== parsedInput.studentId) {
        throw new Error("Acesso não autorizado aos dados do aluno.");
      }
      const baseDate = new Date(parsedInput.year, parsedInput.month, 1);
      const start = startOfMonth(baseDate);
      const end = endOfMonth(baseDate);
      
      const data = await schedulingService.getStudentClassesByTeacher(ctx.user, parsedInput.studentId, start, end);
      return { success: true, data };
    } catch (error) {
      console.error("[getStudentClassesByTeacherAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const updateClassNotesAction = protectedAction
  .inputSchema(z.object({
    classId: z.string().uuid(),
    notes: z.string(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.updateClassNotes(ctx.user, parsedInput.classId, parsedInput.notes);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[updateClassNotesAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getTeacherAvailabilityAction = protectedAction
  .inputSchema(z.object({
    teacherId: z.string(),
    startDate: z.date(),
    endDate: z.date(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const slots = await schedulingService.getTeacherAvailableSlots(
        parsedInput.teacherId,
        parsedInput.startDate,
        parsedInput.endDate
      );
      return { success: true, data: slots } as { success: boolean; data: unknown; error?: string };
    } catch (error) {
      console.error("[getTeacherAvailabilityAction] Error:", error);
      return { success: false, error: (error as Error).message } as { success: boolean; data?: unknown; error: string };
    }
  });

export const rescheduleAction = protectedAction
  .inputSchema(z.object({
    originalClassId: z.string(),
    newSlotId: z.string(),
    creditId: z.string().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      await schedulingService.rescheduleClass(
        ctx.user.id,
        parsedInput.originalClassId,
        parsedInput.newSlotId,
        parsedInput.creditId
      );
      revalidatePath("/");
      return { success: true } as { success: boolean; error?: string };
    } catch (error) {
      console.error("[rescheduleAction] Error:", error);
      return { success: false, error: (error as Error).message } as { success: boolean; error: string };
    }
  });

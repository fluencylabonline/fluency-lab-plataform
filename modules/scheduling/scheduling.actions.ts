"use server";

import { protectedAction, permissionAction } from "@/lib/safe-action";
import { schedulingService } from "./scheduling.service";
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

export const updateClassStatusAction = permissionAction("class.update.any")
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
        expiresAt: new Date(parsedInput.expiresAt),
      });
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[grantCreditAction] Error:", error);
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
      return { success: true };
    } catch (error) {
      console.error("[convertToAvailableAction] Error:", error);
      return { success: false, error: (error as Error).message };
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

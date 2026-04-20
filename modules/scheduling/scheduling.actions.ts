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
  .inputSchema(z.object({ classId: z.string().uuid() }))
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

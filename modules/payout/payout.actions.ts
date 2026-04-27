"use server";

import { protectedAction, permissionAction } from "@/lib/safe-action";
import { z } from "zod";
import { payoutService } from "./payout.service";
import { revalidatePath } from "next/cache";
import { verifyPassword, checkUserHasPassword, verifySudoMode } from "@/lib/auth-server";

export const checkCurrentSudoRequirementAction = protectedAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    try {
      const hasPassword = await checkUserHasPassword(ctx.user.id);
      return { success: true, hasPassword };
    } catch (error) {
      return { success: false, hasPassword: true }; // Fallback para segurança
    }
  });

export const processTeacherPayoutAction = permissionAction("class.update.any")
  .schema(z.object({
    teacherId: z.string(),
    month: z.number().min(0).max(11),
    year: z.number(),
    password: z.string().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      // 1. Verify sudo (Password if needed, automatic if Google)
      const isValid = await verifySudoMode(ctx.user.id, ctx.user.email!, parsedInput.password);
      if (!isValid) {
        throw new Error("Verificação de identidade falhou ou senha incorreta.");
      }

      const payout = await payoutService.processPayout(
        parsedInput.teacherId,
        parsedInput.month,
        parsedInput.year
      );
      
      revalidatePath("/");
      return { success: true, data: payout };
    } catch (error) {
      console.error("[processTeacherPayoutAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getTeacherUnpaidClassesAction = protectedAction
  .schema(z.object({
    teacherId: z.string(),
    month: z.number().min(0).max(11),
    year: z.number(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const classes = await payoutService.getTeacherUnpaidClasses(
        parsedInput.teacherId,
        parsedInput.month,
        parsedInput.year
      );
      
      return { success: true, data: classes };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

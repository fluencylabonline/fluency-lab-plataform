"use server";

import { protectedAction, permissionAction } from "@/lib/safe-action";
import { z } from "zod";
import { payoutService } from "./payout.service";
import { revalidatePath } from "next/cache";
import { checkUserHasPassword, verifySudoMode } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { payoutsTable } from "./payout.schema";

export const checkCurrentSudoRequirementAction = protectedAction
  .schema(z.void())
  .metadata({ name: "checkCurrentSudoRequirementAction" })
  .action(async ({ ctx }) => {
    try {
      const hasPassword = await checkUserHasPassword(ctx.user.id);
      return { success: true, hasPassword };
    } catch {
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
  .metadata({ name: "processTeacherPayoutAction" })
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
  .metadata({ name: "getTeacherUnpaidClassesAction" })
  .action(async ({ parsedInput, ctx }) => {
    try {
      // Security: Only the teacher themselves or an admin/manager can see unpaid classes
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.id !== parsedInput.teacherId) {
        throw new Error("Acesso negado.");
      }

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

export const resendTeacherPayoutEmailAction = protectedAction
  .schema(z.object({
    payoutId: z.string().uuid(),
  }))
  .metadata({ name: "resendTeacherPayoutEmailAction" })
  .action(async ({ parsedInput, ctx }) => {
    try {
      const payout = await db.query.payoutsTable.findFirst({
        where: eq(payoutsTable.id, parsedInput.payoutId),
      });

      if (!payout) {
        throw new Error("Pagamento não encontrado.");
      }

      // Security check: Only the teacher themselves or admin/manager can trigger resend
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.id !== payout.teacherId) {
        throw new Error("Acesso negado.");
      }

      await payoutService.resendPayoutEmail(parsedInput.payoutId);

      return { success: true };
    } catch (error) {
      console.error("[resendTeacherPayoutEmailAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getTeacherProjectionsAction = protectedAction
  .schema(z.object({
    teacherId: z.string(),
    month: z.number(),
    year: z.number(),
  }))
  .metadata({ name: "getTeacherProjectionsAction" })
  .action(async ({ parsedInput, ctx }) => {
    try {
      // Security check: Only the teacher themselves or admin/manager can view projections
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager" && ctx.user.id !== parsedInput.teacherId) {
        throw new Error("Acesso negado.");
      }

      const projections = await payoutService.getEarningsProjections(
        parsedInput.teacherId,
        parsedInput.month,
        parsedInput.year
      );

      return { success: true, data: projections };
    } catch (error) {
      console.error("[getTeacherProjectionsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

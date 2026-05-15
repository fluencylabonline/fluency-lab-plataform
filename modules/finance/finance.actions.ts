"use server";

import { protectedAction } from "@/lib/safe-action";
import { financeService } from "./finance.service";
import { createTransactionSchema, upsertFiscalConfigSchema } from "./finance.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { payoutService } from "../payout/payout.service";

export const createTransactionAction = protectedAction
  .metadata({ name: "createTransaction" })
  .schema(createTransactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
      return { success: false, error: "Acesso negado" };
    }

    try {
      await financeService.createTransaction(ctx.user.id, parsedInput);
      revalidatePath("/hub/admin/finances");
      return { success: true };
    } catch (error) {
      console.error("[createTransactionAction] Error:", error);
      return { success: false, error: "Falha ao criar transação" };
    }
  });

export const updateTransactionAction = protectedAction
  .metadata({ name: "updateTransaction" })
  .schema(z.object({
    id: z.string().uuid(),
    data: createTransactionSchema.partial(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
      return { success: false, error: "Acesso negado" };
    }

    try {
      await financeService.updateTransaction(parsedInput.id, parsedInput.data);
      revalidatePath("/hub/admin/finances");
      return { success: true };
    } catch (error) {
      console.error("[updateTransactionAction] Error:", error);
      return { success: false, error: "Falha ao atualizar transação" };
    }
  });

export const deleteTransactionAction = protectedAction
  .metadata({ name: "deleteTransaction" })
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin") {
      return { success: false, error: "Acesso negado" };
    }

    try {
      await financeService.deleteTransaction(parsedInput.id);
      revalidatePath("/hub/admin/finances");
      return { success: true };
    } catch (error) {
      console.error("[deleteTransactionAction] Error:", error);
      return { success: false, error: "Falha ao deletar transação" };
    }
  });

export const payTeacherAction = protectedAction
  .metadata({ name: "payTeacher" })
  .schema(z.object({
    teacherId: z.string(),
    month: z.number(),
    year: z.number(),
    password: z.string().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
      return { success: false, error: "Acesso negado" };
    }

    try {
      // Re-using the payoutService logic directly
      await payoutService.processPayout(
        parsedInput.teacherId,
        parsedInput.month,
        parsedInput.year
      );

      revalidatePath("/hub/admin/finances");
      return { success: true };
    } catch (error) {
      console.error("[payTeacherAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const upsertFiscalConfigAction = protectedAction
  .metadata({ name: "upsertFiscalConfig" })
  .schema(upsertFiscalConfigSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin") {
      return { success: false, error: "Acesso negado" };
    }

    try {
      await financeService.upsertFiscalConfig(parsedInput);
      revalidatePath("/hub/admin/finances");
      return { success: true };
    } catch (error) {
      console.error("[upsertFiscalConfigAction] Error:", error);
      return { success: false, error: "Falha ao salvar configuração fiscal" };
    }
  });

export const getTransactionsAction = protectedAction
  .metadata({ name: "getTransactions" })
  .schema(z.object({
    type: z.enum(["income", "expense"]).optional(),
    status: z.enum(["pending", "paid", "cancelled"]).optional(),
    year: z.number().optional(),
    month: z.number().optional(),
  }))
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
      return { success: false, error: "Acesso negado" };
    }

    try {
      let start: Date | undefined;
      let end: Date | undefined;

      if (parsedInput.year !== undefined) {
        if (parsedInput.month !== undefined) {
          start = new Date(parsedInput.year, parsedInput.month, 1);
          end = new Date(parsedInput.year, parsedInput.month + 1, 0, 23, 59, 59);
        } else {
          start = new Date(parsedInput.year, 0, 1);
          end = new Date(parsedInput.year, 11, 31, 23, 59, 59);
        }
      }

      const transactions = await financeService.getTransactions({
        type: parsedInput.type,
        status: parsedInput.status,
        start,
        end,
      });

      return { success: true, data: transactions };
    } catch {
      return { success: false, error: "Falha ao buscar transações" };
    }
  });

export const getCategoriesAction = protectedAction
  .metadata({ name: "getCategories" })
  .schema(z.void())
  .action(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
      return { success: false, error: "Acesso negado" };
    }
    try {
      const categories = await financeService.getCategories();
      return { success: true, data: categories };
    } catch {
      return { success: false, error: "Falha ao buscar categorias" };
    }
  });

export const getFiscalConfigAction = protectedAction
  .metadata({ name: "getFiscalConfig" })
  .schema(z.object({ year: z.number() }))
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.role !== "admin") {
      return { success: false, error: "Acesso negado" };
    }
    try {
      const config = await financeService.getFiscalConfig(parsedInput.year);
      return { success: true, data: config };
    } catch {
      return { success: false, error: "Falha ao buscar configuração fiscal" };
    }
  });

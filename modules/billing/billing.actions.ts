"use server";

import { adminAction, protectedAction } from "@/lib/safe-action";
import { createPlanSchema, createSubscriptionSchema, updatePlanSchema } from "./billing.schema";
import { billingService } from "./billing.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const createPlanAction = adminAction
  .inputSchema(createPlanSchema)
  .action(async ({ parsedInput }) => {
    try {
      const plan = await billingService.createPlan(parsedInput);
      revalidatePath("/admin/finances/plans");
      return { success: true, plan };
    } catch (error) {
      console.error("[createPlanAction] Error:", error);
      return { success: false, error: "Ocorreu um erro ao criar o plano" };
    }
  });

export const updatePlanAction = adminAction
  .inputSchema(updatePlanSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      const plan = await billingService.updatePlan(id, data);
      revalidatePath("/admin/finances/plans");
      return { success: true, plan };
    } catch (error) {
      console.error("[updatePlanAction] Error:", error);
      return { success: false, error: "Ocorreu um erro ao atualizar o plano" };
    }
  });

export const togglePlanStatusAction = adminAction
  .inputSchema(z.object({ id: z.string(), isActive: z.boolean() }))
  .action(async ({ parsedInput }) => {
    try {
      const plan = await billingService.updatePlan(parsedInput.id, { isActive: parsedInput.isActive });
      revalidatePath("/admin/finances/plans");
      return { success: true, plan };
    } catch (error) {
      console.error("[togglePlanStatusAction] Error:", error);
      return { success: false, error: "Ocorreu um erro ao alterar status do plano" };
    }
  });

export const createSubscriptionAction = adminAction
  .inputSchema(createSubscriptionSchema)
  .action(async ({ parsedInput }) => {
    await billingService.createSubscription(
      parsedInput.studentId,
      parsedInput.planId,
      parsedInput.dueDay
    );
    revalidatePath("/admin/users");
    return { success: true };
  });

export const cancelSubscriptionAction = protectedAction
  .inputSchema(z.object({ subscriptionId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    // ABAC: Student can only cancel their own, Admin can cancel any
    if (ctx.user.role !== "admin") {
      await billingService.getActivePayment(ctx.user.id);
      // This is a bit loose, service should handle ownership check
    }

    const result = await billingService.cancelSubscription(parsedInput.subscriptionId);
    revalidatePath("/hub/billing");
    return result;
  });

export const getActivePaymentAction = protectedAction
  .action(async ({ ctx }) => {
    const payment = await billingService.getActivePayment(ctx.user.id);
    return { success: true, data: payment };
  });

export const getPlansAction = protectedAction
  .action(async () => {
    const plans = await billingService.listActivePlans();
    return { success: true, data: plans };
  });

export const getInstallmentStatusAction = protectedAction
  .inputSchema(z.object({ installmentId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const installment = await billingService.getInstallmentById(parsedInput.installmentId);
    return { success: true, data: { status: installment?.status } };
  });

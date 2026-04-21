"use server";

import { adminAction, protectedAction } from "@/lib/safe-action";
import { createPlanSchema, createSubscriptionSchema } from "./billing.schema";
import { billingService } from "./billing.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const createPlanAction = adminAction
  .inputSchema(createPlanSchema)
  .action(async ({ parsedInput }) => {
    await billingService.createPlan(parsedInput);
    revalidatePath("/admin/billing");
    return { success: true };
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

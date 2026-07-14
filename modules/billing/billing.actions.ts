"use server";

import { adminAction, protectedAction, managerAction } from "@/lib/safe-action";
import { createPlanSchema, createSubscriptionSchema, updatePlanSchema, updateInstallmentSchema, changeStudentPlanSchema } from "./billing.schema";
import { billingService } from "./billing.service";
import { billingRepository } from "./billing.repository";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const createPlanAction = adminAction
  .metadata({ name: "createPlan" })
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
  .metadata({ name: "updatePlan" })
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

export const deletePlanAction = adminAction
  .metadata({ name: "deletePlan" })
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    try {
      await billingService.deletePlan(parsedInput.id);
      revalidatePath("/admin/finances/plans");
      return { success: true };
    } catch (error) {
      console.error("[deletePlanAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getAffectedStudentsAction = adminAction
  .metadata({ name: "getAffectedStudents" })
  .inputSchema(z.object({ planId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    try {
      const students = await billingService.getAffectedStudents(parsedInput.planId);
      return { success: true, students };
    } catch (error) {
      console.error("[getAffectedStudentsAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const togglePlanStatusAction = adminAction
  .metadata({ name: "togglePlanStatus" })
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
  .metadata({ name: "createSubscription" })
  .inputSchema(createSubscriptionSchema)
  .action(async ({ parsedInput }) => {
    await billingService.createSubscription(
      parsedInput.studentId,
      parsedInput.planId,
      parsedInput.dueDay
    );
    revalidatePath("/hub/admin/users");
    revalidatePath("/hub/manager/users");
    return { success: true };
  });

export const cancelSubscriptionAction = protectedAction
  .metadata({ name: "cancelSubscription" })
  .inputSchema(z.object({ subscriptionId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    // 1. Ownership validation (IDOR prevention)
    const subscription = await billingRepository.findSubscriptionById(parsedInput.subscriptionId);
    if (!subscription) return { success: false, error: "notFound" };

    if (ctx.user.role !== "admin" && subscription.studentId !== ctx.user.id) {
      throw new Error("UNAUTHORIZED");
    }

    const result = await billingService.cancelSubscription(parsedInput.subscriptionId);
    revalidatePath("/hub/billing");
    return result;
  });

export const getActivePaymentAction = protectedAction
  .metadata({ name: "getActivePayment" })
  .action(async ({ ctx }) => {
    const payment = await billingService.getActivePayment(ctx.user.id);
    return { success: true, data: payment };
  });

export const getPlansAction = protectedAction
  .metadata({ name: "getPlans" })
  .action(async () => {
    const plans = await billingService.listActivePlans();
    return { success: true, data: plans };
  });

export const getInstallmentStatusAction = protectedAction
  .metadata({ name: "getInstallmentStatus" })
  .inputSchema(z.object({ installmentId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const installment = await billingService.getInstallmentById(parsedInput.installmentId);
    if (!installment) return { success: false, error: "notFound" };

    const subscription = await billingRepository.findSubscriptionById(installment.subscriptionId);
    if (ctx.user.role !== "admin" && subscription?.studentId !== ctx.user.id) {
      throw new Error("UNAUTHORIZED");
    }

    return { success: true, data: { status: installment.status } };
  });

import { verifySudoMode } from "@/lib/auth-server";

export const updateInstallmentAction = adminAction
  .metadata({ name: "updateInstallment" })
  .inputSchema(updateInstallmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { id, password, ...data } = parsedInput;

      // Sensitive check: marking as paid manually or updating the amount requires password confirmation
      if (data.status === "paid" || data.amount !== undefined) {
        if (!password) {
          const errorMsg = data.status === "paid"
            ? "A confirmação de senha é obrigatória para marcar como paga."
            : "A confirmação de senha é obrigatória para alterar o valor da parcela.";
          return { success: false, error: errorMsg };
        }

        const isValid = await verifySudoMode(ctx.user.id, ctx.user.email!, password);
        if (!isValid) {
          return { success: false, error: "Senha incorreta. Ação não autorizada." };
        }

        if (data.status === "paid") {
          await billingService.markInstallmentAsPaid(id, undefined, {
            id: ctx.user.id,
            name: ctx.user.name,
          });
        }

        if (data.amount !== undefined) {
          await billingService.updateInstallment(id, { amount: data.amount }, {
            id: ctx.user.id,
            name: ctx.user.name,
          });
        }
      } else {
        // Other changes (status overdue, cancelled)
        await billingService.updateInstallment(id, data, {
          id: ctx.user.id,
          name: ctx.user.name,
        });
      }

      revalidatePath("/hub/admin/users");
      revalidatePath("/hub/manager/users");
      return { success: true };
    } catch (error) {
      console.error("[updateInstallmentAction] Error:", error);
      return { success: false, error: "Erro ao atualizar parcela" };
    }
  });

export const getStudentPaymentsAction = protectedAction
  .metadata({ name: "getStudentPayments" })
  .action(async ({ ctx }) => {
    const payments = await billingService.getStudentPayments(ctx.user.id);
    return { success: true, data: payments };
  });

export const getPaymentDetailsAction = protectedAction
  .metadata({ name: "getPaymentDetails" })
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const details = await billingService.getPaymentDetailsForReceipt(parsedInput.id);
    if (!details) return { success: false, error: "Pagamento não encontrado" };

    // Ownership check by studentId
    const isOwner = details.studentId === ctx.user.id;
    const isAdmin = ctx.user.role === "admin" || ctx.user.role === "manager";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Acesso negado" };
    }

    return { success: true, data: details };
  });

export const syncInstallmentPaymentAction = protectedAction
  .metadata({ name: "syncInstallmentPayment" })
  .inputSchema(z.object({ installmentId: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await billingService.syncInstallmentStatus(parsedInput.installmentId, ctx.user.id);
      
      revalidatePath("/student/profile");
      revalidatePath("/student/billing");
      revalidatePath("/onboarding");
      
      return { success: true, status: result.status };
    } catch (error) {
      console.error("[syncInstallmentPaymentAction] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar status de pagamento";
      return { success: false, error: errorMessage };
    }
  });

export const generateInstallmentInvoiceAction = protectedAction
  .metadata({ name: "generateInstallmentInvoice" })
  .inputSchema(z.object({ installmentId: z.uuid(), force: z.boolean().optional() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const installment = await billingService.getInstallmentById(parsedInput.installmentId);
      if (!installment) return { success: false, error: "notFound" };

      const subscription = await billingRepository.findSubscriptionById(installment.subscriptionId);
      if (ctx.user.role !== "admin" && subscription?.studentId !== ctx.user.id) {
        throw new Error("UNAUTHORIZED");
      }

      await billingService.generateInvoiceForInstallment(parsedInput.installmentId, parsedInput.force ?? false);

      revalidatePath("/student/profile");
      revalidatePath("/student/billing");
      revalidatePath("/hub/admin/users");
      revalidatePath("/hub/manager/users");
      return { success: true };
    } catch (error) {
      console.error("[generateInstallmentInvoiceAction] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao gerar código de pagamento";
      return { success: false, error: errorMessage };
    }
  });


export const changeStudentPlanAction = managerAction
  .metadata({ name: "changeStudentPlan" })
  .inputSchema(changeStudentPlanSchema)
  .action(async ({ parsedInput }) => {
    try {
      await billingService.changeStudentPlan(parsedInput.studentId, parsedInput.planId);
      revalidatePath("/hub/admin/users");
      revalidatePath("/hub/manager/users");
      return { success: true };
    } catch (error) {
      console.error("[changeStudentPlanAction] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao alterar plano do estudante";
      return { success: false, error: errorMessage };
    }
  });

export const resendInstallmentReminderAction = managerAction
  .metadata({ name: "resendInstallmentReminder" })
  .inputSchema(z.object({ installmentId: z.uuid() }))
  .action(async ({ parsedInput }) => {
    try {
      await billingService.resendInstallmentReminder(parsedInput.installmentId);
      revalidatePath("/student/profile");
      revalidatePath("/student/billing");
      revalidatePath("/hub/admin/users");
      revalidatePath("/hub/manager/users");
      return { success: true };
    } catch (error) {
      console.error("[resendInstallmentReminderAction] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao reenviar lembrete de pagamento";
      return { success: false, error: errorMessage };
    }
  });

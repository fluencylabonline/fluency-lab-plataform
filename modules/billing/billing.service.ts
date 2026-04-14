import { billingRepository } from "./billing.repository";
import { abacate } from "@/lib/abacate-pay";
// PaymentMethod enum is missing from SDK runtime, using strings instead
import { userService } from "../user/user.service";
import { communicationService } from "../communication/communication.service";
import { notificationService } from "../notification/notification.service";
import { addMonths, startOfDay, setDate, addDays, endOfDay } from "date-fns";
import { env } from "@/env";
import { db } from "@/lib/db";
import { installmentsTable } from "./billing.schema";
import { eq, asc, and } from "drizzle-orm";

export const billingService = {
  // 1. Setup Plans (Sync with AbacatePay)
  async createPlan(data: { name: string; price: number; durationMonths: number; description?: string }) {
    // Create Product (Plan) in AbacatePay
    const product = await abacate.products.create({
      externalId: `plan-${Date.now()}`,
      name: data.name,
      price: data.price,
      currency: "BRL",
      description: data.description,
    });

    return billingRepository.createPlan({
      ...data,
      abacatePayProductId: product.id,
    });
  },

  // 2. Create Student Subscription
  async createSubscription(studentId: string, planId: string, dueDay: number) {
    const plan = await billingRepository.findPlanById(planId);
    if (!plan) throw new Error("Plano não encontrado");

    // Ensure student is synced with AbacatePay
    await userService.syncAbacatePayCustomer(studentId);

    const subscription = await billingRepository.createSubscription({
      studentId,
      planId,
      dueDay,
      status: "active",
      startDate: new Date(),
    });

    // Generate N empty installments
    const installments = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= plan.durationMonths; i++) {
      // Set the due date based on the dueDay
      const dueDate = setDate(addMonths(currentDate, i - 1), dueDay);
      
      // If today is past the dueDay of this month, the first installment is for next month?
      // Or if it's the first month, maybe we charge now.
      // Rule: Let's just generate them sequentially.
      
      installments.push({
        subscriptionId: subscription.id,
        status: "pending" as const,
        dueDate: startOfDay(dueDate),
        amount: plan.price,
        orderIndex: i,
      });
    }

    await billingRepository.createInstallments(installments);
    return subscription;
  },

  // 3. Automated Billing (Cron)
  async generatePendingInvoices() {
    const searchDate = new Date();
    searchDate.setDate(searchDate.getDate() + 7);

    const pendingInstallments = await billingRepository.findSubscriptionsForCron(searchDate);

    for (const installment of pendingInstallments) {
      const sub = await billingRepository.findSubscriptionById(installment.subscriptionId);
      if (!sub || sub.status !== "active" || !sub.plan || !sub.plan.abacatePayProductId) continue;

      const hasOverdue = await billingRepository.hasOverduePayments(sub.id);
      const hasPending = await billingRepository.hasPendingPayments(sub.id);
      
      if (hasOverdue || hasPending) continue;

      const student = await userService.getUser(sub.studentId);
      if (!student) continue;

      // Ensure student has required data for Transparent PIX
      if (!student.taxId || !student.cellphone) {
        continue; 
      }

      const pix = await abacate.pix.create({
        amount: Math.round(installment.amount * 100),
        description: `Mensalidade ${sub.plan.name} - ${installment.orderIndex}/${sub.plan.durationMonths}`,
        customer: {
          name: student.name,
          email: student.email,
          taxId: student.taxId,
          cellphone: student.cellphone,
        },
        metadata: {
          installmentId: installment.id,
          subscriptionId: sub.id,
        },
      });

      await billingRepository.updateInstallment(installment.id, {
        abacatePayBillingId: pix.id,
        pixPayload: pix.brCode,
        pixImage: pix.brCodeBase64,
        status: "pending",
      });

      // Send Email with dashboard link
      await communicationService.sendNewInvoiceEmail(student.email, {
        studentName: student.name,
        amount: installment.amount,
        dueDate: installment.dueDate,
        checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/billing`,
      });
    }
  },

  // 4. Cancellation logic
  async cancelSubscription(subscriptionId: string) {
    const sub = await billingRepository.findSubscriptionById(subscriptionId);
    if (!sub) throw new Error("Assinatura não encontrada");

    // Logic: 50% fee if not in the last month
    const installments = await db.query.installmentsTable.findMany({
      where: eq(installmentsTable.subscriptionId, sub.id),
      orderBy: [asc(installmentsTable.orderIndex)],
    });

    const activeInstallment = installments.find(i => i.status === "pending");
    const isLastMonth = activeInstallment?.orderIndex === sub.plan?.durationMonths;

    if (!isLastMonth && sub.plan) {
      const feeAmount = Math.floor(sub.plan.price * 0.5);
      
      const student = await userService.getUser(sub.studentId);
      
      // Create Fee via Transparent PIX (allows custom amount)
      const pix = await abacate.pix.create({
        amount: Math.round(feeAmount * 100),
        customer: {
          name: student?.name || "Aluno",
          email: student?.email || "",
          taxId: student?.taxId || "00000000000",
          cellphone: student?.cellphone || "00000000000",
        },
        metadata: {
          subscriptionId: sub.id,
          type: "cancellation_fee",
        },
      });

      await billingRepository.updateSubscription(sub.id, {
        status: "cancelled",
        cancellationDate: new Date(),
        cancellationFeeInstallmentId: pix.id,
      });

      return { 
        success: true,
        pixCode: pix.brCode,
        pixImage: pix.brCodeBase64 
      };
    }

    await billingRepository.updateSubscription(sub.id, {
      status: "cancelled",
      cancellationDate: new Date(),
    });

    return { success: true };
  },

  // 5. Get Active Payment (For Transparent Checkout)
  async getActivePayment(studentId: string) {
    const sub = await billingRepository.findActiveSubscriptionByStudent(studentId);
    if (!sub) return null;

    // Find first pending installment that has a billing ID (already generated)
    const installment = await db.query.installmentsTable.findFirst({
      where: and(
        eq(installmentsTable.subscriptionId, sub.id),
        eq(installmentsTable.status, "pending"),
        // We only care about those that have a checkout active
      ),
      orderBy: [asc(installmentsTable.orderIndex)],
    });

    if (!installment || !installment.abacatePayBillingId) return null;

    return {
      installmentId: installment.id,
      amount: installment.amount,
      dueDate: installment.dueDate,
      checkoutUrl: installment.abacatePayCheckoutUrl,
      pixPayload: installment.pixPayload,
      pixImage: installment.pixImage,
      orderIndex: installment.orderIndex,
      totalMonths: sub.plan?.durationMonths ?? 0,
    };
  },

  // 6. Webhook logic
  async processWebhook(payload: import("@abacatepay/types/v2").WebhookEvent) {
    const event = payload; // Already verified by route
    
    if (event.event === "billing.paid") {
      const data = event.data;
      const resource = "billing" in data ? data.billing : data.pixQrCode;
      const metadata = (resource as { metadata?: Record<string, string> }).metadata;
      const installmentId = metadata?.installmentId;
      
      if (installmentId) {
        await billingRepository.updateInstallment(installmentId, {
          status: "paid",
          paidAt: new Date(),
          abacatePayBillingId: resource.id,
        });

        const installment = await billingRepository.findInstallmentById(installmentId);
        if (installment) {
          const sub = await billingRepository.findSubscriptionById(installment.subscriptionId);
          if (sub) {
            const student = await userService.getUser(sub.studentId);
            if (student) {
              // 1. Email confirmation
              await communicationService.sendPaymentConfirmedEmail(student.email, {
                studentName: student.name,
                amount: installment.amount,
              });

              // 2. In-App and Push Notification
              await notificationService.sendNotification({
                title: "\u2705 Pagamento confirmado!",
                body: `Seu pagamento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount / 100)} foi recebido com sucesso.`,
                targetType: "specific",
                userIds: [student.id],
                channels: { inApp: true, push: true },
                actionUrl: "/student/billing",
              });
            }
          }
        }
      }
    }
  },

  // 7. Process Billing Reminders (Called by Cron)
  async processBillingNotifications() {
    const now = new Date();
    const today = startOfDay(now);
    const twoDaysFromNowStart = startOfDay(addDays(now, 2));
    const twoDaysFromNowEnd = endOfDay(addDays(now, 2));
    const yesterdayStart = startOfDay(addDays(now, -1));
    const yesterdayEnd = endOfDay(addDays(now, -1));

    // --- CASE 1: 2 Days before due date ---
    const reminder2d = await billingRepository.findInstallmentsInDateRange(twoDaysFromNowStart, twoDaysFromNowEnd);
    for (const inst of reminder2d) {
      if (inst.notified2dAt || !inst.subscription.student) continue;
      
      const student = inst.subscription.student;
      const amountStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inst.amount / 100);

      // Email
      await communicationService.sendBillingReminderEmail(student.email, {
        studentName: student.name,
        amount: inst.amount,
        dueDate: inst.dueDate,
        checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/student/billing`,
      });

      // Push & In-App
      await notificationService.sendNotification({
        title: "\u23F3 Sua fatura vence em breve",
        body: `Lembrete: Sua fatura de ${amountStr} vence em 2 dias. Evite atrasos!`,
        targetType: "specific",
        userIds: [student.id],
        channels: { inApp: true, push: true },
        actionUrl: "/student/billing",
      });

      await billingRepository.updateInstallment(inst.id, { notified2dAt: new Date() });
    }

    // --- CASE 2: Due Today ---
    const reminderDueToday = await billingRepository.findInstallmentsInDateRange(today, endOfDay(today));
    for (const inst of reminderDueToday) {
      if (inst.notifiedDueAt || !inst.subscription.student) continue;

      const student = inst.subscription.student;
      const amountStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inst.amount / 100);

      await communicationService.sendBillingDueDateEmail(student.email, {
        studentName: student.name,
        amount: inst.amount,
        checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/student/billing`,
      });

      await notificationService.sendNotification({
        title: "\u23F0 Vencimento hoje!",
        body: `Sua mensalidade de ${amountStr} vence hoje. Clique para pagar via PIX.`,
        targetType: "specific",
        userIds: [student.id],
        channels: { inApp: true, push: true },
        actionUrl: "/student/billing",
      });

      await billingRepository.updateInstallment(inst.id, { notifiedDueAt: new Date() });
    }

    // --- CASE 3: Overdue (1 day after) ---
    const reminderOverdue = await billingRepository.findInstallmentsInDateRange(yesterdayStart, yesterdayEnd);
    for (const inst of reminderOverdue) {
      if (inst.notifiedOverdueAt || !inst.subscription.student) continue;

      const student = inst.subscription.student;
      const amountStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inst.amount / 100);

      // Update status to overdue
      await billingRepository.updateInstallment(inst.id, { 
        status: "overdue",
        notifiedOverdueAt: new Date() 
      });

      await communicationService.sendBillingOverdueEmail(student.email, {
        studentName: student.name,
        amount: inst.amount,
        checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/student/billing`,
      });

      await notificationService.sendNotification({
        title: "\u26A0\uFE0F Fatura em atraso",
        body: `Aten\u00e7\u00e3o: Sua mensalidade de ${amountStr} est\u00e1 atrasada. Regularize para evitar suspens\u00e3o.`,
        targetType: "specific",
        userIds: [student.id],
        channels: { inApp: true, push: true },
        actionUrl: "/student/billing",
      });
    }
  }
};

import { billingRepository } from "./billing.repository";
import { abacate, createPixCharge } from "@/lib/abacate-pay";
import { userService } from "../user/user.service";
import { communicationService } from "../communication/communication.service";
import { notificationService } from "../notification/notification.service";
import { addMonths, startOfDay, setDate, addDays, endOfDay, endOfMonth, getDate, getDaysInMonth } from "date-fns";
import { env } from "@/env";
import { db } from "@/lib/db";
import { Installment, installmentsTable } from "./billing.schema";
import { eq, asc, and } from "drizzle-orm";
import { decrypt } from "@/lib/cryptography";

export const billingService = {
  async getActiveSubscription(studentId: string) {
    return await billingRepository.findActiveSubscriptionByStudent(studentId);
  },

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

  async updatePlan(id: string, data: Partial<{ name: string; price: number; durationMonths: number; language: string; classesPerWeek: number; description: string; isActive: boolean }>) {
    const plan = await billingRepository.findPlanById(id);
    if (!plan) throw new Error("Plano não encontrado");

    // Sync with AbacatePay if relevant fields changed
    if (plan.abacatePayProductId && (data.name || data.price)) {
      try {
        // @ts-expect-error - Assuming update exists in SDK or will be handled
        await abacate.products.update(plan.abacatePayProductId, {
          name: data.name || plan.name,
          price: data.price || plan.price,
        });
      } catch (error) {
        console.error("Failed to update AbacatePay product:", error);
      }
    }

    return billingRepository.updatePlan(id, data);
  },

  // 2. Create Student Subscription
  async createSubscription(studentId: string, planId: string, dueDay: number) {
    const plan = await billingRepository.findPlanById(planId);
    if (!plan) throw new Error("Plano não encontrado");

    // Ensure student is synced with AbacatePay
    const student = await userService.getUser(studentId);
    if (!student) throw new Error("Estudante não encontrado");

    await userService.syncAbacatePayCustomer(studentId);

    // Check if student already has an active subscription for this plan (Idempotency)
    const existingSub = await billingRepository.findActiveSubscriptionByStudent(studentId);
    if (existingSub && existingSub.planId === planId) {
      // Update dueDay if it changed
      if (existingSub.dueDay !== dueDay) {
        await billingRepository.updateSubscription(existingSub.id, { dueDay });
      }

      // Ensure the first installment has an invoice if it doesn't already
      const firstInstallment = await db.query.installmentsTable.findFirst({
        where: and(
          eq(installmentsTable.subscriptionId, existingSub.id),
          eq(installmentsTable.orderIndex, 1)
        ),
      });

      if (firstInstallment && !firstInstallment.abacatePayBillingId) {
        try {
          await this.generateInvoiceForInstallment(firstInstallment.id);
        } catch (error) {
          console.error("Failed to generate AbacatePay invoice for existing sub:", error);
        }
      }

      return existingSub;
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, plan.durationMonths);

    const subscription = await billingRepository.createSubscription({
      studentId,
      planId,
      dueDay,
      status: "active",
      startDate,
      endDate,
    });

    // Generate N installments with pro-rata logic
    const installments = [];
    const now = new Date();

    // Use classesStartDate for pro-rata calculation if it's in the future
    const billingBaseDate = student.classesStartDate && student.classesStartDate > now
      ? student.classesStartDate
      : now;

    const currentDay = getDate(billingBaseDate);
    const totalDaysInMonth = getDaysInMonth(billingBaseDate);

    let firstInstallmentAmount: number;
    let firstInstallmentDueDate: Date;

    if (currentDay > dueDay) {
      // Pro-rata logic: charge for remaining days of the month
      const daysRemaining = totalDaysInMonth - currentDay + 1; // Including today
      firstInstallmentAmount = Math.round((plan.price / totalDaysInMonth) * daysRemaining);
      firstInstallmentDueDate = endOfMonth(billingBaseDate);
    } else {
      // Full charge logic: due in 7 days
      firstInstallmentAmount = plan.price;
      firstInstallmentDueDate = addDays(now, 7); // First payment always due in 7 days from now (onboarding)
    }

    // 1. Create first installment (can be pro-rata or full)
    installments.push({
      subscriptionId: subscription.id,
      status: "pending" as const,
      dueDate: startOfDay(firstInstallmentDueDate),
      amount: firstInstallmentAmount,
      orderIndex: 1,
    });

    // 2. Generate subsequent installments (full price)
    for (let i = 2; i <= plan.durationMonths; i++) {
      // Subsequent charges always on the chosen dueDay of the following months
      const dueDate = setDate(addMonths(now, i - 1), dueDay);

      installments.push({
        subscriptionId: subscription.id,
        status: "pending" as const,
        dueDate: startOfDay(dueDate),
        amount: plan.price,
        orderIndex: i,
      });
    }

    const createdInstallments = await billingRepository.createInstallments(installments);

    // 3. Immediately generate AbacatePay billing for the first installment 
    // so the student can see it and we have it ready
    const firstInstallment = createdInstallments[0];
    if (firstInstallment) {
      try {
        await this.generateInvoiceForInstallment(firstInstallment.id);
      } catch (error) {
        console.error("Failed to generate first AbacatePay invoice:", error);
        // We don't throw here to avoid blocking the onboarding flow, 
        // the cron will pick it up later if it fails now
      }
    }

    return subscription;
  },

  // Helper to generate the actual AbacatePay billing for an installment
  async generateInvoiceForInstallment(installmentId: string) {
    const installment = await this.getInstallmentById(installmentId);
    if (!installment || installment.abacatePayBillingId) return;

    const sub = await billingRepository.findSubscriptionById(installment.subscriptionId);
    if (!sub || sub.status !== "active" || !sub.plan || !sub.plan.abacatePayProductId) return;

    const student = await userService.getUser(sub.studentId);
    if (!student) return;

    // Ensure student has required data for Transparent PIX and decrypt it
    let taxId = student.taxId;
    let cellphone = student.cellphone;
    let name = student.name;

    if (taxId?.includes(":")) taxId = decrypt(taxId);
    if (cellphone?.includes(":")) cellphone = decrypt(cellphone);

    if (student.guardianTaxId) {
      taxId = student.guardianTaxId.includes(":") ? decrypt(student.guardianTaxId) : student.guardianTaxId;
      name = student.guardianName || student.name;
    }
    // Sanitize: AbacatePay expects only digits for taxId and cellphone
    const sanitizedTaxId = taxId?.replace(/\D/g, "") ?? null;
    const sanitizedCellphone = cellphone?.replace(/\D/g, "") ?? null;

    if (!sanitizedTaxId || !sanitizedCellphone) {
      console.warn(`Student ${student.id} missing taxId or cellphone for billing`);
      return;
    }

    console.log("[AbacatePay] Creating/Resolving customer for:", student.email);
    let customerId = student.abacatePayCustomerId;

    if (!customerId) {
      try {
        const customer = await abacate.customers.create({
          name,
          email: student.email,
          taxId: sanitizedTaxId,
          cellphone: sanitizedCellphone,
        });
        customerId = customer.id;
        console.log("[AbacatePay] Customer created/resolved:", customerId);
      } catch (error) {
        console.error("[AbacatePay] Failed to create/resolve customer:", error);
        throw error;
      }
    }

    const metadataPayload = {
      installmentId: installment.id,
      subscriptionId: sub.id,
    };

    const pix = await createPixCharge({
      amount: installment.amount,
      description: `Mensalidade ${sub?.plan?.name || "Plano"} - ${installment.orderIndex}/${sub?.plan?.durationMonths || ""}`.slice(0, 30),
      customer: {
        name,
        email: student.email,
        taxId: sanitizedTaxId,
        cellphone: sanitizedCellphone,
      },
      metadata: metadataPayload,
    });


    await billingRepository.updateInstallment(installment.id, {
      abacatePayBillingId: pix.id,
      pixPayload: pix.brCode,
      pixImage: pix.brCodeBase64,
      status: "pending",
    });

    // Send email with PIX
    if (student?.email) {
      await communicationService.sendNewInvoiceEmail(student.email, {
        studentName: student.name || "Aluno",
        amount: installment.amount,
        dueDate: installment.dueDate,
        pixPayload: pix.brCode,
        pixImage: pix.brCodeBase64,
        description: `Mensalidade ${sub?.plan?.name || "Plano"} - ${installment.orderIndex}/${sub?.plan?.durationMonths || ""}`,
      });
    }

    // WhatsApp
    if (cellphone && pix.brCode) {
      await communicationService.sendPaymentReminderWhatsApp({
        cellphone: cellphone,
        studentName: student.name || "Aluno",
        amount: installment.amount,
        dueDate: installment.dueDate,
        pixPayload: pix.brCode,
      });
    }

    return pix;
  },

  // 3. Automated Billing (Cron)
  async generatePendingInvoices() {
    const searchDate = new Date();
    searchDate.setDate(searchDate.getDate() + 7);

    const pendingInstallments = await billingRepository.findSubscriptionsForCron(searchDate);

    for (const installment of pendingInstallments) {
      try {
        const pix = await this.generateInvoiceForInstallment(installment.id);
        if (!pix) continue;
      } catch (error) {
        console.error(`Failed to process installment ${installment.id}:`, error);
      }
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
      let taxId = student?.taxId || "00000000000";
      let cellphone = student?.cellphone || "00000000000";

      if (taxId.includes(":")) taxId = decrypt(taxId);
      if (cellphone.includes(":")) cellphone = decrypt(cellphone);

      taxId = taxId.replace(/\D/g, "");
      cellphone = cellphone.replace(/\D/g, "");

      const result = await createPixCharge({
        amount: feeAmount,
        description: `Taxa de Cancelamento - ${sub?.plan?.name || ""}`.slice(0, 30),
        customer: {
          name: student?.name || "Aluno",
          email: student?.email || "",
          taxId: taxId?.replace(/\D/g, "") || "",
          cellphone: cellphone?.replace(/\D/g, "") || "",
        },
        metadata: {
          subscriptionId: sub.id,
          type: "cancellation_fee",
        },
      });

      const pix = result;

      // Send email with PIX for cancellation fee
      if (student?.email) {
        await communicationService.sendNewInvoiceEmail(student.email, {
          studentName: student.name || "Aluno",
          amount: feeAmount,
          dueDate: new Date(pix.expiresAt),
          pixPayload: pix.brCode,
          pixImage: pix.brCodeBase64,
          description: `Taxa de Cancelamento - ${sub?.plan?.name || ""}`,
        });
      }

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

    // Find first installment (onboarding) or next pending one
    const installment = await db.query.installmentsTable.findFirst({
      where: and(
        eq(installmentsTable.subscriptionId, sub.id),
        // If it's the first one, we return it regardless of status if it has billing
        // If not, we return the next pending one
      ),
      orderBy: [asc(installmentsTable.orderIndex)],
    });

    if (!installment || !installment.abacatePayBillingId) return null;

    return {
      installmentId: installment.id,
      amount: installment.amount,
      dueDate: installment.dueDate,
      pixPayload: installment.pixPayload,
      pixImage: installment.pixImage,
      orderIndex: installment.orderIndex,
      totalMonths: sub.plan?.durationMonths ?? 0,
      status: installment.status,
    };
  },

  async markInstallmentAsPaid(
    installmentId: string, 
    abacatePayBillingId?: string, 
    actor?: { id: string; name: string }
  ) {
    const installment = await billingRepository.findInstallmentById(installmentId);
    if (!installment) throw new Error("Parcela não encontrada");

    await billingRepository.updateInstallment(installmentId, {
      status: "paid",
      paidAt: new Date(),
      abacatePayBillingId: abacatePayBillingId || installment.abacatePayBillingId,
    });

    // Create Audit Log
    await billingRepository.createAuditLog({
      installmentId,
      actorId: actor?.id || "system",
      actorName: actor?.name || "AbacatePay Webhook",
      previousStatus: installment.status,
      newStatus: "paid",
      previousAmount: installment.amount,
      newAmount: installment.amount,
      reason: actor ? "Confirmação manual de pagamento pelo admin" : "Pagamento confirmado via Webhook",
    });

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
          title: "✅ Pagamento confirmado!",
          body: `Seu pagamento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount / 100)} foi recebido com sucesso.`,
          targetType: "specific",
          userIds: [student.id],
          channels: { inApp: true, push: true },
          actionUrl: "/student/billing",
        });
      }
    }

    return { success: true };
  },

  // 6. Webhook logic
  async processWebhook(payload: import("@abacatepay/types/v2").WebhookEvent) {
    const event = payload; // Already verified by route

    if (event.event === "billing.paid") {
      const data = event.data;
      const resource = "billing" in data ? data.billing : data.pixQrCode;
      const metadata = (resource as {
        metadata?: {
          installmentId?: string;
          installment?: { id?: string };
          subscriptionId?: string;
          subscription?: { id?: string };
          type?: string;
          info?: { type?: string };
        }
      }).metadata;

      const installmentId = metadata?.installmentId || metadata?.installment?.id;
      const subscriptionId = metadata?.subscriptionId || metadata?.subscription?.id;
      const type = metadata?.type || metadata?.info?.type;

      if (installmentId) {
        await this.markInstallmentAsPaid(installmentId, resource.id);
      }

      // Handle Cancellation Fee
      const subId = subscriptionId || metadata?.subscriptionId;
      if (type === "cancellation_fee" && subId) {
        const { contractService } = await import("../contract/contract.service");
        const { contractRepository } = await import("../contract/contract.repository");
        const contract = await contractRepository.findInstanceBySubscriptionId(subId);
        if (contract) {
          await contractService.finalizeCancellation(contract.id);
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

      // WhatsApp
      if (student.cellphone && inst.pixPayload) {
        await communicationService.sendPaymentReminderWhatsApp({
          cellphone: student.cellphone,
          studentName: student.name,
          amount: inst.amount,
          dueDate: inst.dueDate,
          pixPayload: inst.pixPayload,
        });
      }

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

      // WhatsApp
      if (student.cellphone) {
        await communicationService.sendPaymentOverdueWhatsApp({
          cellphone: student.cellphone,
          studentName: student.name,
          amount: inst.amount,
        });
      }
    }
  },

  async getSubscriptionsByStudent(studentId: string) {
    return billingRepository.findSubscriptionsByStudent(studentId);
  },

  async listActivePlans() {
    return billingRepository.listActivePlans();
  },

  async getInstallmentById(id: string) {
    return billingRepository.findInstallmentById(id);
  },

  async getInstallmentsBySubscriptionId(subscriptionId: string) {
    return billingRepository.findInstallmentsBySubscription(subscriptionId);
  },

  async updateInstallment(
    id: string, 
    data: Partial<Installment>, 
    actor?: { id: string; name: string }
  ) {
    const previous = await billingRepository.findInstallmentById(id);
    await billingRepository.updateInstallment(id, data);

    if (actor && previous) {
      await billingRepository.createAuditLog({
        installmentId: id,
        actorId: actor.id,
        actorName: actor.name,
        previousStatus: previous.status,
        newStatus: data.status || previous.status,
        previousAmount: previous.amount,
        newAmount: data.amount || previous.amount,
        reason: "Atualização manual de parcela pelo admin",
      });
    }
  }
};

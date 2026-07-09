import { billingRepository } from "./billing.repository";
import { abacate, createPixCharge } from "@/lib/abacate-pay";
import { createStripeCheckoutSession, stripe } from "@/lib/stripe";
import { userService } from "../user/user.service";
import { communicationService } from "../communication/communication.service";
import { notificationService } from "../notification/notification.service";
import { addMonths, startOfDay, setDate, addDays, endOfDay, endOfMonth, getDate } from "date-fns";
import { env } from "@/env";
import { db } from "@/lib/db";
import { Installment, installmentsTable, Subscription, abacatePayWebhookSchema, abacatePayMetadataSchema, subscriptionsTable } from "./billing.schema";
import { eq, asc, and, ne, gte } from "drizzle-orm";
import { decrypt } from "@/lib/cryptography";
import { revalidatePath } from "next/cache";

export const billingService = {
  async getActiveSubscription(studentId: string) {
    return await billingRepository.findActiveSubscriptionByStudent(studentId);
  },

  // 1. Setup Plans (Sync with AbacatePay)
  async createPlan(data: { 
    name: string; 
    price: number; 
    durationMonths: number; 
    description?: string; 
    currency?: "BRL" | "USD";
    language?: string;
    classesPerWeek?: number;
  }) {
    const currency = data.currency || "BRL";
    let abacatePayProductId: string | null = null;

    if (currency === "BRL") {
      // Create Product (Plan) in AbacatePay
      const product = await abacate.products.create({
        externalId: `plan-${Date.now()}`,
        name: data.name,
        price: data.price,
        currency: "BRL",
        description: data.description,
      });
      abacatePayProductId = product.id;
    }

    return billingRepository.createPlan({
      ...data,
      currency,
      abacatePayProductId,
    });
  },

  async updatePlan(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      durationMonths: number;
      language: string;
      classesPerWeek: number;
      description: string;
      isActive: boolean;
      currency: "BRL" | "USD";
      effectiveDate?: string | null;
    }>
  ) {
    const plan = await billingRepository.findPlanById(id);
    if (!plan) throw new Error("Plano não encontrado");

    const { effectiveDate, ...fieldsToUpdate } = data;

    // Sync with AbacatePay if relevant fields changed and currency is BRL
    const currentCurrency = fieldsToUpdate.currency || plan.currency;
    if (currentCurrency === "BRL" && plan.abacatePayProductId && (fieldsToUpdate.name || fieldsToUpdate.price)) {
      try {
        // @ts-expect-error - Assuming update exists in SDK or will be handled
        await abacate.products.update(plan.abacatePayProductId, {
          name: fieldsToUpdate.name || plan.name,
          price: fieldsToUpdate.price || plan.price,
        });
      } catch (error) {
        console.error("Failed to update AbacatePay product:", error);
      }
    }

    // Se o preço foi alterado, faz o reajuste global das parcelas futuras
    if (fieldsToUpdate.price && fieldsToUpdate.price !== plan.price) {
      const newPrice = fieldsToUpdate.price;
      
      // Data a partir da qual o reajuste deve começar
      const limitDate = effectiveDate 
        ? startOfDay(new Date(effectiveDate)) 
        : startOfDay(new Date());

      // Busca todas as assinaturas ativas associadas a esse plano
      const activeSubs = await db.query.subscriptionsTable.findMany({
        where: and(
          eq(subscriptionsTable.planId, id),
          eq(subscriptionsTable.status, "active")
        ),
        with: { student: true }
      });

      for (const sub of activeSubs) {
        // Buscar parcelas pendentes da assinatura que vencem no dia ou após a data limite
        const futureInstallments = await db.query.installmentsTable.findMany({
          where: and(
            eq(installmentsTable.subscriptionId, sub.id),
            ne(installmentsTable.status, "paid"),
            gte(installmentsTable.dueDate, limitDate)
          )
        });

        for (const inst of futureInstallments) {
          await db.update(installmentsTable)
            .set({
              amount: newPrice,
              abacatePayBillingId: null,
              pixPayload: null,
              pixImage: null,
            })
            .where(eq(installmentsTable.id, inst.id));
        }

        // Enviar email apenas avisando do ajuste previsto em contrato
        if (sub.student?.email) {
          try {
            await communicationService.sendPlanPriceAdjustmentEmail(
              sub.student.email,
              sub.student.name,
              plan.name,
              newPrice
            );
          } catch (err) {
            console.error(`Failed to send price adjustment email to student ${sub.studentId}:`, err);
          }
        }
      }
    }

    return billingRepository.updatePlan(id, fieldsToUpdate);
  },

  async deletePlan(planId: string) {
    const subscriptionsCount = await billingRepository.countSubscriptionsByPlanId(planId);
    if (subscriptionsCount > 0) {
      throw new Error("Não é possível excluir o plano pois ele já possui matrículas associadas.");
    }
    await billingRepository.deletePlan(planId);
  },

  async getAffectedStudents(planId: string) {
    const activeSubs = await db.query.subscriptionsTable.findMany({
      where: and(
        eq(subscriptionsTable.planId, planId),
        eq(subscriptionsTable.status, "active")
      ),
      with: { student: true }
    });

    return activeSubs.map(sub => ({
      studentId: sub.studentId,
      name: sub.student?.name || "Sem Nome",
      email: sub.student?.email || "Sem Email",
      startDate: sub.startDate,
      endDate: sub.endDate,
    }));
  },

  // 2. Create Student Subscription
  async createSubscription(studentId: string, planId: string, dueDay: number) {
    const plan = await billingRepository.findPlanById(planId);
    if (!plan) throw new Error("Plano não encontrado");

    // Ensure student is synced with AbacatePay if Brazilian
    const student = await userService.getUser(studentId);
    if (!student) throw new Error("Estudante não encontrado");

    const isForeign = student.nationality === "foreign";

    if (!isForeign) {
      await userService.syncAbacatePayCustomer(studentId);
    }

    // Check if student already has an active subscription for this plan (Idempotency)
    const existingSub = await billingRepository.findActiveSubscriptionByStudent(studentId);
    if (existingSub && existingSub.planId === planId) {
      const dueDayChanged = existingSub.dueDay !== dueDay;

      // Ensure the first installment is retrieved
      const firstInstallment = await db.query.installmentsTable.findFirst({
        where: and(
          eq(installmentsTable.subscriptionId, existingSub.id),
          eq(installmentsTable.orderIndex, 1)
        ),
      });

      if (dueDayChanged) {
        await db.transaction(async (tx) => {
          // 1. Update the subscription due day
          await tx.update(subscriptionsTable)
            .set({ dueDay })
            .where(eq(subscriptionsTable.id, existingSub.id));

          // 2. Recalculate first installment if it's pending
          if (firstInstallment && firstInstallment.status !== "paid") {
            const now = new Date();
            const billingBaseDate = student.classesStartDate
              ? student.classesStartDate
              : now;

            const currentDay = getDate(billingBaseDate);

            let remainingClasses = 4;
            if (currentDay >= 20) {
              remainingClasses = 1;
            } else if (currentDay >= 15) {
              remainingClasses = 2;
            } else if (currentDay >= 6) {
              remainingClasses = 3;
            } else {
              remainingClasses = 4;
            }

            const firstInstallmentAmount = Math.round((plan.price / 4) * remainingClasses);

            let firstInstallmentDueDate: Date;
            if (currentDay >= 20) {
              firstInstallmentDueDate = endOfMonth(billingBaseDate);
            } else {
              firstInstallmentDueDate = addDays(billingBaseDate, 10);
            }

            await tx.update(installmentsTable)
              .set({
                amount: firstInstallmentAmount,
                dueDate: startOfDay(firstInstallmentDueDate),
                abacatePayBillingId: null,
                pixPayload: null,
                pixImage: null,
                status: "pending",
              })
              .where(eq(installmentsTable.id, firstInstallment.id));
          }

          // 3. Update subsequent pending installments
          const allInstallments = await tx.query.installmentsTable.findMany({
            where: eq(installmentsTable.subscriptionId, existingSub.id),
          });

          for (const inst of allInstallments) {
            if (inst.orderIndex > 1 && inst.status !== "paid") {
              const nextDueDate = setDate(addMonths(existingSub.startDate, inst.orderIndex - 1), dueDay);
              await tx.update(installmentsTable)
                .set({
                  dueDate: startOfDay(nextDueDate),
                })
                .where(eq(installmentsTable.id, inst.id));
            }
          }
        });
      }

      // Ensure the first installment has an invoice if it doesn't already
      const updatedFirstInstallment = await db.query.installmentsTable.findFirst({
        where: and(
          eq(installmentsTable.subscriptionId, existingSub.id),
          eq(installmentsTable.orderIndex, 1)
        ),
      });

      const isUsdPlan = plan.currency === "USD";
      const hasBilling = isUsdPlan
        ? !!updatedFirstInstallment?.stripePaymentIntentId
        : !!updatedFirstInstallment?.abacatePayBillingId;

      if (updatedFirstInstallment && !hasBilling) {
        try {
          await this.generateInvoiceForInstallment(updatedFirstInstallment.id);
        } catch (error) {
          console.error("Failed to generate invoice for existing sub:", error);
        }
      }

      return existingSub;
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, plan.durationMonths);

    const subscription = await db.transaction(async (tx) => {
      const [sub] = await tx.insert(subscriptionsTable).values({
        studentId,
        planId,
        dueDay,
        status: "active",
        startDate,
        endDate,
      }).returning();

      // Generate N installments with pro-rata logic
      const installments = [];
      const now = new Date();

      // Use classesStartDate for pro-rata calculation
      const billingBaseDate = student.classesStartDate
        ? student.classesStartDate
        : now;

      const currentDay = getDate(billingBaseDate);

      let remainingClasses = 4;
      if (currentDay >= 20) {
        remainingClasses = 1;
      } else if (currentDay >= 15) {
        remainingClasses = 2;
      } else if (currentDay >= 6) {
        remainingClasses = 3;
      } else {
        remainingClasses = 4;
      }

      const firstInstallmentAmount = Math.round((plan.price / 4) * remainingClasses);

      let firstInstallmentDueDate: Date;
      if (currentDay >= 20) {
        firstInstallmentDueDate = endOfMonth(billingBaseDate);
      } else {
        firstInstallmentDueDate = addDays(billingBaseDate, 10);
      }

      // 1. Create first installment (can be pro-rata or full)
      installments.push({
        subscriptionId: sub.id,
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
          subscriptionId: sub.id,
          status: "pending" as const,
          dueDate: startOfDay(dueDate),
          amount: plan.price,
          orderIndex: i,
        });
      }

      const createdInstallments = await tx.insert(installmentsTable).values(installments).returning();
      
      // Use the transaction-created subscription for the return
      return { subscription: sub, firstInstallment: createdInstallments[0] };
    });

    // 3. Immediately generate AbacatePay billing for the first installment 
    // so the student can see it and we have it ready
    if (subscription.firstInstallment) {
      try {
        await this.generateInvoiceForInstallment(subscription.firstInstallment.id);
      } catch (error) {
        console.error("Failed to generate first AbacatePay invoice:", error);
        // We don't throw here to avoid blocking the onboarding flow, 
        // the cron will pick it up later if it fails now
      }
    }

    return subscription.subscription;
  },

  async updateSubscription(id: string, data: Partial<Subscription>) {
    await billingRepository.updateSubscription(id, data);
    if (data.status === "cancelled") {
      await billingRepository.cancelPendingInstallments(id);
    }
  },

  async changeStudentPlan(studentId: string, newPlanId: string) {
    const activeSub = await billingRepository.findActiveSubscriptionByStudent(studentId);
    if (!activeSub) throw new Error("O estudante não possui uma assinatura ativa");

    const newPlan = await billingRepository.findPlanById(newPlanId);
    if (!newPlan) throw new Error("O novo plano selecionado não existe");

    const oldPlanName = activeSub.plan?.name || "Plano Anterior";
    const newPrice = newPlan.price;

    await db.transaction(async (tx) => {
      // 1. Update active subscription
      await tx.update(subscriptionsTable)
        .set({ planId: newPlanId })
        .where(eq(subscriptionsTable.id, activeSub.id));

      // 2. Get all unpaid future installments of the subscription
      const futureInstallments = await tx.query.installmentsTable.findMany({
        where: and(
          eq(installmentsTable.subscriptionId, activeSub.id),
          ne(installmentsTable.status, "paid")
        )
      });

      // 3. Update future installments to the new price and clear AbacatePay billing ID
      for (const inst of futureInstallments) {
        await tx.update(installmentsTable)
          .set({
            amount: newPrice,
            abacatePayBillingId: null,
            pixPayload: null,
            pixImage: null,
          })
          .where(eq(installmentsTable.id, inst.id));
      }
    });

    // 4. Update user's assignedPlanId
    await userService.updateUser(studentId, { assignedPlanId: newPlanId });

    // 5. Send notification to student via email only
    const student = await userService.getUser(studentId);
    if (student?.email) {
      try {
        await communicationService.sendPlanChangedEmail(student.email, student.name, {
          oldPlanName,
          newPlanName: newPlan.name,
          newAmount: newPrice,
          classesPerWeek: newPlan.classesPerWeek || 1,
        });
      } catch (error) {
        console.error("[changeStudentPlan] Failed to send email:", error);
      }
    }
  },

  // Helper to generate the actual AbacatePay or Stripe billing for an installment
  async generateInvoiceForInstallment(installmentId: string) {
    const installment = await this.getInstallmentById(installmentId);
    if (!installment) return;

    const sub = await billingRepository.findSubscriptionById(installment.subscriptionId);
    if (!sub || sub.status !== "active" || !sub.plan) return;

    const student = await userService.getUser(sub.studentId);
    if (!student) return;

    const isUsdPlan = sub.plan.currency === "USD";

    if (isUsdPlan) {
      if (installment.stripePaymentIntentId) return;

      console.log("[Stripe Checkout] Generating Checkout Session for student:", student.email);
      try {
        const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://fluencylab.live";
        const redirectPath = installment.orderIndex === 1 ? "/onboarding" : "/hub/student/payments";
        const successUrl = `${baseUrl}${redirectPath}?success=true`;
        const cancelUrl = `${baseUrl}${redirectPath}?cancelled=true`;

        const session = await createStripeCheckoutSession({
          amount: installment.amount,
          email: student.email,
          name: student.name,
          description: `Mensalidade ${sub.plan.name} - ${installment.orderIndex}/${sub.plan.durationMonths}`,
          successUrl,
          cancelUrl,
          metadata: {
            installmentId: installment.id,
            subscriptionId: sub.id,
          },
        });

        if (!session.url) {
          throw new Error("Stripe did not return a URL for Checkout Session.");
        }

        await billingRepository.updateInstallment(installment.id, {
          stripePaymentIntentId: session.id,
          pixPayload: session.url,
          pixImage: null,
          status: "pending",
        });

        // Send email with payment link instead of Pix QR code
        if (student?.email) {
          await communicationService.sendNewInvoiceEmail(student.email, {
            studentName: student.name || "Aluno",
            amount: installment.amount,
            dueDate: installment.dueDate,
            pixPayload: session.url,
            pixImage: "",
            description: `Mensalidade ${sub.plan.name} - ${installment.orderIndex}/${sub.plan.durationMonths}`,
          });
        }

        // WhatsApp
        let cellphone = student.cellphone;
        if (cellphone?.includes(":")) cellphone = decrypt(cellphone);
        if (cellphone && session.url) {
          await communicationService.sendPaymentReminderWhatsApp({
            cellphone: cellphone,
            studentName: student.name || "Aluno",
            amount: installment.amount,
            dueDate: installment.dueDate,
            pixPayload: session.url,
          });
        }

        return session;
      } catch (error) {
        console.error("Failed to generate Stripe Checkout Session:", error);
        throw error;
      }
    }

    // Brazilian Flow (AbacatePay)
    if (installment.abacatePayBillingId || !sub.plan.abacatePayProductId) return;

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

      await this.updateSubscription(sub.id, {
        status: "pending_fee",
        cancellationDate: new Date(),
        cancellationFeeInstallmentId: pix.id,
      });

      // Send WhatsApp with PIX for cancellation fee
      if (cellphone && pix.brCode) {
        await communicationService.sendPaymentReminderWhatsApp({
          cellphone: cellphone,
          studentName: student?.name || "Aluno",
          amount: feeAmount,
          dueDate: new Date(pix.expiresAt),
          pixPayload: pix.brCode,
        });
      }

      return { 
        success: true, 
        feeRequired: true, 
        pixCode: pix.brCode, 
        pixImage: pix.brCodeBase64,
        amount: feeAmount
      };
    }

    await this.updateSubscription(sub.id, {
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

    const isUsdPlan = sub.plan?.currency === "USD";
    const hasBilling = isUsdPlan ? !!installment?.stripePaymentIntentId : !!installment?.abacatePayBillingId;

    if (!installment || !hasBilling) return null;

    return {
      installmentId: installment.id,
      amount: installment.amount,
      dueDate: installment.dueDate,
      pixPayload: installment.pixPayload,
      pixImage: installment.pixImage,
      orderIndex: installment.orderIndex,
      totalMonths: sub.plan?.durationMonths ?? 0,
      status: installment.status,
      currency: sub.plan?.currency || "BRL",
    };
  },

  async getStudentPaymentStatus(studentId: string) {
    const sub = await billingRepository.findActiveSubscriptionByStudent(studentId);
    if (!sub) return null;

    const installments = await billingRepository.findInstallmentsBySubscription(sub.id);
    
    // Find the current installment (the first one that is NOT paid)
    const currentInstallment = installments.find(i => i.status !== "paid") || installments[installments.length - 1];
    
    const lastPaidInstallment = [...installments].reverse().find(i => i.status === "paid");

    return {
      subscriptionId: sub.id,
      subscriptionStatus: sub.status,
      planName: sub.plan?.name,
      currency: sub.plan?.currency || "BRL",
      currentInstallment: currentInstallment ? {
        id: currentInstallment.id,
        amount: currentInstallment.amount,
        dueDate: currentInstallment.dueDate,
        status: currentInstallment.status,
        pixCode: currentInstallment.pixPayload,
        pixQrCode: currentInstallment.pixImage,
        orderIndex: currentInstallment.orderIndex,
        totalMonths: sub.plan?.durationMonths ?? 0,
      } : null,
      lastPaymentDate: lastPaidInstallment?.paidAt || null,
    };
  },

  async syncInstallmentStatus(installmentId: string, userId: string) {
    const installment = await billingRepository.findInstallmentById(installmentId);
    if (!installment) throw new Error("Parcela não encontrada");

    // Validação de Propriedade (Prevenção de IDOR)
    const subscription = await billingRepository.findSubscriptionById(installment.subscriptionId);
    if (!subscription) throw new Error("Assinatura não encontrada");

    if (subscription.studentId !== userId) {
      throw new Error("Não autorizado");
    }

    // Se já estiver paga, não precisa fazer nada
    if (installment.status === "paid") {
      return { status: "paid" };
    }

    const isUsdPlan = subscription.plan?.currency === "USD";

    if (isUsdPlan) {
      if (!installment.stripePaymentIntentId) {
        throw new Error("Esta parcela não possui uma cobrança ativa no Stripe.");
      }
      console.log(`[BillingService] Sincronizando parcela Stripe ${installmentId} (ID: ${installment.stripePaymentIntentId})`);
      
      if (installment.stripePaymentIntentId.startsWith("cs_")) {
        const session = await stripe.checkout.sessions.retrieve(installment.stripePaymentIntentId);
        if (session.payment_status === "paid") {
          const paymentIntentId = typeof session.payment_intent === "string" 
            ? session.payment_intent 
            : session.id;
          await this.markInstallmentAsPaid(installmentId, paymentIntentId);
          return { status: "paid" };
        }
      } else {
        const intent = await stripe.paymentIntents.retrieve(installment.stripePaymentIntentId);
        if (intent.status === "succeeded") {
          await this.markInstallmentAsPaid(installmentId, intent.id);
          return { status: "paid" };
        }
      }
      return { status: installment.status };
    }

    if (!installment.abacatePayBillingId) {
      throw new Error("Esta parcela não possui uma cobrança ativa no intermediador de pagamentos.");
    }

    console.log(`[BillingService] Sincronizando parcela ${installmentId} (AbacatePay ID: ${installment.abacatePayBillingId})`);

    const res = await fetch(`https://api.abacatepay.com/v2/transparents/check?id=${installment.abacatePayBillingId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.ABACATEPAY_API_KEY}`,
      },
    });

    if (!res.ok) {
      console.error(`[BillingService] Falha ao buscar status do AbacatePay para ${installment.abacatePayBillingId}. HTTP ${res.status}`);
      throw new Error("Falha ao consultar o intermediador de pagamentos.");
    }

    const result = await res.json();
    
    if (!result.success || !result.data) {
      console.error(`[BillingService] Retorno inválido do AbacatePay:`, result);
      throw new Error("Erro retornado pelo intermediador de pagamentos.");
    }

    const abacateStatus = result.data.status; // "PENDING" | "PAID" | "EXPIRED" | "CANCELLED"
    console.log(`[BillingService] Status do pagamento no AbacatePay: ${abacateStatus}`);

    if (abacateStatus === "PAID") {
      await this.markInstallmentAsPaid(installmentId, installment.abacatePayBillingId);
      return { status: "paid" };
    }

    if (abacateStatus === "EXPIRED" || abacateStatus === "CANCELLED") {
      const newStatus = "cancelled";
      if (installment.status !== newStatus) {
        await billingRepository.updateInstallment(installmentId, { status: newStatus });
        revalidatePath("/student/billing");
      }
      return { status: newStatus };
    }

    return { status: installment.status };
  },

  async markInstallmentAsPaid(
    installmentId: string,
    abacatePayBillingId?: string,
    actor?: { id: string; name: string }
  ) {
    const installment = await billingRepository.findInstallmentById(installmentId);
    if (!installment) throw new Error("Parcela não encontrada");

    // Idempotency: skip if already paid to prevent double charges and fees
    if (installment.status === "paid") {
      return { success: true };
    }

    const sub = await billingRepository.findSubscriptionById(installment.subscriptionId);
    const isUsdPlan = sub?.plan?.currency === "USD";
    let feeAmount = 0;

    if (isUsdPlan) {
      const resolvedStripeId = abacatePayBillingId || installment.stripePaymentIntentId;
      if (resolvedStripeId) {
        try {
          if (resolvedStripeId.startsWith("cs_")) {
            const session = await stripe.checkout.sessions.retrieve(resolvedStripeId);
            const piId = typeof session.payment_intent === "string" ? session.payment_intent : null;
            if (piId) {
              const pi = await stripe.paymentIntents.retrieve(piId);
              const chargeId = pi.latest_charge;
              if (chargeId && typeof chargeId === "string") {
                const charge = await stripe.charges.retrieve(chargeId);
                if (charge.balance_transaction && typeof charge.balance_transaction === "string") {
                  const bt = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
                  feeAmount = bt.fee;
                }
              }
            }
          } else if (resolvedStripeId.startsWith("pi_")) {
            const pi = await stripe.paymentIntents.retrieve(resolvedStripeId);
            const chargeId = pi.latest_charge;
            if (chargeId && typeof chargeId === "string") {
              const charge = await stripe.charges.retrieve(chargeId);
              if (charge.balance_transaction && typeof charge.balance_transaction === "string") {
                const bt = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
                feeAmount = bt.fee;
              }
            }
          } else if (resolvedStripeId.startsWith("ch_")) {
            const charge = await stripe.charges.retrieve(resolvedStripeId);
            if (charge.balance_transaction && typeof charge.balance_transaction === "string") {
              const bt = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
              feeAmount = bt.fee;
            }
          }
        } catch (stripeError) {
          console.error("[BillingService] Failed to retrieve Stripe fee, falling back to estimate:", stripeError);
        }
      }

      if (feeAmount === 0) {
        // Stripe fallback: 3.9% + 30 cents USD
        feeAmount = Math.round(installment.amount * 0.039 + 30);
      }
    } else {
      feeAmount = env.ABACATEPAY_TRANSACTION_FEE_CENTS || 80;
    }

    // Record gateway fee transaction in the finance ledger as an expense
    try {
      const { financeService } = await import("../finance/finance.service");
      const studentName = sub?.student?.name || "Aluno";
      const planName = sub?.plan?.name || "Plano";
      const currency = sub?.plan?.currency || "BRL";
      const description = `Taxa de transação: Mensalidade ${studentName} (${planName} - ${installment.orderIndex}/${sub?.plan?.durationMonths || 1})`;

      await financeService.createTransaction(actor?.id || null, {
        type: "expense",
        amount: feeAmount,
        currency,
        date: new Date(),
        description,
        category: "Taxa do Gateway",
        method: isUsdPlan ? "credit_card" : "pix",
        deductible: true,
        status: "paid",
      });
      console.log(`[BillingService] Gateway fee transaction created for installment ${installmentId}: ${feeAmount} cents (${currency})`);
    } catch (err) {
      console.error("[BillingService] Failed to create gateway fee transaction:", err);
    }

    await billingRepository.updateInstallment(installmentId, {
      status: "paid",
      paidAt: new Date(),
      abacatePayBillingId: abacatePayBillingId || installment.abacatePayBillingId,
    });

    console.log("[AbacatePay Webhook] Installment successfully updated to PAID in DB:", installmentId);
    revalidatePath("/onboarding");
    revalidatePath("/student/billing");
    revalidatePath("/admin/finances");

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

    if (sub) {
      const student = await userService.getUser(sub.studentId);

      if (student) {
        // 1. Email confirmation
        try {
          await communicationService.sendPaymentConfirmedEmail(student.email, {
            studentName: student.name,
            amount: installment.amount,
          });
        } catch (error) {
          console.error("[BillingService] Failed to send confirmation email:", error);
        }

        // 2. In-App and Push Notification
        try {
          await notificationService.sendNotification({
            title: "✅ Pagamento confirmado!",
            body: `Seu pagamento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount / 100)} foi recebido com sucesso.`,
            targetType: "specific",
            userIds: [student.id],
            channels: { inApp: true, push: true },
            actionUrl: "/student/billing",
          });
        } catch (error) {
          console.error("[BillingService] Failed to send notification:", error);
        }
      }
    }

    return { success: true };
  },

  // 6. Webhook logic
  async processWebhook(payload: Record<string, unknown>) {
    // 1. Validate the overall webhook structure
    const validatedPayload = abacatePayWebhookSchema.safeParse(payload);
    
    if (!validatedPayload.success) {
      console.error("[AbacatePay Webhook] Invalid payload structure:", validatedPayload.error.format());
      return;
    }

    const event = validatedPayload.data;

    if (event.event === "billing.paid" || event.event === "transparent.completed") {
      const data = event.data;
      // For billing.paid, resource might be 'billing' or 'pixQrCode'
      // For transparent.completed, resource is 'transparent'
      const resource = (data.billing || data.transparent || data.pixQrCode);

      if (!resource) {
        console.warn("[AbacatePay Webhook] No resource found in event data:", JSON.stringify(data));
        return;
      }

      console.log(`[AbacatePay Webhook] Processing ${event.event}. Resource ID:`, resource.id);

      const rawMetadata = resource.metadata;

      // 2. Extract and Parse Metadata
      let metadataObj: Record<string, unknown> = {};
      
      if (typeof rawMetadata === "string") {
        try {
          metadataObj = JSON.parse(rawMetadata);
        } catch {
          console.error("[AbacatePay Webhook] Failed to parse metadata string:", rawMetadata);
          return;
        }
      } else if (rawMetadata && typeof rawMetadata === "object") {
        metadataObj = rawMetadata;
      }

      // 3. Validate Metadata with Schema
      const validatedMetadata = abacatePayMetadataSchema.safeParse(metadataObj);
      
      if (!validatedMetadata.success) {
        console.error("[AbacatePay Webhook] Invalid metadata content:", validatedMetadata.error.format());
        return;
      }

      const meta = validatedMetadata.data;
      console.log("[AbacatePay Webhook] Metadata validated successfully");

      const installmentId = meta.installmentId || meta.installment?.id;
      const subscriptionId = meta.subscriptionId || meta.subscription?.id;
      const type = meta.type || meta.info?.type;

      if (installmentId) {
        console.log("[AbacatePay Webhook] Attempting to mark installment as paid:", installmentId);
        await this.markInstallmentAsPaid(installmentId, resource.id);
      } else {
        console.warn("[AbacatePay Webhook] No installmentId found in metadata");
      }

      // Handle Cancellation Fee
      if (type === "cancellation_fee" && subscriptionId) {
        const { contractService } = await import("../contract/contract.service");
        const contract = await contractService.getContractBySubscriptionId(subscriptionId);
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
    const yesterdayEnd = endOfDay(addDays(now, -1));

    // --- CASE 1: 2 Days before due date ---
    const reminder2d = await billingRepository.findInstallmentsInDateRange(twoDaysFromNowStart, twoDaysFromNowEnd);
    for (const inst of reminder2d) {
      if (
        inst.notified2dAt || 
        !inst.subscription.student || 
        inst.subscription.status !== "active" || 
        !inst.subscription.student.isActive
      ) continue;

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
      if (
        inst.notifiedDueAt || 
        !inst.subscription.student || 
        inst.subscription.status !== "active" || 
        !inst.subscription.student.isActive
      ) continue;

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

    // --- CASE 3: Overdue (all pending before/including yesterday) ---
    const reminderOverdue = await billingRepository.findPendingInstallmentsBeforeDate(yesterdayEnd);
    for (const inst of reminderOverdue) {
      if (
        inst.notifiedOverdueAt || 
        !inst.subscription.student || 
        inst.subscription.status !== "active" || 
        !inst.subscription.student.isActive
      ) continue;

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
      if (student.cellphone && inst.pixPayload) {
        await communicationService.sendPaymentOverdueWhatsApp({
          cellphone: student.cellphone,
          studentName: student.name,
          amount: inst.amount,
          pixPayload: inst.pixPayload,
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
  },

  async getTotalRevenue(start: Date, end: Date) {
    return billingRepository.sumInstallments({ status: "paid", start, end });
  },

  async getRevenueForecast(start: Date, end: Date) {
    return billingRepository.sumInstallments({ status: "pending", start, end });
  },

  async getDetailedRevenueForecast(start: Date, end: Date) {
    return billingRepository.findInstallmentsDetails({ status: "pending", start, end });
  },

  async getStudentPayments(studentId: string) {
    return billingRepository.findInstallmentsByStudent(studentId);
  },

  async getPaymentDetailsForReceipt(id: string) {
    const installment = await billingRepository.findInstallmentWithDetails(id);
    if (!installment) return null;

    const student = installment.subscription.student;
    const plan = installment.subscription.plan;

    let taxId = student.taxId;
    if (taxId?.includes(":")) taxId = decrypt(taxId);

    let guardianTaxId = student.guardianTaxId;
    if (guardianTaxId?.includes(":")) guardianTaxId = decrypt(guardianTaxId);

    // Recupera dados da escola de forma dinâmica via contractService, respeitando o isolamento do módulo
    const { contractService } = await import("../contract/contract.service");
    const schoolSettings = await contractService.getSchoolSettings();

    let receiverDocument = "00.000.000/0000-00"; // CNPJ padrão de fallback caso não esteja configurado
    if (schoolSettings?.taxId) {
      receiverDocument = schoolSettings.taxId.includes(":") 
        ? decrypt(schoolSettings.taxId) 
        : schoolSettings.taxId;
    }

    const isStripe = !!installment.stripePaymentIntentId;
    const paymentMethod = isStripe ? "Credit Card" : "PIX";
    const currency = plan?.currency || "BRL";

    return {
      id: installment.id,
      studentId: student.id,
      amount: installment.amount,
      paymentDate: installment.paidAt || installment.updatedAt,
      paymentMethod,
      currency,
      description: `Mensalidade ${plan?.name} - ${installment.orderIndex}/${plan?.durationMonths}`,
      studentName: student.name,
      studentEmail: student.email,
      guardianName: student.guardianName || "",
      birthDate: student.birthDate ? student.birthDate.toISOString().split("T")[0] : "",
      payerDocument: guardianTaxId || taxId || "",
      receiverDocument,
    };
  },

  async resendInstallmentReminder(installmentId: string) {
    const installment = await billingRepository.findInstallmentWithDetails(installmentId);
    if (!installment) throw new Error("Parcela não encontrada");

    const sub = installment.subscription;
    const student = sub.student;
    if (!student) throw new Error("Estudante não encontrado");

    if (installment.status !== "pending" && installment.status !== "overdue") {
      throw new Error("Apenas parcelas pendentes ou em atraso podem ter lembretes reenviados.");
    }

    const isUsdPlan = sub.plan?.currency === "USD";
    const hasBilling = isUsdPlan ? !!installment.stripePaymentIntentId : !!installment.abacatePayBillingId;

    if (!hasBilling) {
      throw new Error("Gere o código de pagamento antes de reenviar o lembrete.");
    }

    const amountStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount / 100);

    // 1. Email Reminder
    if (student.email) {
      if (installment.status === "overdue") {
        await communicationService.sendBillingOverdueEmail(student.email, {
          studentName: student.name,
          amount: installment.amount,
          checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/student/billing`,
        });
      } else {
        await communicationService.sendBillingReminderEmail(student.email, {
          studentName: student.name,
          amount: installment.amount,
          dueDate: installment.dueDate,
          checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/student/billing`,
        });
      }
    }

    // 2. WhatsApp
    let cellphone = student.cellphone;
    if (cellphone) {
      if (cellphone.includes(":")) cellphone = decrypt(cellphone);
      cellphone = cellphone.replace(/\D/g, "");

      const payCode = installment.pixPayload;

      if (payCode) {
        if (installment.status === "overdue") {
          await communicationService.sendPaymentOverdueWhatsApp({
            cellphone,
            studentName: student.name,
            amount: installment.amount,
            pixPayload: payCode,
          });
        } else {
          await communicationService.sendPaymentReminderWhatsApp({
            cellphone,
            studentName: student.name,
            amount: installment.amount,
            dueDate: installment.dueDate,
            pixPayload: payCode,
          });
        }
      }
    }

    // 3. Notification (In-App & Push)
    try {
      await notificationService.sendNotification({
        title: installment.status === "overdue" ? "⚠️ Fatura em atraso" : "⏳ Lembrete de pagamento",
        body: installment.status === "overdue"
          ? `Atenção: Sua mensalidade de ${amountStr} está atrasada. Regularize para evitar suspensão.`
          : `Lembrete: Sua fatura de ${amountStr} vence em breve. Evite atrasos!`,
        targetType: "specific",
        userIds: [student.id],
        channels: { inApp: true, push: true },
        actionUrl: "/student/billing",
      });
    } catch (error) {
      console.error("[BillingService.resendInstallmentReminder] Failed to send notification:", error);
    }

    return { success: true };
  }
};

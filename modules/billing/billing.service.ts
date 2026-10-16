import { billingRepository } from "./billing.repository";
import { abacate, createPixCharge } from "@/lib/abacate-pay";
import { createStripeCheckoutSession, stripe } from "@/lib/stripe";
import { userService } from "../user/user.service";
import { communicationService } from "../communication/communication.service";
import { notificationService } from "../notification/notification.service";
import { addMonths, startOfDay, setDate, addDays, endOfDay, endOfMonth, startOfMonth, getDate, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { env } from "@/env";
import { db } from "@/lib/db";
import { Installment, installmentsTable, Subscription, abacatePayWebhookSchema, abacatePayMetadataSchema, subscriptionsTable } from "./billing.schema";
import { eq, asc, and, ne, gte } from "drizzle-orm";
import { decrypt } from "@/lib/cryptography";
import { revalidatePath } from "next/cache";
import type { User } from "../user/user.schema";
import {
  brtCivilDate,
  civilDaysBetween,
  addCivilDays,
  isLastDayOfMonth,
  monthsPastDue,
  isUnderPolicy,
  dueCivilDate,
  type CivilDate,
  DELINQUENCY_REMINDER_INTERVAL_DAYS,
  DELINQUENCY_BLOCKED_REMINDER_INTERVAL_DAYS,
} from "./billing.dates";

// Um código de pagamento que vence em menos que isso é trocado antes de ser
// enviado: não adianta mandar um link que morre antes de o aluno abrir.
// Sessões do Stripe duram no máximo 24h, então para USD isso quase sempre gera
// uma sessão nova a cada envio — é o comportamento desejado.
const MIN_PAYMENT_VALIDITY_MS = 12 * 60 * 60 * 1000;

/** Data de início da política de inadimplência, ou `null` se desligada. */
function getDelinquencyPolicyStart(): Date | null {
  return env.DELINQUENCY_POLICY_START ? new Date(`${env.DELINQUENCY_POLICY_START}T00:00:00Z`) : null;
}

function formatMoney(amount: number, currency: string = "BRL") {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "pt-BR", { style: "currency", currency }).format(amount / 100);
}

function formatCivilDate(d: CivilDate, locale: "pt" | "en" = "pt") {
  const pad = (n: number) => String(n).padStart(2, "0");
  return locale === "en"
    ? `${pad(d.month + 1)}/${pad(d.day)}/${d.year}`
    : `${pad(d.day)}/${pad(d.month + 1)}/${d.year}`;
}

function recipientLocale(user: { locale?: string | null }): "pt" | "en" {
  return user.locale === "en" ? "en" : "pt";
}

const PAYMENTS_URL = () => `${env.NEXT_PUBLIC_APP_URL}/hub/student/payments`;

type GatewayState = { state: "paid"; reference: string } | { state: "open" | "expired" | "unknown" };

/**
 * Gera o PIX da taxa de cancelamento e envia por e-mail/WhatsApp.
 *
 * Compartilhado entre `cancelSubscription` (primeira geração, no pedido de
 * desativação) e `regenerateCancellationFee` (quando o PIX original expira) —
 * as duas fazem exatamente a mesma chamada à AbacatePay e o mesmo envio, só
 * mudam o que fazem com o resultado depois.
 */
async function createCancellationFeePix(
  student: User,
  planName: string,
  feeAmount: number,
  subscriptionId: string,
) {
  let taxId = student.taxId || "00000000000";
  let cellphone = student.cellphone || "00000000000";

  if (taxId.includes(":")) taxId = decrypt(taxId);
  if (cellphone.includes(":")) cellphone = decrypt(cellphone);

  taxId = taxId.replace(/\D/g, "");
  cellphone = cellphone.replace(/\D/g, "");

  const pix = await createPixCharge({
    amount: feeAmount,
    description: `Taxa de Cancelamento - ${planName}`.slice(0, 30),
    customer: {
      name: student.name || "Aluno",
      email: student.email || "",
      taxId,
      cellphone,
    },
    metadata: {
      subscriptionId,
      type: "cancellation_fee",
    },
  });

  if (student.email) {
    await communicationService.sendNewInvoiceEmail(student.email, {
      studentName: student.name || "Aluno",
      amount: feeAmount,
      dueDate: new Date(pix.expiresAt),
      pixPayload: pix.brCode,
      pixImage: pix.brCodeBase64,
      description: `Taxa de Cancelamento - ${planName}`,
    });
  }

  if (cellphone && pix.brCode) {
    await communicationService.sendPaymentReminderWhatsApp({
      cellphone,
      studentName: student.name || "Aluno",
      amount: feeAmount,
      dueDate: new Date(pix.expiresAt),
      pixPayload: pix.brCode,
    });
  }

  return pix;
}

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
    // 1. Fetch all subscriptions for this plan
    const subscriptions = await db.query.subscriptionsTable.findMany({
      where: eq(subscriptionsTable.planId, planId),
      with: {
        student: true
      }
    });

    // 2. Filter for ACTIVE subscriptions of ACTIVE students
    const activeSubs = subscriptions.filter(sub => 
      sub.status === "active" && sub.student?.isActive !== false
    );

    if (activeSubs.length > 0) {
      throw new Error("Não é possível excluir o plano pois ele já possui matrículas ativas.");
    }

    // 3. Since there are no active subscriptions for active students, we soft-delete it
    await billingRepository.updatePlan(planId, { isDeleted: true, isActive: false });
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

    const startDate = student.classesStartDate ? new Date(student.classesStartDate) : new Date();
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
        const dueDate = setDate(addMonths(billingBaseDate, i - 1), dueDay);

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
  // force=true: skip idempotency guard for BRL plans and regenerate a new PIX charge
  // notify=false: só cria a cobrança, sem email/WhatsApp — usado quando quem
  // chamou vai enviar o próprio lembrete com o código novo (ensureValidPayment).
  async generateInvoiceForInstallment(installmentId: string, force = false, options: { notify?: boolean } = {}) {
    const notify = options.notify ?? true;
    const installment = await this.getInstallmentById(installmentId);
    if (!installment) return;

    const sub = await billingRepository.findSubscriptionById(installment.subscriptionId);
    if (!sub || sub.status !== "active" || !sub.plan) return;

    const student = await userService.getUser(sub.studentId);
    if (!student) return;

    const isUsdPlan = sub.plan.currency === "USD";

    if (isUsdPlan) {
      if (!force && installment.stripePaymentIntentId) return;

      console.log("[Stripe Checkout] Generating Checkout Session for student:", student.email);
      try {
        const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://fluencylab.me";
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
          paymentExpiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
        });

        // Send email with payment link instead of Pix QR code
        if (notify && student?.email) {
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
        if (notify && cellphone && session.url) {
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
    // Normal flow: skip if billing already exists (idempotency)
    // Force flow: clear old expired billing fields so a fresh charge is created
    if (!force && (installment.abacatePayBillingId || !sub.plan.abacatePayProductId)) return;
    if (force && !sub.plan.abacatePayProductId) return;

    // If forcing, clear the old expired PIX data upfront
    if (force && installment.abacatePayBillingId) {
      await billingRepository.updateInstallment(installment.id, {
        abacatePayBillingId: null,
        pixPayload: null,
        pixImage: null,
        paymentExpiresAt: null,
        status: "pending",
      });
    }


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

    const now = new Date();
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(23, 59, 59, 999);

    const diffSeconds = Math.floor((dueDate.getTime() - now.getTime()) / 1000);
    const minExpiresIn = 3600 * 24 * 7; // 7 days
    const expiresIn = diffSeconds > minExpiresIn ? diffSeconds : minExpiresIn;

    const pix = await createPixCharge({
      amount: installment.amount,
      description: `Mensalidade ${sub?.plan?.name || "Plano"} - ${installment.orderIndex}/${sub?.plan?.durationMonths || ""}`.slice(0, 30),
      expiresIn,
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
      paymentExpiresAt: new Date(pix.expiresAt),
      status: "pending",
    });

    // Send email with PIX
    if (notify && student?.email) {
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
    if (notify && cellphone && pix.brCode) {
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
      if (!student) throw new Error("Aluno não encontrado");

      const pix = await createCancellationFeePix(student, sub.plan.name, feeAmount, sub.id);

      await this.updateSubscription(sub.id, {
        status: "pending_fee",
        cancellationDate: new Date(),
        cancellationFeeInstallmentId: pix.id,
      });

      return {
        success: true,
        feeRequired: true,
        pixCode: pix.brCode,
        pixImage: pix.brCodeBase64,
        pixExpiresAt: pix.expiresAt,
        amount: feeAmount
      };
    }

    await this.updateSubscription(sub.id, {
      status: "cancelled",
      cancellationDate: new Date(),
    });

    return { success: true };
  },

  /**
   * Gera um PIX novo para a taxa de cancelamento quando o original expirou.
   * Não existia nenhum jeito de fazer isso antes — "Reenviar Taxa" só
   * reenviava o mesmo código morto por e-mail/WhatsApp, nunca criava um novo.
   * Reaproveita o valor já calculado em `cancelSubscription` (não recalcula
   * a partir do preço atual do plano, que pode ter mudado desde então).
   */
  async regenerateCancellationFee(studentId: string) {
    const student = await userService.getUser(studentId);
    if (!student) throw new Error("Aluno não encontrado");

    if (!student.cancellationPending || !student.cancellationAmount) {
      throw new Error("Este aluno não tem uma taxa de cancelamento pendente.");
    }

    const sub = await billingRepository.findPendingFeeSubscriptionByStudent(studentId);
    if (!sub) throw new Error("Assinatura em processo de cancelamento não encontrada.");

    const pix = await createCancellationFeePix(
      student,
      sub.plan?.name || "Plano",
      student.cancellationAmount,
      sub.id,
    );

    await userService.updateUser(studentId, {
      cancellationPixCode: pix.brCode,
      cancellationPixImage: pix.brCodeBase64,
      cancellationPixExpiresAt: new Date(pix.expiresAt),
    });

    await this.updateSubscription(sub.id, {
      cancellationFeeInstallmentId: pix.id,
    });

    revalidatePath("/pending-cancellation");
    revalidatePath(`/hub/admin/users/${studentId}`);
    revalidatePath(`/hub/manager/users/${studentId}`);

    return {
      pixCode: pix.brCode,
      pixImage: pix.brCodeBase64,
      pixExpiresAt: pix.expiresAt,
    };
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

  async getCurrentMonthPaymentStatusMap(): Promise<Record<string, "paid" | "unpaid" | "none">> {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const installments = await billingRepository.findInstallmentsInDateRangeNoStatus(start, end);
    const map: Record<string, "paid" | "unpaid" | "none"> = {};

    for (const inst of installments) {
      if (!inst.subscription) continue;
      const studentId = inst.subscription.studentId;
      
      const isPaid = inst.status === "paid";
      
      if (!map[studentId]) {
        map[studentId] = isPaid ? "paid" : "unpaid";
      } else if (map[studentId] === "paid" && !isPaid) {
        map[studentId] = "unpaid";
      }
    }
    return map;
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
      // O código venceu, mas a mensalidade continua devida. Antes isto marcava
      // a parcela como "cancelled", o que a tirava dos lembretes e do bloqueio
      // por inadimplência. Agora só descarta o código vencido; a parcela
      // segue pendente/atrasada e um código novo é gerado no próximo envio
      // (ensureValidPayment) ou pelo botão "Gerar novo PIX".
      await billingRepository.updateInstallment(installmentId, {
        abacatePayBillingId: null,
        pixPayload: null,
        pixImage: null,
        paymentExpiresAt: null,
      });
      revalidatePath("/hub/student/payments");
      return { status: installment.status };
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
    revalidatePath("/hub/student/payments");
    revalidatePath("/hub/admin/finances");

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

        // 2. In-App and Push Notification for Student
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
          console.error("[BillingService] Failed to send student notification:", error);
        }

        // 3. Admin & Manager Notification for Payment Received
        try {
          const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: sub?.plan?.currency || "BRL" }).format(installment.amount / 100);
          const monthStr = format(installment.dueDate, "MMMM/yyyy", { locale: ptBR });
          const paymentBody = `Pagamento de ${formattedAmount} recebido do aluno ${student.name} (Ref: ${monthStr}).`;

          await notificationService.sendNotification({
            title: "💰 Pagamento Recebido",
            body: paymentBody,
            targetType: "role",
            targetRole: "admin",
            category: "paymentsMade",
            channels: { inApp: true, push: true },
            actionUrl: "/hub/admin/finances",
          });

          await notificationService.sendNotification({
            title: "💰 Pagamento Recebido",
            body: paymentBody,
            targetType: "role",
            targetRole: "manager",
            category: "paymentsMade",
            channels: { inApp: true, push: true },
            actionUrl: "/hub/manager/users",
          });
        } catch (error) {
          console.error("[BillingService] Failed to send admin/manager payment notification:", error);
        }
      }

      // 4. Desbloqueio: se esta parcela deixava o aluno bloqueado e não
      // sobrou nenhuma outra, avisa o(s) professor(es) que ele voltou.
      try {
        const wasBlocking =
          !!installment.blockedAt ||
          (isUnderPolicy(installment.dueDate, getDelinquencyPolicyStart()) &&
            monthsPastDue(installment.dueDate, brtCivilDate(new Date())) >= 1);
        if (wasBlocking && !(await this.isStudentBlocked(sub.studentId))) {
          await this.notifyTeachersOfUnblock(sub.studentId);
        }
      } catch (error) {
        console.error("[BillingService] Failed to send unblock notice:", error);
      }
    }

    return { success: true };
  },

  // ---------------------------------------------------------------------------
  // Validade do código de pagamento
  // ---------------------------------------------------------------------------

  /** Consulta no gateway o estado da cobrança atual da parcela. Não altera nada. */
  async getGatewayPaymentState(installment: Installment, isUsd: boolean): Promise<GatewayState> {
    try {
      if (isUsd) {
        const id = installment.stripePaymentIntentId;
        if (!id) return { state: "unknown" };
        if (id.startsWith("cs_")) {
          const session = await stripe.checkout.sessions.retrieve(id);
          if (session.payment_status === "paid") {
            const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
            return { state: "paid", reference: ref };
          }
          if (session.status === "expired") return { state: "expired" };
          return { state: "open" };
        }
        const intent = await stripe.paymentIntents.retrieve(id);
        if (intent.status === "succeeded") return { state: "paid", reference: intent.id };
        return intent.status === "canceled" ? { state: "expired" } : { state: "open" };
      }

      const id = installment.abacatePayBillingId;
      if (!id) return { state: "unknown" };
      const res = await fetch(`https://api.abacatepay.com/v2/transparents/check?id=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.ABACATEPAY_API_KEY}`,
        },
      });
      if (!res.ok) return { state: "unknown" };
      const result = await res.json();
      const status = result?.data?.status;
      if (status === "PAID") return { state: "paid", reference: id };
      if (status === "EXPIRED" || status === "CANCELLED") return { state: "expired" };
      return status ? { state: "open" } : { state: "unknown" };
    } catch (error) {
      console.error("[BillingService.getGatewayPaymentState] Error:", error);
      return { state: "unknown" };
    }
  },

  /**
   * Garante que a parcela tem um código de pagamento válido antes de um envio.
   *
   * - Código válido por mais de 12h: usa o atual.
   * - Sem código, vencido ou vencendo: consulta o gateway primeiro. Se já foi
   *   pago, dá baixa e não cobra. Senão gera um novo, sem disparar mensagens
   *   (quem chamou envia o lembrete com o código novo).
   * - Stripe: expira a sessão antiga antes de criar outra, para o aluno não
   *   conseguir pagar duas vezes.
   *
   * Não chama revalidatePath diretamente (exceto via markInstallmentAsPaid);
   * não use durante a renderização de um RSC.
   */
  async ensureValidPayment(installmentId: string): Promise<
    | { status: "paid" }
    | { status: "ready"; pixPayload: string; pixImage: string | null; currency: string }
    | { status: "unavailable" }
  > {
    const inst = await billingRepository.findInstallmentWithDetails(installmentId);
    if (!inst) return { status: "unavailable" };
    if (inst.status === "paid") return { status: "paid" };

    const currency = inst.subscription.plan?.currency || "BRL";
    const isUsd = currency === "USD";
    const hasCharge = isUsd ? !!inst.stripePaymentIntentId : !!inst.abacatePayBillingId;
    const isFresh =
      !!inst.paymentExpiresAt && inst.paymentExpiresAt.getTime() - Date.now() > MIN_PAYMENT_VALIDITY_MS;

    if (hasCharge && isFresh && inst.pixPayload) {
      return { status: "ready", pixPayload: inst.pixPayload, pixImage: inst.pixImage, currency };
    }

    if (hasCharge) {
      const gateway = await this.getGatewayPaymentState(inst, isUsd);
      if (gateway.state === "paid") {
        await this.markInstallmentAsPaid(inst.id, gateway.reference);
        return { status: "paid" };
      }
      if (isUsd && gateway.state === "open" && inst.stripePaymentIntentId?.startsWith("cs_")) {
        try {
          await stripe.checkout.sessions.expire(inst.stripePaymentIntentId);
        } catch (error) {
          // Pode ter sido paga entre a consulta e o expire: confere de novo.
          const recheck = await this.getGatewayPaymentState(inst, isUsd);
          if (recheck.state === "paid") {
            await this.markInstallmentAsPaid(inst.id, recheck.reference);
            return { status: "paid" };
          }
          console.warn("[BillingService.ensureValidPayment] Stripe session expire failed:", error);
        }
      }
    }

    try {
      await this.generateInvoiceForInstallment(inst.id, true, { notify: false });
    } catch (error) {
      console.error(`[BillingService.ensureValidPayment] Failed to regenerate charge for ${inst.id}:`, error);
    }

    const refreshed = await billingRepository.findInstallmentById(inst.id);
    if (refreshed?.pixPayload) {
      return { status: "ready", pixPayload: refreshed.pixPayload, pixImage: refreshed.pixImage, currency };
    }
    return { status: "unavailable" };
  },

  // ---------------------------------------------------------------------------
  // Política de inadimplência: bloqueio
  // ---------------------------------------------------------------------------

  /**
   * Parcelas que mantêm o aluno bloqueado hoje: em aberto, da assinatura
   * ativa, sob a política, e com vencimento num mês anterior ao atual.
   */
  async getBlockingInstallments(studentId: string, today: CivilDate = brtCivilDate(new Date())) {
    const policyStart = getDelinquencyPolicyStart();
    if (!policyStart) return { subscription: null, installments: [] };

    const { subscription, installments } =
      await billingRepository.findUnpaidInstallmentsOfActiveSubscription(studentId);
    return {
      subscription,
      installments: installments.filter(
        (i) => isUnderPolicy(i.dueDate, policyStart) && monthsPastDue(i.dueDate, today) >= 1
      ),
    };
  },

  async isStudentBlocked(studentId: string, today?: CivilDate) {
    const { installments } = await this.getBlockingInstallments(studentId, today);
    return installments.length > 0;
  },

  /** Dados da página de pagamento obrigatório (/payment-required). Só leitura. */
  async getBlockedPaymentInfo(studentId: string) {
    const today = brtCivilDate(new Date());
    const { subscription, installments } = await this.getBlockingInstallments(studentId, today);
    const installment = installments[0];
    if (!subscription || !installment) return null;

    // Matrícula é cancelada no dia 1 do segundo mês após o vencimento.
    const due = dueCivilDate(installment.dueDate);
    const cancelDate: CivilDate = {
      year: due.month >= 10 ? due.year + 1 : due.year,
      month: (due.month + 2) % 12,
      day: 1,
    };

    return {
      installmentId: installment.id,
      amount: installment.amount,
      currency: subscription.plan?.currency || "BRL",
      dueDate: installment.dueDate,
      pixPayload: installment.pixPayload,
      pixImage: installment.pixImage,
      paymentExpiresAt: installment.paymentExpiresAt,
      pendingCount: installments.length,
      cancelDate: formatCivilDate(cancelDate),
    };
  },

  /**
   * Garante um código válido para a parcela que bloqueia o aluno. Chamado
   * pela página de pagamento obrigatório (via Server Action) quando o código
   * está ausente ou vencido.
   */
  async refreshBlockedPayment(studentId: string, installmentId: string) {
    const { installments } = await this.getBlockingInstallments(studentId);
    if (!installments.some((i) => i.id === installmentId)) {
      throw new Error("Parcela não encontrada");
    }
    return this.ensureValidPayment(installmentId);
  },

  /** Alunos que estarão bloqueados no dia informado (usado no cancelamento de aulas). */
  async getStudentIdsBlockedOn(day: CivilDate) {
    const policyStart = getDelinquencyPolicyStart();
    if (!policyStart) return [];

    const lastDayOfPreviousMonth = new Date(Date.UTC(day.year, day.month, 1) - 1);
    const candidates = await billingRepository.findUnpaidInstallmentsDueBefore(lastDayOfPreviousMonth);
    const ids = new Set<string>();
    for (const inst of candidates) {
      const sub = inst.subscription;
      if (!sub?.student || sub.status !== "active" || !sub.student.isActive) continue;
      if (!isUnderPolicy(inst.dueDate, policyStart)) continue;
      if (monthsPastDue(inst.dueDate, day) >= 1) ids.add(sub.studentId);
    }
    return [...ids];
  },

  async getTeachersOfStudent(studentId: string) {
    const { schedulingService } = await import("../scheduling/scheduling.service");
    const teacherIds = await schedulingService.getStudentTeacherIds(studentId);
    const teachers = await Promise.all(teacherIds.map((id) => userService.getUser(id)));
    return teachers.filter((t): t is User => !!t && t.isActive);
  },

  async notifyTeachersOfUnblock(studentId: string) {
    const student = await userService.getUser(studentId);
    if (!student) return;
    const teachers = await this.getTeachersOfStudent(studentId);

    for (const teacher of teachers) {
      const locale = recipientLocale(teacher);
      await communicationService.sendDelinquencyEmail(teacher.email, {
        kind: "teacherUnblocked",
        teacherName: teacher.name,
        studentName: student.name,
      }, locale);
      if (teacher.cellphone) {
        await communicationService.sendTeacherDelinquencyWhatsApp(teacher.cellphone, locale, {
          kind: "unblock",
          teacherName: teacher.name,
          studentName: student.name,
        });
      }
    }

    if (teachers.length > 0) {
      await notificationService.sendNotification({
        title: "✅ Aluno voltou às aulas",
        body: `${student.name} regularizou o pagamento e o acesso foi liberado. As próximas aulas seguem normalmente.`,
        targetType: "specific",
        userIds: teachers.map((t) => t.id),
        channels: { inApp: true, push: true },
      });
    }
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
        await this.confirmCancellationFeePayment(subscriptionId);
      }
    }
  },

  // Confirms a cancellation-fee payment (called by the webhook, or manually by an admin):
  // records the fee income and finalizes the cancellation (deactivates the student,
  // cancels the subscription/contract, sends the cancellation email).
  async confirmCancellationFeePayment(subscriptionId: string) {
    const sub = await billingRepository.findSubscriptionById(subscriptionId);

    // Idempotency: só registra se ainda estiver aguardando a taxa (evita duplicar em reentregas de webhook)
    if (sub?.status === "pending_fee" && sub.plan) {
      try {
        const { financeService } = await import("../finance/finance.service");
        const feeAmount = Math.floor(sub.plan.price * 0.5);
        const studentName = sub.student?.name || "Aluno";
        const planName = sub.plan.name || "Plano";

        await financeService.createTransaction(null, {
          type: "income",
          amount: feeAmount,
          currency: sub.plan.currency || "BRL",
          date: new Date(),
          description: `Taxa de Cancelamento: ${studentName} (${planName})`,
          category: "Taxa de Cancelamento",
          method: "pix",
          deductible: false,
          status: "paid",
        });
        console.log(`[BillingService] Cancellation fee transaction created for subscription ${subscriptionId}: ${feeAmount} cents`);
      } catch (err) {
        console.error("[BillingService] Failed to create cancellation fee transaction:", err);
      }
    }

    const { contractService } = await import("../contract/contract.service");
    const contract = await contractService.getContractBySubscriptionId(subscriptionId);
    if (contract) {
      await contractService.finalizeCancellation(contract.id);
    }
  },

  // 7. Process Billing Reminders (Called by Cron)
  async processBillingNotifications() {
    const now = new Date();
    const today = startOfDay(now);
    const twoDaysFromNowStart = startOfDay(addDays(now, 2));
    const twoDaysFromNowEnd = endOfDay(addDays(now, 2));

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
        checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/hub/student/payments`,
      });

      // Push & In-App
      await notificationService.sendNotification({
        title: "\u23F3 Sua fatura vence em breve",
        body: `Lembrete: Sua fatura de ${amountStr} vence em 2 dias. Evite atrasos!`,
        targetType: "specific",
        userIds: [student.id],
        channels: { inApp: true, push: true },
        actionUrl: "/hub/student/payments",
      });

      // WhatsApp — com o código conferido/renovado antes do envio
      if (student.cellphone) {
        const payment = await this.ensureValidPayment(inst.id);
        if (payment.status === "paid") continue;
        if (payment.status === "ready") {
          await communicationService.sendPaymentReminderWhatsApp({
            cellphone: student.cellphone,
            studentName: student.name,
            amount: inst.amount,
            dueDate: inst.dueDate,
            pixPayload: payment.pixPayload,
          }, recipientLocale(student));
        }
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
        checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/hub/student/payments`,
      });

      await notificationService.sendNotification({
        title: "\u23F0 Vencimento hoje!",
        body: `Sua mensalidade de ${amountStr} vence hoje. Clique para pagar via PIX.`,
        targetType: "specific",
        userIds: [student.id],
        channels: { inApp: true, push: true },
        actionUrl: "/hub/student/payments",
      });

      // WhatsApp no dia do vencimento (antes só ia email e push)
      if (student.cellphone) {
        const payment = await this.ensureValidPayment(inst.id);
        if (payment.status === "ready") {
          await communicationService.sendPaymentReminderWhatsApp({
            cellphone: student.cellphone,
            studentName: student.name,
            amount: inst.amount,
            dueDate: inst.dueDate,
            pixPayload: payment.pixPayload,
          }, recipientLocale(student));
        }
      }

      await billingRepository.updateInstallment(inst.id, { notifiedDueAt: new Date() });
    }

    // --- CASE 3: Atraso, bloqueio e cancelamento (política de inadimplência) ---
    await this.processDelinquency(now);
  },

  /**
   * Política de inadimplência, chamada pelo cron diário (00:00 de Brasília).
   * Para uma parcela que vence no mês M:
   * - 1º dia de atraso: vira "overdue", avisa aluno, admins e managers;
   * - de 3 em 3 dias até o fim de M: lembrete ao aluno;
   * - último dia de M: aviso final ao aluno e aos professores;
   * - mês M+1: aluno bloqueado; lembrete semanal; no último dia, aviso de cancelamento;
   * - dia 1 de M+2: cancelamento automático da matrícula, sem multa.
   * Só a parcela mais antiga em aberto de cada assinatura gera mensagens ao
   * aluno, para ninguém receber dois lembretes no mesmo dia.
   * Bloqueio e cancelamento só valem para parcelas sob a política
   * (DELINQUENCY_POLICY_START); as anteriores recebem apenas os lembretes.
   */
  async processDelinquency(now: Date = new Date()) {
    const today = brtCivilDate(now);
    const policyStart = getDelinquencyPolicyStart();
    // Vencimentos são gravados à meia-noite UTC do dia: "venceu antes de hoje".
    const dueBeforeToday = new Date(Date.UTC(today.year, today.month, today.day) - 1);
    const unpaid = await billingRepository.findUnpaidInstallmentsDueBefore(dueBeforeToday);

    const handledSubscriptions = new Set<string>();
    const toCancel: typeof unpaid = [];

    for (const inst of unpaid) {
      const sub = inst.subscription;
      const student = sub?.student;
      if (!sub || !student || sub.status !== "active" || !student.isActive) continue;

      try {
        const isOldest = !handledSubscriptions.has(sub.id);
        handledSubscriptions.add(sub.id);

        // 1º dia de atraso (comportamento original, agora para todas as parcelas)
        if (inst.status === "pending" || !inst.notifiedOverdueAt) {
          await this.sendFirstOverdueNotice(inst, isOldest);
          continue;
        }
        if (!isOldest) continue;

        const months = monthsPastDue(inst.dueDate, today);
        const underPolicy = isUnderPolicy(inst.dueDate, policyStart);
        const lastReminder = inst.lastOverdueReminderAt ?? inst.notifiedOverdueAt;
        const daysSinceReminder = lastReminder ? civilDaysBetween(brtCivilDate(lastReminder), today) : Infinity;

        if (months === 0) {
          if (underPolicy && isLastDayOfMonth(today)) {
            if (!inst.notifiedFinalWarningAt) await this.sendFinalWarning(inst, today);
          } else if (daysSinceReminder >= DELINQUENCY_REMINDER_INTERVAL_DAYS) {
            await this.sendOverdueReminder(inst);
          }
          continue;
        }

        if (!underPolicy) continue;

        if (months === 1) {
          if (!inst.blockedAt) await this.markStudentBlocked(inst);
          if (isLastDayOfMonth(today)) {
            if (!inst.notifiedCancelWarningAt) await this.sendCancelWarning(inst);
          } else if (daysSinceReminder >= DELINQUENCY_BLOCKED_REMINDER_INTERVAL_DAYS) {
            await this.sendBlockedReminder(inst, today);
          }
          continue;
        }

        toCancel.push(inst);
      } catch (error) {
        console.error(`[BillingService.processDelinquency] Failed for installment ${inst.id}:`, error);
      }
    }

    if (toCancel.length > 0) {
      await this.processDelinquentCancellations(toCancel);
    }
  },

  async sendFirstOverdueNotice(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number],
    notifyStudent: boolean
  ) {
    const student = inst.subscription.student!;
    const currency = inst.subscription.plan?.currency || "BRL";
    const amountStr = formatMoney(inst.amount, currency);
    const now = new Date();

    await billingRepository.updateInstallment(inst.id, {
      status: "overdue",
      notifiedOverdueAt: inst.notifiedOverdueAt ?? now,
      ...(notifyStudent ? { lastOverdueReminderAt: now, overdueReminderCount: inst.overdueReminderCount + 1 } : {}),
    });

    if (notifyStudent) {
      await this.sendOverdueMessages(inst);
    }

    // Notify Admin & Manager about overdue payment
    try {
      const monthStr = format(inst.dueDate, "MMMM/yyyy", { locale: ptBR });
      const overdueBody = `A mensalidade de ${amountStr} do aluno ${student.name} (Venc: ${format(inst.dueDate, "dd/MM")} - ${monthStr}) está em atraso.`;

      await notificationService.sendNotification({
        title: "⚠️ Mensalidade Atrasada",
        body: overdueBody,
        targetType: "role",
        targetRole: "admin",
        category: "paymentsOverdue",
        channels: { inApp: true, push: true },
        actionUrl: "/hub/admin/finances",
      });

      await notificationService.sendNotification({
        title: "⚠️ Mensalidade Atrasada",
        body: overdueBody,
        targetType: "role",
        targetRole: "manager",
        category: "paymentsOverdue",
        channels: { inApp: true, push: true },
        actionUrl: "/hub/manager/users",
      });
    } catch (err) {
      console.error("[BillingService] Failed to send overdue admin/manager notification:", err);
    }
  },

  /** Email + push + WhatsApp de "mensalidade em atraso", com código válido. */
  async sendOverdueMessages(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number]
  ) {
    const student = inst.subscription.student!;
    const amountStr = formatMoney(inst.amount, inst.subscription.plan?.currency || "BRL");

    const payment = await this.ensureValidPayment(inst.id);
    if (payment.status === "paid") return;

    await communicationService.sendBillingOverdueEmail(student.email, {
      studentName: student.name,
      amount: inst.amount,
      checkoutUrl: PAYMENTS_URL(),
    }, recipientLocale(student));

    await notificationService.sendNotification({
      title: "⚠️ Fatura em atraso",
      body: `Atenção: sua mensalidade de ${amountStr} está atrasada. Pague até o fim do mês para não ter o acesso bloqueado.`,
      targetType: "specific",
      userIds: [student.id],
      channels: { inApp: true, push: true },
      actionUrl: "/hub/student/payments",
    });

    if (student.cellphone && payment.status === "ready") {
      await communicationService.sendPaymentOverdueWhatsApp({
        cellphone: student.cellphone,
        studentName: student.name,
        amount: inst.amount,
        pixPayload: payment.pixPayload,
      }, recipientLocale(student));
    }
  },

  async sendOverdueReminder(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number]
  ) {
    await this.sendOverdueMessages(inst);
    await billingRepository.updateInstallment(inst.id, {
      lastOverdueReminderAt: new Date(),
      overdueReminderCount: inst.overdueReminderCount + 1,
    });
  },

  /** Último dia do mês do vencimento: aviso final ao aluno e aos professores. */
  async sendFinalWarning(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number],
    today: CivilDate
  ) {
    const student = inst.subscription.student!;
    const currency = inst.subscription.plan?.currency || "BRL";
    const amountStr = formatMoney(inst.amount, currency);
    const studentLocale = recipientLocale(student);

    const payment = await this.ensureValidPayment(inst.id);
    if (payment.status === "paid") return;

    await communicationService.sendDelinquencyEmail(student.email, {
      kind: "studentFinalWarning",
      studentName: student.name,
      amount: amountStr,
      payUrl: PAYMENTS_URL(),
    }, studentLocale);

    await notificationService.sendNotification({
      title: "🚨 Último dia para pagar",
      body: `Sua mensalidade de ${amountStr} segue em aberto. Sem o pagamento hoje, seu acesso será bloqueado a partir de amanhã e as aulas desse período não poderão ser repostas.`,
      targetType: "specific",
      userIds: [student.id],
      channels: { inApp: true, push: true },
      actionUrl: "/hub/student/payments",
    });

    if (student.cellphone) {
      await communicationService.sendDelinquencyStudentWhatsApp("payment_final_warning_v1", {
        cellphone: student.cellphone,
        studentName: student.name,
        amount: inst.amount,
        currency,
        pixPayload: payment.status === "ready" ? payment.pixPayload : null,
      }, studentLocale);
    }

    // Professores
    const blockDay = addCivilDays(today, 1);
    const teachers = await this.getTeachersOfStudent(student.id);
    for (const teacher of teachers) {
      const locale = recipientLocale(teacher);
      const blockDate = formatCivilDate(blockDay, locale);
      await communicationService.sendDelinquencyEmail(teacher.email, {
        kind: "teacherBlockWarning",
        teacherName: teacher.name,
        studentName: student.name,
        blockDate,
      }, locale);
      if (teacher.cellphone) {
        await communicationService.sendTeacherDelinquencyWhatsApp(teacher.cellphone, locale, {
          kind: "block",
          teacherName: teacher.name,
          studentName: student.name,
          blockDate,
        });
      }
    }
    if (teachers.length > 0) {
      await notificationService.sendNotification({
        title: "⚠️ Aluno pode ficar sem aulas",
        body: `${student.name} está com a mensalidade em atraso. Se não pagar hoje, fica sem acesso e sem aulas a partir de ${formatCivilDate(blockDay)}. As aulas perdidas nesse período não serão repostas.`,
        targetType: "specific",
        userIds: teachers.map((t) => t.id),
        channels: { inApp: true, push: true },
      });
    }

    await billingRepository.updateInstallment(inst.id, {
      notifiedFinalWarningAt: new Date(),
      lastOverdueReminderAt: new Date(),
      overdueReminderCount: inst.overdueReminderCount + 1,
    });
  },

  /** Dia 1 do mês seguinte ao vencimento: registra o bloqueio e avisa o aluno. */
  async markStudentBlocked(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number]
  ) {
    const student = inst.subscription.student!;
    await billingRepository.updateInstallment(inst.id, { blockedAt: new Date() });
    await notificationService.sendNotification({
      title: "🔒 Acesso bloqueado",
      body: "Seu acesso à plataforma está bloqueado por falta de pagamento. Pague a mensalidade para voltar às aulas.",
      targetType: "specific",
      userIds: [student.id],
      channels: { inApp: true, push: true },
      actionUrl: "/payment-required",
    });
  },

  /** Lembrete semanal durante o mês de bloqueio. */
  async sendBlockedReminder(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number],
    today: CivilDate
  ) {
    const student = inst.subscription.student!;
    const currency = inst.subscription.plan?.currency || "BRL";
    const locale = recipientLocale(student);

    const payment = await this.ensureValidPayment(inst.id);
    if (payment.status === "paid") return;

    const cancelDay: CivilDate = { year: today.month === 11 ? today.year + 1 : today.year, month: (today.month + 1) % 12, day: 1 };
    await communicationService.sendDelinquencyEmail(student.email, {
      kind: "studentBlockedReminder",
      studentName: student.name,
      amount: formatMoney(inst.amount, currency),
      cancelDate: formatCivilDate(cancelDay, locale),
      payUrl: PAYMENTS_URL(),
    }, locale);

    if (student.cellphone && payment.status === "ready") {
      await communicationService.sendPaymentOverdueWhatsApp({
        cellphone: student.cellphone,
        studentName: student.name,
        amount: inst.amount,
        pixPayload: payment.pixPayload,
      }, locale);
    }

    await notificationService.sendNotification({
      title: "🔒 Seu acesso continua bloqueado",
      body: `Pague a mensalidade para voltar às aulas. Sem pagamento, a matrícula será cancelada em ${formatCivilDate(cancelDay)}.`,
      targetType: "specific",
      userIds: [student.id],
      channels: { inApp: true, push: true },
      actionUrl: "/payment-required",
    });

    await billingRepository.updateInstallment(inst.id, {
      lastOverdueReminderAt: new Date(),
      overdueReminderCount: inst.overdueReminderCount + 1,
    });
  },

  /** Último dia do mês de bloqueio: amanhã a matrícula é cancelada. */
  async sendCancelWarning(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number]
  ) {
    const student = inst.subscription.student!;
    const currency = inst.subscription.plan?.currency || "BRL";
    const amountStr = formatMoney(inst.amount, currency);
    const locale = recipientLocale(student);

    const payment = await this.ensureValidPayment(inst.id);
    if (payment.status === "paid") return;

    await communicationService.sendDelinquencyEmail(student.email, {
      kind: "studentCancelWarning",
      studentName: student.name,
      amount: amountStr,
      payUrl: PAYMENTS_URL(),
    }, locale);

    await notificationService.sendNotification({
      title: "⚠️ Sua matrícula será cancelada amanhã",
      body: `Último dia para pagar a mensalidade de ${amountStr}. Sem o pagamento, a matrícula é cancelada automaticamente amanhã.`,
      targetType: "specific",
      userIds: [student.id],
      channels: { inApp: true, push: true },
      actionUrl: "/payment-required",
    });

    if (student.cellphone) {
      await communicationService.sendDelinquencyStudentWhatsApp("payment_cancel_warning_v1", {
        cellphone: student.cellphone,
        studentName: student.name,
        amount: inst.amount,
        currency,
        pixPayload: payment.status === "ready" ? payment.pixPayload : null,
      }, locale);
    }

    await billingRepository.updateInstallment(inst.id, {
      notifiedCancelWarningAt: new Date(),
      lastOverdueReminderAt: new Date(),
      overdueReminderCount: inst.overdueReminderCount + 1,
    });
  },

  /**
   * Dia 1 do segundo mês após o vencimento. Com DELINQUENCY_AUTO_CANCEL_ENABLED
   * desligado, só avisa os admins de quem seria cancelado.
   */
  async processDelinquentCancellations(
    installments: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>
  ) {
    if (!env.DELINQUENCY_AUTO_CANCEL_ENABLED) {
      const lines = installments.map((inst) =>
        `${inst.subscription.student!.name} — ${formatMoney(inst.amount, inst.subscription.plan?.currency || "BRL")} (venc. ${format(inst.dueDate, "dd/MM/yyyy")})`
      );
      const admins = (await userService.getUsersByRole("admin")).filter((a) => a.isActive);
      for (const admin of admins) {
        await communicationService.sendDelinquencyEmail(admin.email, {
          kind: "staffAutoCancelPreview",
          recipientName: admin.name,
          lines,
        }, recipientLocale(admin));
      }
      return;
    }

    for (const inst of installments) {
      try {
        await this.cancelSubscriptionForDelinquency(inst);
      } catch (error) {
        console.error(`[BillingService] Auto-cancel failed for subscription ${inst.subscriptionId}:`, error);
      }
    }
  },

  /**
   * Cancela a matrícula por inadimplência, sem multa rescisória.
   * Parcelas já vencidas continuam em aberto (a dívida segue registrada);
   * as futuras são canceladas. O contrato é finalizado pelo fluxo normal
   * (contrato cancelado, aulas futuras canceladas, usuário desativado).
   */
  async cancelSubscriptionForDelinquency(
    inst: Awaited<ReturnType<typeof billingRepository.findUnpaidInstallmentsDueBefore>>[number]
  ) {
    const sub = inst.subscription;
    const student = sub.student!;
    const currency = sub.plan?.currency || "BRL";
    const amountStr = formatMoney(inst.amount, currency);
    const dueMonth = format(inst.dueDate, "MM/yyyy");

    // Última checagem: pode ter sido pago agora há pouco.
    const gateway = await this.getGatewayPaymentState(inst, currency === "USD");
    if (gateway.state === "paid") {
      await this.markInstallmentAsPaid(inst.id, gateway.reference);
      return;
    }

    // Professores antes de finalizar: o cancelamento libera as regras do aluno.
    const teachers = await this.getTeachersOfStudent(student.id);

    await billingRepository.cancelInstallmentsDueAfter(sub.id, new Date());
    await billingRepository.createAuditLog({
      installmentId: inst.id,
      actorId: "system",
      actorName: "Cron de Inadimplência",
      previousStatus: inst.status,
      newStatus: inst.status,
      previousAmount: inst.amount,
      newAmount: inst.amount,
      reason: "Matrícula cancelada automaticamente por inadimplência (sem multa rescisória)",
    });

    const { contractService } = await import("../contract/contract.service");
    const contract = await contractService.getContractBySubscriptionId(sub.id);
    if (contract) {
      await contractService.finalizeCancellation(contract.id);
    } else {
      const { schedulingService } = await import("../scheduling/scheduling.service");
      await schedulingService.cancelFutureClassesForStudent(student.id);
      await this.updateSubscription(sub.id, { status: "cancelled" });
      await userService.updateUser(student.id, { isActive: false });
    }
    await this.updateSubscription(sub.id, { cancellationDate: new Date() });

    // Aluno
    const studentLocale = recipientLocale(student);
    await communicationService.sendDelinquencyEmail(student.email, {
      kind: "studentAccountCancelled",
      studentName: student.name,
      amount: amountStr,
    }, studentLocale);
    if (student.cellphone) {
      await communicationService.sendAccountCancelledDelinquencyWhatsApp(student.cellphone, student.name, studentLocale);
    }

    // Admins, managers e professores
    const staff = [
      ...(await userService.getActiveAdminsAndManagers()),
      ...teachers,
    ];
    for (const person of staff) {
      await communicationService.sendDelinquencyEmail(person.email, {
        kind: "staffAccountCancelled",
        recipientName: person.name,
        studentName: student.name,
        amount: amountStr,
        dueMonth,
      }, recipientLocale(person));
    }
    if (staff.length > 0) {
      await notificationService.sendNotification({
        title: "❌ Matrícula cancelada por inadimplência",
        body: `A matrícula de ${student.name} foi cancelada automaticamente (mensalidade de ${amountStr}, ${dueMonth}, não paga). Sem multa rescisória.`,
        targetType: "specific",
        userIds: staff.map((p) => p.id),
        channels: { inApp: true, push: true },
      });
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
    if (!previous) throw new Error("Parcela não encontrada");

    const amountChanged = data.amount !== undefined && data.amount !== previous.amount;
    const hasBilling = !!(previous.abacatePayBillingId || previous.stripePaymentIntentId);

    if (amountChanged && hasBilling) {
      const sub = await billingRepository.findSubscriptionById(previous.subscriptionId);
      const isUsd = sub?.plan?.currency === "USD";

      // 1. Cancelar fatura antiga no Stripe (se USD)
      if (isUsd && previous.stripePaymentIntentId?.startsWith("cs_")) {
        try {
          await stripe.checkout.sessions.expire(previous.stripePaymentIntentId);
        } catch (err) {
          console.warn("[BillingService] Stripe session expiration failed:", err);
        }
      }

      // 2. Limpar os dados antigos da fatura no banco e definir o novo valor
      await billingRepository.updateInstallment(id, {
        amount: data.amount,
        abacatePayBillingId: null,
        stripePaymentIntentId: null,
        pixPayload: null,
        pixImage: null,
        status: "pending",
      });

      // 3. Registrar log de auditoria
      if (actor) {
        await billingRepository.createAuditLog({
          installmentId: id,
          actorId: actor.id,
          actorName: actor.name,
          previousStatus: previous.status,
          newStatus: "pending",
          previousAmount: previous.amount,
          newAmount: data.amount!,
          reason: "Atualização de valor com re-faturamento pelo admin",
        });
      }

      // 4. Gerar e enviar nova fatura imediatamente com o valor atualizado e expiresIn recalculado
      try {
        await this.generateInvoiceForInstallment(id, true);
      } catch (err) {
        console.error("[BillingService] Failed to regenerate invoice after amount update:", err);
      }

      return;
    }

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

    // Confere (e renova, se preciso) o código antes de reenviar.
    const payment = await this.ensureValidPayment(installmentId);
    if (payment.status === "paid") {
      throw new Error("Esta parcela já consta como paga no gateway. O status foi atualizado.");
    }
    if (payment.status === "unavailable") {
      throw new Error("Não foi possível gerar um código de pagamento válido para esta parcela.");
    }

    const amountStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount / 100);

    // 1. Email Reminder
    if (student.email) {
      if (installment.status === "overdue") {
        await communicationService.sendBillingOverdueEmail(student.email, {
          studentName: student.name,
          amount: installment.amount,
          checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/hub/student/payments`,
        });
      } else {
        await communicationService.sendBillingReminderEmail(student.email, {
          studentName: student.name,
          amount: installment.amount,
          dueDate: installment.dueDate,
          checkoutUrl: `${env.NEXT_PUBLIC_APP_URL}/hub/student/payments`,
        });
      }
    }

    // 2. WhatsApp
    let cellphone = student.cellphone;
    if (cellphone) {
      if (cellphone.includes(":")) cellphone = decrypt(cellphone);
      cellphone = cellphone.replace(/\D/g, "");

      const payCode = payment.pixPayload;

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
          ? `Atenção: sua mensalidade de ${amountStr} está atrasada. Pague até o fim do mês para não ter o acesso bloqueado.`
          : `Lembrete: Sua fatura de ${amountStr} vence em breve. Evite atrasos!`,
        targetType: "specific",
        userIds: [student.id],
        channels: { inApp: true, push: true },
        actionUrl: "/hub/student/payments",
      });
    } catch (error) {
      console.error("[BillingService.resendInstallmentReminder] Failed to send notification:", error);
    }

    return { success: true };
  }
};

import { db } from "@/lib/db";
import { 
  plansTable, 
  subscriptionsTable, 
  installmentsTable, 
  billingAuditLogs,
  Subscription, 
  Installment 
} from "./billing.schema";
import { eq, and, lte, isNull, between, sum } from "drizzle-orm";

export const billingRepository = {
  // Audit
  async createAuditLog(data: typeof billingAuditLogs.$inferInsert) {
    await db.insert(billingAuditLogs).values(data);
  },
  // Plans
  async findPlanById(id: string) {
    return db.query.plansTable.findFirst({ where: eq(plansTable.id, id) });
  },
  async listActivePlans() {
    return db.select().from(plansTable).where(eq(plansTable.isActive, true));
  },
  async listAllPlans() {
    return db.select().from(plansTable);
  },
  async createPlan(data: typeof plansTable.$inferInsert) {
    const [plan] = await db.insert(plansTable).values(data).returning();
    return plan;
  },
  async updatePlan(id: string, data: Partial<typeof plansTable.$inferSelect>) {
    const [plan] = await db.update(plansTable).set(data).where(eq(plansTable.id, id)).returning();
    return plan;
  },

  // Subscriptions
  async findSubscriptionById(id: string) {
    return db.query.subscriptionsTable.findFirst({ 
      where: eq(subscriptionsTable.id, id),
      with: { student: true, plan: true } 
    });
  },
  async findActiveSubscriptionByStudent(studentId: string) {
    return db.query.subscriptionsTable.findFirst({
      where: and(
        eq(subscriptionsTable.studentId, studentId),
        eq(subscriptionsTable.status, "active")
      ),
      with: { plan: true }
    });
  },
  async findSubscriptionsByStudent(studentId: string) {
    return db.query.subscriptionsTable.findMany({
      where: eq(subscriptionsTable.studentId, studentId),
      with: { plan: true },
      orderBy: (table, { desc }) => [desc(table.startDate)]
    });
  },
  async createSubscription(data: typeof subscriptionsTable.$inferInsert) {
    const [sub] = await db.insert(subscriptionsTable).values(data).returning();
    return sub;
  },
  async updateSubscription(id: string, data: Partial<Subscription>) {
    await db.update(subscriptionsTable).set(data).where(eq(subscriptionsTable.id, id));
  },

  // Installments
  async findInstallmentById(id: string) {
    return db.query.installmentsTable.findFirst({ where: eq(installmentsTable.id, id) });
  },
  async findInstallmentByAbacateId(abacateId: string) {
    return db.query.installmentsTable.findFirst({ where: eq(installmentsTable.abacatePayBillingId, abacateId) });
  },
  async findInstallmentsBySubscription(subscriptionId: string) {
    return db.query.installmentsTable.findMany({
      where: eq(installmentsTable.subscriptionId, subscriptionId),
      orderBy: (table, { asc }) => [asc(table.orderIndex)]
    });
  },
  async createInstallments(data: (typeof installmentsTable.$inferInsert)[]) {
    return db.insert(installmentsTable).values(data).returning();
  },
  async updateInstallment(id: string, data: Partial<Installment>) {
    await db.update(installmentsTable).set(data).where(eq(installmentsTable.id, id));
  },
  async findSubscriptionsForCron(date: Date) {
    // Subscriptions that have an installment due in exactly 7 days
    // and don't have a billing generated yet for that installment
    return db.select()
      .from(installmentsTable)
      .where(and(
        eq(installmentsTable.status, "pending"),
        isNull(installmentsTable.abacatePayBillingId),
        lte(installmentsTable.dueDate, date)
      ))
      .limit(100);
  },
  async hasOverduePayments(subscriptionId: string) {
    const overdue = await db.query.installmentsTable.findFirst({
      where: and(
        eq(installmentsTable.subscriptionId, subscriptionId),
        eq(installmentsTable.status, "overdue")
      )
    });
    return !!overdue;
  },

  async hasPendingPayments(subscriptionId: string) {
    // Any pending installment that ALREADY has a billing ID
    const record = await db.query.installmentsTable.findFirst({
      where: (table, { and, eq, isNotNull }) => and(
        eq(table.subscriptionId, subscriptionId),
        eq(table.status, "pending"),
        isNotNull(table.abacatePayBillingId)
      )
    });

    return !!record;
  },

  async findInstallmentsInDateRange(start: Date, end: Date, status: "pending" | "paid" | "overdue" = "pending") {
    return db.query.installmentsTable.findMany({
      where: and(
        eq(installmentsTable.status, status),
        between(installmentsTable.dueDate, start, end)
      ),
      with: {
        subscription: {
          with: { student: true }
        }
      }
    });
  },

  async sumInstallments(filters: { status: "paid" | "pending"; start: Date; end: Date }) {
    const dateField = filters.status === "paid" ? installmentsTable.paidAt : installmentsTable.dueDate;
    
    const [result] = await db
      .select({ total: sum(installmentsTable.amount) })
      .from(installmentsTable)
      .where(and(
        eq(installmentsTable.status, filters.status),
        between(dateField, filters.start, filters.end)
      ));
    
    return Number(result?.total || 0);
  },

  async findInstallmentsDetails(filters: { status: "paid" | "pending"; start: Date; end: Date }) {
    const dateField = filters.status === "paid" ? installmentsTable.paidAt : installmentsTable.dueDate;
    
    return db.query.installmentsTable.findMany({
      where: and(
        eq(installmentsTable.status, filters.status),
        between(dateField, filters.start, filters.end)
      ),
      with: {
        subscription: {
          with: {
            student: true,
            plan: true
          }
        }
      },
      orderBy: (table, { asc }) => [asc(table.dueDate)]
    });
  },

  async findInstallmentsByStudent(studentId: string) {
    return db.query.installmentsTable.findMany({
      where: (table, { inArray }) => inArray(
        table.subscriptionId,
        db.select({ id: subscriptionsTable.id }).from(subscriptionsTable).where(eq(subscriptionsTable.studentId, studentId))
      ),
      with: {
        subscription: {
          with: { plan: true }
        }
      },
      orderBy: (table, { desc }) => [desc(table.dueDate)]
    });
  },

  async findInstallmentWithDetails(id: string) {
    return db.query.installmentsTable.findFirst({
      where: eq(installmentsTable.id, id),
      with: {
        subscription: {
          with: {
            plan: true,
            student: true
          }
        }
      }
    });
  }
};

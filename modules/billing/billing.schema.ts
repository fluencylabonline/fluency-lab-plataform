import { pgTable, text, timestamp, integer, pgEnum, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "../user/user.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const billingStatusEnum = pgEnum("billing_status", ["pending", "paid", "overdue", "cancelled"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "finished", "pending_fee"]);

export const plansTable = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  durationMonths: integer("duration_months").notNull(),
  frequency: text("frequency").notNull().default("MONTHLY"),
  abacatePayProductId: text("abacate_pay_product_id"),
  language: text("language"),
  classesPerWeek: integer("classes_per_week"),
  isActive: boolean("is_active").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
  currency: text("currency").notNull().default("BRL"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => usersTable.id),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plansTable.id),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  dueDay: integer("due_day").notNull(), // 1, 5, 10, 15
  cancellationDate: timestamp("cancellation_date"),
  cancellationFeeInstallmentId: text("cancellation_fee_installment_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const installmentsTable = pgTable("installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptionsTable.id),
  status: billingStatusEnum("status").notNull().default("pending"),
  dueDate: timestamp("due_date").notNull(),
  amount: integer("amount").notNull(), // in cents
  orderIndex: integer("order_index").notNull(), // 1 to 12
  abacatePayBillingId: text("abacate_pay_billing_id"), // Checkout/Billing ID from AbacatePay
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  pixPayload: text("pix_payload"), // For transparent checkout
  pixImage: text("pix_image"),     // For transparent checkout
  paidAt: timestamp("paid_at"),
  notified2dAt: timestamp("notified_2d_at"),
  notifiedDueAt: timestamp("notified_due_at"),
  notifiedOverdueAt: timestamp("notified_overdue_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const billingAuditLogs = pgTable("billing_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  installmentId: uuid("installment_id").notNull(),
  actorId: text("actor_id").notNull(),
  actorName: text("actor_name").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status").notNull(),
  previousAmount: integer("previous_amount"),
  newAmount: integer("new_amount"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const plansRelations = relations(plansTable, ({ many }) => ({
  subscriptions: many(subscriptionsTable),
}));

export const subscriptionsRelations = relations(subscriptionsTable, ({ one, many }) => ({
  student: one(usersTable, {
    fields: [subscriptionsTable.studentId],
    references: [usersTable.id],
  }),
  plan: one(plansTable, {
    fields: [subscriptionsTable.planId],
    references: [plansTable.id],
  }),
  installments: many(installmentsTable),
}));

export const installmentsRelations = relations(installmentsTable, ({ one }) => ({
  subscription: one(subscriptionsTable, {
    fields: [installmentsTable.subscriptionId],
    references: [subscriptionsTable.id],
  }),
}));

// Zod Schemas
export const selectPlanSchema = createSelectSchema(plansTable);
export const insertPlanSchema = createInsertSchema(plansTable);
export const selectSubscriptionSchema = createSelectSchema(subscriptionsTable);
export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable);
export const selectInstallmentSchema = createSelectSchema(installmentsTable);
export const insertInstallmentSchema = createInsertSchema(installmentsTable);

// Form / Logic Schemas
export const createPlanSchema = z.object({
  name: z.string().min(2),
  price: z.number().int().positive(),
  durationMonths: z.number().int().min(1),
  language: z.string().min(1),
  classesPerWeek: z.number().int().min(1),
  currency: z.enum(["BRL", "USD"]).default("BRL"),
  description: z.string().optional(),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  id: z.uuid(),
  effectiveDate: z.string().optional().nullable(),
});

export const changeStudentPlanSchema = z.object({
  studentId: z.string(),
  planId: z.string().uuid("ID de plano inválido"),
});

export const createSubscriptionSchema = z.object({
  studentId: z.string(),
  planId: z.string(),
  dueDay: z.number().refine((day) => [1, 5, 10, 15].includes(day), {
    message: "O vencimento deve ser 1, 5, 10 ou 15",
  }),
});

export const updateInstallmentSchema = z.object({
  id: z.uuid(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  amount: z.number().int().positive().optional(),
  password: z.string().optional(), // For sensitive manual changes
});

// AbacatePay Webhook Schemas
export const abacatePayMetadataSchema = z.object({
  installmentId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  type: z.string().optional(),
  // Support for legacy/alternative naming patterns
  installment: z.object({ id: z.string().uuid() }).optional(),
  subscription: z.object({ id: z.string().uuid() }).optional(),
  info: z.object({ type: z.string() }).optional(),
});

export const abacatePayWebhookSchema = z.object({
  event: z.string(),
  id: z.string(),
  data: z.object({
    billing: z.object({
      id: z.string(),
      metadata: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    }).optional(),
    transparent: z.object({
      id: z.string(),
      metadata: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    }).optional(),
    pixQrCode: z.object({
      id: z.string(),
      metadata: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    }).optional(),
  }),
});

export type Plan = typeof plansTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Installment = typeof installmentsTable.$inferSelect;

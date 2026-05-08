import {
  pgTable, uuid, varchar, timestamp, boolean, pgEnum, integer, jsonb, text
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "@/modules/user/user.schema";

// ================= ENUMS =================
export const slotTypeEnum = pgEnum("slot_type", ["NORMAL", "REPOSICAO", "RECESS_FALLBACK"]);

export const recurrenceFreqEnum = pgEnum("recurrence_freq", ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"]);

export const slotStatusEnum = pgEnum("slot_status", [
  "scheduled",
  "completed",
  "canceled-student",
  "canceled-teacher",
  "canceled-admin",
  "canceled-credit",         // Aula de reposição cancelada (perde o crédito)
  "no-show",
  "rescheduled",
  "teacher-recess",
  "overdue",
  "available"                // Necessário para slots abertos
]);

export const creditTypeEnum = pgEnum("credit_type", [
  "bonus",
  "late-students",
  "teacher-cancellation"
]);

// ================= TABELAS =================

// 1. Regras de Recorrência
export const recurrenceRules = pgTable("recurrence_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: varchar("teacher_id", { length: 128 }).notNull(),
  studentId: varchar("student_id", { length: 128 }),
  type: slotTypeEnum("type").notNull(),
  frequency: recurrenceFreqEnum("frequency").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(), // Ex: "14:00"
  endTime: varchar("end_time", { length: 5 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Tabela de Créditos
export const studentCredits = pgTable("student_credits", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: varchar("student_id", { length: 128 }).notNull(), // Firebase UID
  type: creditTypeEnum("type").notNull(),
  amount: integer("amount").default(1).notNull(), // Geralmente 1 crédito = 1 aula
  expiresAt: timestamp("expires_at").notNull(),
  grantedBy: varchar("granted_by", { length: 128 }).notNull(), // Manager/Admin/System
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  usedForClassId: uuid("used_for_class_id"), // Relaciona com a aula onde foi gasto
  reason: varchar("reason", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Instâncias de Aulas
export const slotInstances = pgTable("slot_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id").references(() => recurrenceRules.id),
  teacherId: varchar("teacher_id", { length: 128 }).notNull(),
  studentId: varchar("student_id", { length: 128 }),

  type: slotTypeEnum("type").notNull(),
  status: slotStatusEnum("status").default("available").notNull(),

  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),

  // Learning Content Links
  planId: varchar("plan_id", { length: 128 }),
  planName: varchar("plan_name", { length: 255 }),
  lessonId: varchar("lesson_id", { length: 128 }),
  lessonTitle: varchar("lesson_title", { length: 255 }),

  // Rastreamento de Reagendamento
  rescheduledFrom: jsonb("rescheduled_from").$type<{ originalClassId: string; originalScheduledAt: Date }>(),

  // Conversão para Slot Disponível
  convertedToAvailableSlot: boolean("converted_to_available_slot").default(false),
  convertedAt: timestamp("converted_at"),

  // Credit-Based Classes
  creditId: uuid("credit_id").references(() => studentCredits.id),
  creditType: creditTypeEnum("credit_type"),
  isReschedulable: boolean("is_reschedulable").default(true).notNull(),

  // Reminders tracking
  reminder24hSent: boolean("reminder_24h_sent").default(false).notNull(),
  reminder1hSent: boolean("reminder_1h_sent").default(false).notNull(),

  // Earnings Snapshot
  teacherHourlyRate: integer("teacher_hourly_rate"), 
  
  // Payout Tracking
  payoutId: uuid("payout_id"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Logs de Auditoria
export const schedulingAuditLogs = pgTable("scheduling_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull(),
  actorId: varchar("actor_id", { length: 128 }).notNull(),
  actorRole: varchar("actor_role", { length: 50 }).notNull(),
  previousStatus: slotStatusEnum("previous_status"),
  newStatus: slotStatusEnum("new_status").notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Solicitações de Recesso (SLA-Based)
export const recessRequestsTable = pgTable("scheduling_recess_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: varchar("teacher_id", { length: 128 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Status de validação automática
  isValidated: boolean("is_validated").default(true).notNull(),
  
  // Configuração de fallback por aula
  // { [classId]: { lessonId: string, message: string } }
  fallbackConfig: jsonb("fallback_config").$type<Record<string, { lessonId: string; message?: string }>>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// ================= RELATIONS =================
export const recurrenceRulesRelations = relations(recurrenceRules, ({ many }) => ({
  instances: many(slotInstances),
}));

export const slotInstancesRelations = relations(slotInstances, ({ one }) => ({
  rule: one(recurrenceRules, {
    fields: [slotInstances.ruleId],
    references: [recurrenceRules.id],
  }),
  credit: one(studentCredits, {
    fields: [slotInstances.creditId],
    references: [studentCredits.id],
  }),
  student: one(usersTable, {
    fields: [slotInstances.studentId],
    references: [usersTable.id],
  }),
  teacher: one(usersTable, {
    fields: [slotInstances.teacherId],
    references: [usersTable.id],
  }),
}));

export const studentCreditsRelations = relations(studentCredits, ({ one }) => ({
  class: one(slotInstances, {
    fields: [studentCredits.usedForClassId],
    references: [slotInstances.id],
  }),
}));

// ================= SCHEMAS =================
export const selectRecurrenceRuleSchema = createSelectSchema(recurrenceRules);
export const insertRecurrenceRuleSchema = createInsertSchema(recurrenceRules);

export const selectStudentCreditSchema = createSelectSchema(studentCredits);
export const insertStudentCreditSchema = createInsertSchema(studentCredits);

export const selectSlotInstanceSchema = createSelectSchema(slotInstances);
export const insertSlotInstanceSchema = createInsertSchema(slotInstances);

export const selectRecessRequestSchema = createSelectSchema(recessRequestsTable);
export const insertRecessRequestSchema = createInsertSchema(recessRequestsTable);

// ================= DTOs =================
export const rescheduleWithCreditSchema = z.object({
  originalClassId: z.uuid(),
  newSlotId: z.uuid(),
  creditId: z.uuid(),
});

export const cancelClassSchema = z.object({
  classId: z.uuid(),
  reason: z.enum([
    "canceled-student",
    "canceled-teacher",
    "canceled-admin",
    "canceled-credit"
  ]),
});

export const allocateStudentSchema = z.object({
  ruleId: z.uuid(),
  studentId: z.string(),
});

export const updateSlotStatusSchema = z.object({
  classId: z.uuid(),
  status: z.enum(slotStatusEnum.enumValues),
});

export const grantCreditSchema = z.object({
  studentId: z.string(),
  type: z.enum(creditTypeEnum.enumValues),
  amount: z.number().int().positive().default(1),
  expiresAt: z.coerce.date(),
  reason: z.string().max(255).optional(),
});

export const createRecurrenceRuleSchema = z.object({
  teacherId: z.string(),
  studentId: z.string().optional().nullable(),
  type: z.enum(slotTypeEnum.enumValues),
  frequency: z.enum(recurrenceFreqEnum.enumValues),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido (HH:mm)"),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
});

export type CreateRecurrenceRuleValues = z.input<typeof createRecurrenceRuleSchema>;

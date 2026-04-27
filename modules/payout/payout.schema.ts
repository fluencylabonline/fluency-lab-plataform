import {
  pgTable, uuid, varchar, timestamp, integer, pgEnum, jsonb, text
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "@/modules/user/user.schema";
import { slotInstances, recurrenceRules, studentCredits } from "@/modules/scheduling/scheduling.schema";

export const payoutStatusEnum = pgEnum("payout_status", ["pending", "completed", "failed"]);

export const payoutsTable = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: text("teacher_id").notNull().references(() => usersTable.id),
  amount: integer("amount").notNull(), // em centavos
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: payoutStatusEnum("status").default("pending").notNull(),
  
  // AbacatePay Details
  abacatePayoutId: varchar("abacate_payout_id", { length: 255 }),
  pixKey: varchar("pix_key", { length: 255 }).notNull(),
  pixKeyType: varchar("pix_key_type", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull().unique(),
  
  description: varchar("description", { length: 255 }),
  metadata: jsonb("metadata").$type<{
    classIds: string[];
    teacherName: string;
    emailSent: boolean;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const payoutsRelations = relations(payoutsTable, ({ one, many }) => ({
  teacher: one(usersTable, {
    fields: [payoutsTable.teacherId],
    references: [usersTable.id],
  }),
  classes: many(slotInstances),
}));

export const slotInstancesRelationsPayout = relations(slotInstances, ({ one }) => ({
  payout: one(payoutsTable, {
    fields: [slotInstances.payoutId],
    references: [payoutsTable.id],
  }),
  student: one(usersTable, {
    fields: [slotInstances.studentId],
    references: [usersTable.id],
  }),
  rule: one(recurrenceRules, {
    fields: [slotInstances.ruleId],
    references: [recurrenceRules.id],
  }),
  credit: one(studentCredits, {
    fields: [slotInstances.creditId],
    references: [studentCredits.id],
  }),
}));

import { pgTable, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { usersTable } from "../user/user.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notificationsTable = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Índices das consultas quentes (listas, agenda, cobrança, crons).
  index("notifications_user_created_idx").on(t.userId, t.createdAt),
]);

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  subscription: jsonb("subscription").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Índices das consultas quentes (listas, agenda, cobrança, crons).
  index("push_subscriptions_user_idx").on(t.userId),
]);

// Schemas
export const selectNotificationSchema = createSelectSchema(notificationsTable);
export const insertNotificationSchema = createInsertSchema(notificationsTable);

export const selectPushSubscriptionSchema = createSelectSchema(pushSubscriptionsTable);
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptionsTable);

// Types
export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;
export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;

// Admin Action Schemas
export const sendNotificationSchema = z.object({
  title: z.string().min(1, "Notification.validation.titleRequired"),
  body: z.string().min(1, "Notification.validation.bodyRequired"),
  actionUrl: z.string().optional(),
  icon: z.string().optional(),
  targetType: z.enum(["all", "role", "specific"]),
  targetRole: z.enum(["admin", "teacher", "student", "manager"]).optional(),
  userIds: z.array(z.string()).optional(),
  category: z
    .enum([
      "streak",
      "roadmap",
      "classes",
      "marketing",
      "whatsapp",
      "paymentsMade",
      "paymentsOverdue",
      "upcomingClasses",
      "pendingClasses",
      "unupdatedClasses",
    ])
    .optional(),
  channels: z.object({
    push: z.boolean().default(true),
    inApp: z.boolean().default(true),
  }),
});

export type SendNotificationValues = z.input<typeof sendNotificationSchema>;

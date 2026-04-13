import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { roleEnum } from "../user/user.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const announcementTypeEnum = pgEnum("announcement_type", [
  "info",
  "success",
  "warning",
  "error",
]);

export const recipientsTypeEnum = pgEnum("recipients_type", [
  "all",
  "role",
  "specific",
]);

export const announcementsTable = pgTable("announcements", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: announcementTypeEnum("type").notNull().default("info"),
  link: text("link"),
  recipientsType: recipientsTypeEnum("recipients_type").notNull().default("all"),
  recipientsRoles: roleEnum("recipients_roles").array(),
  recipientsUserIds: text("recipients_user_ids").array(),
  createdBy: text("created_by").notNull().default("SYSTEM"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const announcementReadsTable = pgTable("announcement_reads", {
  announcementId: text("announcement_id")
    .notNull()
    .references(() => announcementsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod Schemas
export const selectAnnouncementSchema = createSelectSchema(announcementsTable);
export const insertAnnouncementSchema = createInsertSchema(announcementsTable);

export const subscribePushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export type Announcement = typeof announcementsTable.$inferSelect;
export type NewAnnouncement = typeof announcementsTable.$inferInsert;
export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptionsTable.$inferInsert;

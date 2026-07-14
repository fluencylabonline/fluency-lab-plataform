import { z } from "zod";
import { pgTable, text, timestamp, integer, uuid, jsonb, pgEnum, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "../user/user.schema";

export const whatsappMessageDirectionEnum = pgEnum("whatsapp_message_direction", ["inbound", "outbound"]);
export const whatsappMessageStatusEnum = pgEnum("whatsapp_message_status", ["sent", "delivered", "read", "failed"]);

export const whatsappConversationsTable = pgTable("whatsapp_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  waId: text("wa_id").notNull().unique(), // O ID do WhatsApp (ex: 55119...)
  studentId: text("student_id").references(() => usersTable.id),
  contactName: text("contact_name"),
  labels: jsonb("labels").default([]),
  lastMessageContent: text("last_message_content"),
  lastMessageAt: timestamp("last_message_at"),
  unreadCount: integer("unread_count").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const whatsappMessagesTable = pgTable("whatsapp_messages", {
  id: text("id").primaryKey(), // ID da Meta (wamid.HB...)
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => whatsappConversationsTable.id, { onDelete: "cascade" }),
  content: text("content"),
  type: text("type").notNull().default("text"), // text, image, audio, etc.
  direction: whatsappMessageDirectionEnum("direction").notNull(),
  status: whatsappMessageStatusEnum("status").notNull().default("sent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const whatsappQuickRepliesTable = pgTable("whatsapp_quick_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  shortcut: text("shortcut").notNull().unique(), // ex: "/boasvindas"
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const createWhatsAppTemplateSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9_]+$/, "O nome deve conter apenas letras minúsculas, números e sublinhados"),
  category: z.enum(["AUTHENTICATION", "MARKETING", "UTILITY"]),
  language: z.string().default("pt_BR"),
  components: z.array(z.any()), 
  bodyText: z.string().min(1, "O conteúdo é obrigatório").optional(),
});

export const createWhatsAppQuickReplySchema = z.object({
  shortcut: z.string().min(1, "O atalho é obrigatório").regex(/^\/[a-zA-Z0-9_\-]+$/, "O atalho deve começar com '/' seguido de letras ou números, sem espaços"),
  title: z.string().min(1, "O título é obrigatório"),
  content: z.string().min(1, "O conteúdo é obrigatório"),
});

export type CreateWhatsAppTemplateValues = z.input<typeof createWhatsAppTemplateSchema>;
export type CreateWhatsAppQuickReplyValues = z.input<typeof createWhatsAppQuickReplySchema>;
export type WhatsAppQuickReply = typeof whatsappQuickRepliesTable.$inferSelect;
export type NewWhatsAppQuickReply = typeof whatsappQuickRepliesTable.$inferInsert;

export const emailDirectionEnum = pgEnum("email_direction", ["inbound", "outbound"]);

export const emailsTable = pgTable("emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  resendId: text("resend_id").unique(),
  from: text("from").notNull(),
  to: jsonb("to").notNull(),
  subject: text("subject").notNull(),
  html: text("html"),
  text: text("text"),
  direction: emailDirectionEnum("direction").notNull(),
  status: text("status").notNull().default("sent"),
  studentId: text("student_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  metadata: jsonb("metadata"),
});

export const sendAdminEmailSchema = z.object({
  to: z.string().email("E-mail do destinatário inválido"),
  subject: z.string().min(1, "O assunto é obrigatório"),
  body: z.string().min(1, "O conteúdo é obrigatório"),
});

export type SendAdminEmailValues = z.input<typeof sendAdminEmailSchema>;
export type EmailMessage = typeof emailsTable.$inferSelect;




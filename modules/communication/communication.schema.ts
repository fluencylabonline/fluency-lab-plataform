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

export const createWhatsAppTemplateSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9_]+$/, "O nome deve conter apenas letras minúsculas, números e sublinhados"),
  category: z.enum(["AUTHENTICATION", "MARKETING", "UTILITY"]),
  language: z.string().default("pt_BR"),
  components: z.array(z.any()), 
  bodyText: z.string().min(1, "O conteúdo é obrigatório").optional(),
});

export type CreateWhatsAppTemplateValues = z.input<typeof createWhatsAppTemplateSchema>;


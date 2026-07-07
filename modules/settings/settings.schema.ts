import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const systemSettingsTable = pgTable("system_settings", {
  id: text("id").primaryKey().default("default"),
  whatsappNumber: text("whatsapp_number").notNull().default("5549936180727"),
  whatsappMessage: text(
    "whatsapp_message"
  ).notNull().default(
    "Olá! Vi o site da Fluency Lab e gostaria de saber mais sobre as aulas personalizadas."
  ),
  supportEmail: text("support_email").notNull().default("contato@fluencylab.com.br"),
  contactText: text(
    "contact_text"
  ).notNull().default(
    "Fale conosco através de um dos nossos canais de atendimento ou confira nossa seção de perguntas frequentes abaixo."
  ),
  faq: jsonb("faq")
    .$type<{ question: string; answer: string }[]>()
    .notNull()
    .default(sql`'[]'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const selectSystemSettingsSchema = createSelectSchema(systemSettingsTable);

export const updateSystemSettingsSchema = z.object({
  whatsappNumber: z
    .string()
    .min(10, "Número do WhatsApp inválido (ex: 5549936180727)"),
  whatsappMessage: z.string().min(1, "Mensagem do WhatsApp é obrigatória"),
  supportEmail: z.string().email("E-mail de suporte inválido"),
  contactText: z.string().min(1, "Mensagem de contato é obrigatória"),
  faq: z.array(
    z.object({
      question: z.string().min(1, "Pergunta não pode ser vazia"),
      answer: z.string().min(1, "Resposta não pode ser vazia"),
    })
  ),
});

export type SystemSettings = typeof systemSettingsTable.$inferSelect;
export type UpdateSystemSettingsValues = z.input<
  typeof updateSystemSettingsSchema
>;

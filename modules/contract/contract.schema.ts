import { pgTable, text, timestamp, boolean, pgEnum, uuid, jsonb, AnyPgColumn } from "drizzle-orm/pg-core";
import { usersTable } from "../user/user.schema";
import { relations } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import z from "zod";

// Enums
export const contractRegionEnum = pgEnum("contract_region", ["BR", "US"]);
export const contractTypeEnum = pgEnum("contract_type", ["student", "teacher"]);
export const contractStatusEnum = pgEnum("contract_status", ["pending", "signed", "cancelled", "expired"]);
export const partyTypeEnum = pgEnum("party_type", ["individual", "business"]); // individual (PF) vs business (PJ)

// Templates: O molde base de cada contrato
export const contractTemplatesTable = pgTable("contract_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  content: text("content").notNull(), // Markdown/HTML com handlebars syntax
  version: text("version").notNull(),
  region: contractRegionEnum("region").notNull(),
  type: contractTypeEnum("type").notNull(),
  partyType: partyTypeEnum("party_type").notNull().default("individual"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Instâncias: O contrato específico associado a um usuário
export const contractInstancesTable = pgTable("contract_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => contractTemplatesTable.id),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),

  // Para rastreamento de linhagem (renovações)
  parentInstanceId: uuid("parent_instance_id").references((): AnyPgColumn => contractInstancesTable.id),

  // Vínculo com pagamentos (AbacatePay/Billing)
  subscriptionId: uuid("subscription_id"),

  // Para menores de idade
  guardianId: text("guardian_id").references(() => usersTable.id),
  guardianData: jsonb("guardian_data"), // Backup dos dados do responsável (Criptografado)

  status: contractStatusEnum("status").notNull().default("pending"),
  signedContent: text("signed_content"), // Snapshot do contrato com dados injetados
  integrityHash: text("integrity_hash"), // SHA-256 do signedContent + metadados

  signedAt: timestamp("signed_at"),
  expiresAt: timestamp("expires_at"),
  autoRenew: boolean("auto_renew").notNull().default(true),

  pdfUrl: text("pdf_url"), // Caminho no Firebase Storage

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Metadados de Assinatura (Forense/Auditoria)
export const contractSignaturesMetadataTable = pgTable("contract_signatures_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  instanceId: uuid("instance_id")
    .notNull()
    .references(() => contractInstancesTable.id),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  browser: text("browser"),
  os: text("os"),
  location: text("location"), // Cidade/UF/País aproximado via IP
  fingerprint: text("fingerprint"), // Browser/Hardware fingerprint
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Configurações da Escola (Para auto-assinatura)
export const schoolSettingsTable = pgTable("school_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  legalName: text("legal_name").notNull(),
  taxId: text("tax_id").notNull(), // CNPJ ou Tax ID (Criptografado)
  address: jsonb("address").notNull(), // Objeto estruturado { street, city, state, zip, etc }
  representativeName: text("representative_name").notNull(),
  representativeTaxId: text("representative_tax_id").notNull(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relations
export const contractTemplatesRelations = relations(contractTemplatesTable, ({ many }) => ({
  instances: many(contractInstancesTable),
}));

export const contractInstancesRelations = relations(contractInstancesTable, ({ one, many }) => ({
  template: one(contractTemplatesTable, {
    fields: [contractInstancesTable.templateId],
    references: [contractTemplatesTable.id],
  }),
  user: one(usersTable, {
    fields: [contractInstancesTable.userId],
    references: [usersTable.id],
  }),
  guardian: one(usersTable, {
    fields: [contractInstancesTable.guardianId],
    references: [usersTable.id],
  }),
  signaturesMetadata: many(contractSignaturesMetadataTable),
}));

export const contractSignaturesMetadataRelations = relations(contractSignaturesMetadataTable, ({ one }) => ({
  instance: one(contractInstancesTable, {
    fields: [contractSignaturesMetadataTable.instanceId],
    references: [contractInstancesTable.id],
  }),
}));

// Schemas via drizzle-zod
export const selectContractTemplateSchema = createSelectSchema(contractTemplatesTable);
export const insertContractTemplateSchema = createInsertSchema(contractTemplatesTable);
export const selectContractInstanceSchema = createSelectSchema(contractInstancesTable);
export const insertContractInstanceSchema = createInsertSchema(contractInstancesTable);
export const selectSchoolSettingsSchema = createSelectSchema(schoolSettingsTable);
export const insertSchoolSettingsSchema = createInsertSchema(schoolSettingsTable);

export const signContractSchema = z.object({
  instanceId: z.uuid("ID de contrato inválido."),
  guardianData: z.object({
    name: z.string().min(2, "Nome do responsável é obrigatório."),
    taxId: z.string().min(1, "Documento do responsável é obrigatório."),
    relationship: z.string().min(1, "Parentesco é obrigatório."),
  }).optional(),
});

export type ContractTemplate = typeof contractTemplatesTable.$inferSelect;
export type ContractInstance = typeof contractInstancesTable.$inferSelect;
export type SchoolSettings = typeof schoolSettingsTable.$inferSelect;
export type ContractSignatureMetadata = typeof contractSignaturesMetadataTable.$inferSelect;

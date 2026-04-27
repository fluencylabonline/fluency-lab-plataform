import { pgTable, text, timestamp, integer, boolean, uuid, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "../user/user.schema";

export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "paid", "cancelled"]);

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(), // em centavos
  currency: text("currency").notNull().default("BRL"),
  date: timestamp("date").notNull().defaultNow(),
  description: text("description"),
  method: text("method"),
  category: text("category"),
  deductible: boolean("deductible").notNull().default(false),
  status: transactionStatusEnum("status").notNull().default("paid"),
  attachmentUrl: text("attachment_url"),
  
  // Audit
  createdBy: text("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const fiscalConfigsTable = pgTable("fiscal_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull().unique(),
  meiExemptPercentage: integer("mei_exempt_percentage").notNull().default(32), // Ex: 32%
  
  // Tabela Progressiva do IRPF
  // Array de { min: number, max: number | null, rate: number, deduction: number }
  // Valores min, max e deduction em centavos
  irpfRanges: jsonb("irpf_ranges").notNull().$type<{
    min: number;
    max: number | null;
    rate: number; // Ex: 7.5
    deduction: number; // centavos
  }[]>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Schemas
export const selectTransactionSchema = createSelectSchema(transactionsTable);
export const insertTransactionSchema = createInsertSchema(transactionsTable);

export const selectFiscalConfigSchema = createSelectSchema(fiscalConfigsTable);
export const insertFiscalConfigSchema = createInsertSchema(fiscalConfigsTable);

// Form Schemas
export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().int().positive("Valor deve ser positivo"),
  currency: z.string().default("BRL"),
  date: z.date().or(z.string().pipe(z.coerce.date())),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().optional(),
  method: z.string().optional(),
  deductible: z.boolean().default(false),
  status: z.enum(["pending", "paid", "cancelled"]).default("paid"),
  attachmentUrl: z.string().optional(),
});

export const upsertFiscalConfigSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  meiExemptPercentage: z.number().int().min(0).max(100),
  irpfRanges: z.array(z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative().nullable(),
    rate: z.number().min(0).max(100),
    deduction: z.number().int().nonnegative(),
  })),
});

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;
export type FiscalConfig = typeof fiscalConfigsTable.$inferSelect;
export type NewFiscalConfig = typeof fiscalConfigsTable.$inferInsert;

export type CreateTransactionValues = z.input<typeof createTransactionSchema>;
export type UpsertFiscalConfigValues = z.input<typeof upsertFiscalConfigSchema>;

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().uuid(),
});
export type UpdateTransactionValues = z.input<typeof updateTransactionSchema>;

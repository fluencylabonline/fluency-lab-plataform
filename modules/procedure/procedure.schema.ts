import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "../user/user.schema";
import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

// ================= TABLES =================

export const proceduresTable = pgTable("procedures", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: jsonb("content").$type<JSONContent>().default({ type: "doc", content: [] }).notNull(),
  createdBy: text("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ================= RELATIONS =================

export const proceduresRelations = relations(proceduresTable, ({ one }) => ({
  author: one(usersTable, {
    fields: [proceduresTable.createdBy],
    references: [usersTable.id],
  }),
}));

// ================= ZOD SCHEMAS =================

export const insertProcedureSchema = createInsertSchema(proceduresTable, {
  title: (s) => s.min(3, "O título deve ter pelo menos 3 caracteres"),
});

export const selectProcedureSchema = createSelectSchema(proceduresTable);

export const updateProcedureSchema = z.object({
  procedureId: z.string().uuid(),
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").optional(),
  content: z.custom<JSONContent>().optional(),
});

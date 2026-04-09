import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { locales } from "@/i18n/config";

// Enums
export const roleEnum = pgEnum("role", [
  "admin",
  "teacher",
  "student",
  "manager",
]);
export const localeEnum = pgEnum("locale_enum", locales);

// Table
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Using Firebase UID as primary key
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  photoUrl: text("photo_url"),
  googleLinked: boolean("google_linked").notNull().default(false),
  locale: localeEnum("locale").notNull().default("pt-BR"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Schemas
export const selectUserSchema = createSelectSchema(usersTable);
export const insertUserSchema = createInsertSchema(usersTable);

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

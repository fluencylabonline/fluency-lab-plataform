import { pgTable, text, timestamp, boolean, pgEnum, integer } from "drizzle-orm/pg-core";
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
  locale: localeEnum("locale").notNull().default("pt"),

  // Auth & Onboarding
  isActive: boolean("is_active").notNull().default(true),
  onboarded: boolean("onboarded").notNull().default(false),
  isMinor: boolean("is_minor").notNull().default(false),

  // Profile & Contact
  phone: text("phone"),

  // Credits to schedule classes
  credits: integer("credits").notNull().default(0),

  // Audit
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

import { z } from "zod";

// Schemas
export const selectUserSchema = createSelectSchema(usersTable);
export const insertUserSchema = createInsertSchema(usersTable);

// Auth Form Schemas
export const signInSchema = z.object({
  email: z.string().email("Validation.emailInvalid"),
  password: z.string().min(8, "Validation.passwordMin"),
  rememberMe: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Validation.emailInvalid"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Validation.passwordMin"),
    confirmPassword: z.string().min(8, "Validation.passwordMin"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Validation.passwordMismatch",
    path: ["confirmPassword"],
  });

export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "Validation.invalid2faCode")
    .regex(/^\d+$/, "Validation.onlyNumbers"),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type SignInValues = z.infer<typeof signInSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type TwoFactorValues = z.infer<typeof twoFactorSchema>;

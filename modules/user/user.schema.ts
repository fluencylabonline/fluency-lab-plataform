import { pgTable, text, timestamp, boolean, pgEnum, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { locales } from "@/i18n/config";
import { z } from "zod";

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

  // Profile & Contact
  phone: text("phone"),

  // Student details
  classesStartDate: timestamp("classes_start_date"),
  languages: text("languages").array().notNull().default(sql`'{}'`),

  // Audit
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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

export const requestNewInviteSchema = z.object({
  email: z.string().email("Validation.emailInvalid"),
  locale: z.enum(locales).optional().default("pt"),
});

// Form Schemas
export const createUserSchema = z.object({
  name: z.string().min(2, "UserManagement.validation.nameRequired"),
  email: z.email("UserManagement.validation.emailInvalid"),
  role: z.enum(["admin", "teacher", "student", "manager"], {
    message: "UserManagement.validation.roleRequired",
  }),
  classesStartDate: z.string().optional().nullable(),
  languages: z.array(z.string()).optional().default([]),
  locale: z.enum(locales).optional().default("pt"),
});

export type CreateUserValues = z.input<typeof createUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type SignInValues = z.input<typeof signInSchema>;
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;
export type TwoFactorValues = z.input<typeof twoFactorSchema>;
export type RequestNewInviteValues = z.input<typeof requestNewInviteSchema>;

// Rate Limiting Table 
// TODO: TEMPORARY
export const rateLimitsTable = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  points: integer("points").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

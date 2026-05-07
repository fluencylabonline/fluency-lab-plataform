import { pgTable, text, timestamp, boolean, pgEnum, integer, uuid, jsonb } from "drizzle-orm/pg-core";
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
  onboardingStep: integer("onboarding_step").notNull().default(1),

  // Contact & Billing
  cellphone: text("cellphone"),
  taxId: text("tax_id"),
  businessTaxId: text("business_tax_id"), // CNPJ (Criptografado)
  pixKey: text("pix_key"),               // Chave PIX (Criptografado)
  pixType: text("pix_type"),              // Tipo de chave PIX

  // Student details
  classesStartDate: timestamp("classes_start_date"),
  languages: text("languages").array().notNull().default(sql`'{}'`),
  abacatePayCustomerId: text("abacate_pay_customer_id"),
  assignedPlanId: uuid("assigned_plan_id"),
  dueDay: integer("preferred_due_day").default(10),

  // Profile / Onboarding Details
  nickname: text("nickname"),
  birthDate: timestamp("birth_date"),
  nationality: text("nationality"),
  address: text("address"), // Encriptado no Service (JSON string)
  guardianName: text("guardian_name"),
  guardianTaxId: text("guardian_tax_id"), // Encriptado no Service
  guardianRelationship: text("guardian_relationship"),

  // Audit
  lastLoginAt: timestamp("last_login_at"), //TODO: Não está sendo usado
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  // Placement
  lastPlacementTestDate: timestamp("last_placement_test_date"),
  currentEloScore: integer("current_elo_score").notNull().default(600),

  // Gamification
  currentXP: integer("current_xp").notNull().default(0),
  streakCount: integer("streak_count").notNull().default(0),
  lastPracticeDate: timestamp("last_practice_date"),

  // Notifications
  pushNotificationsEnabled: boolean("push_notifications_enabled").notNull().default(true),
  appNotificationsEnabled: boolean("app_notifications_enabled").notNull().default(true),
  notificationPrefs: jsonb("notification_prefs").notNull().default({
    streak: true,
    roadmap: true,
    classes: true,
    marketing: false,
  }),

  // Payment
  teacherHourlyRate: integer("teacher_hourly_rate").notNull().default(4200),
});

// Schemas
export const selectUserSchema = createSelectSchema(usersTable);
export const insertUserSchema = createInsertSchema(usersTable);

// Auth Form Schemas
export const signInSchema = z.object({
  email: z.email("Validation.emailInvalid"),
  password: z.string().min(8, "Validation.passwordMin"),
  rememberMe: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Validation.emailInvalid"),
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
  email: z.email("Validation.emailInvalid"),
  locale: z.enum(locales).optional().default("pt"),
});

export const notificationPrefsSchema = z.object({
  streak: z.boolean().default(true),
  roadmap: z.boolean().default(true),
  classes: z.boolean().default(true),
  marketing: z.boolean().default(false),
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
  cellphone: z.string().optional(),
  assignedPlanId: z.uuid().optional().nullable(),
});

// Onboarding Step Schemas
export const onboardingWelcomeSchema = z.object({
  name: z.string().min(2, "Onboarding.validation.nameRequired"),
  nickname: z.string().optional(),
  birthDate: z.string().min(1, "Onboarding.validation.birthDateRequired"),
});

export const onboardingGuardianSchema = z.object({
  guardianName: z.string().min(2, "Onboarding.validation.guardianNameRequired"),
  guardianTaxId: z.string().min(1, "Onboarding.validation.guardianTaxIdRequired"),
  guardianRelationship: z.string().min(1, "Onboarding.validation.guardianRelationshipRequired"),
});

export const onboardingAddressSchema = z.object({
  nationality: z.string().min(1, "Onboarding.validation.nationalityRequired"),
  taxId: z.string().min(1, "Onboarding.validation.taxIdRequired"),
  cellphone: z.string().min(1, "Onboarding.validation.cellphoneRequired"),
  address: z.object({
    zipCode: z.string().min(1, "Onboarding.validation.zipCodeRequired"),
    street: z.string().min(1, "Onboarding.validation.streetRequired"),
    number: z.string().min(1, "Onboarding.validation.numberRequired"),
    neighborhood: z.string().min(1, "Onboarding.validation.neighborhoodRequired"),
    city: z.string().min(1, "Onboarding.validation.cityRequired"),
    state: z.string().min(1, "Onboarding.validation.stateRequired"),
  }),
  guardianData: z.object({
    name: z.string().min(2),
    taxId: z.string().min(1),
    relationship: z.string().min(1),
  }).optional(),
});

export const onboardingPaymentSchema = z.object({
  dueDay: z.number().int().min(1).max(31),
});

// Teacher Onboarding Schemas
export const teacherOnboardingWelcomeSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  cellphone: z.string().min(1, "Celular de trabalho é obrigatório"),
});

export const teacherOnboardingDocumentsSchema = z.object({
  taxId: z.string().min(1, "CPF é obrigatório"),
  businessTaxId: z.string().min(1, "CNPJ é obrigatório"),
});

export const teacherOnboardingPaymentSchema = z.object({
  pixKey: z.string().min(1, "Chave PIX é obrigatória"),
  pixType: z.string().min(1, "Tipo de chave é obrigatório"),
});

export const teacherOnboardingAvailabilitySchema = z.object({
  normalSlots: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    startDate: z.date(),
  })),
  makeupSlots: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    startDate: z.date(),
  })),
});

export type CreateUserValues = z.input<typeof createUserSchema>;
export const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(roleEnum.enumValues).optional(),
  isActive: z.boolean().optional(),
  teacherHourlyRate: z.number().int().optional(),
  languages: z.array(z.string()).optional(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type SignInValues = z.input<typeof signInSchema>;
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;
export type TwoFactorValues = z.input<typeof twoFactorSchema>;
export type RequestNewInviteValues = z.input<typeof requestNewInviteSchema>;

export type OnboardingWelcomeValues = z.input<typeof onboardingWelcomeSchema>;
export type OnboardingGuardianValues = z.input<typeof onboardingGuardianSchema>;
export type OnboardingAddressValues = z.input<typeof onboardingAddressSchema>;
export type OnboardingPaymentValues = z.input<typeof onboardingPaymentSchema>;

export type TeacherOnboardingWelcomeValues = z.input<typeof teacherOnboardingWelcomeSchema>;
export type TeacherOnboardingDocumentsValues = z.input<typeof teacherOnboardingDocumentsSchema>;
export type TeacherOnboardingPaymentValues = z.input<typeof teacherOnboardingPaymentSchema>;
export type TeacherOnboardingAvailabilityValues = z.input<typeof teacherOnboardingAvailabilitySchema>;

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

// Rate Limiting Table 
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


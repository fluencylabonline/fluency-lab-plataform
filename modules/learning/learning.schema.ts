import {
  pgTable, uuid, varchar, text, timestamp, integer, doublePrecision, pgEnum, jsonb, vector, boolean, uniqueIndex
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { usersTable } from "@/modules/user/user.schema";
import { languages, learningItems, lessons } from "@/modules/curriculum/curriculum.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ================= ENUMS =================

export const itemStatusEnum = pgEnum("student_item_status", [
  "LOCKED",
  "ACTIVE",
  "RECEPTIVE",
  "MASTERED"
]);

export const planStatusEnum = pgEnum("plan_status", [
  "draft",
  "approved",
  "active",
  "completed",
  "paused"
]);

export const profileStatusEnum = pgEnum("profile_status", [
  "draft",
  "active",
  "archived"
]);

export const xpTransactionTypeEnum = pgEnum("xp_transaction_type", [
  "practice_completion",
  "streak_bonus",
  "replay_purchase",
  "adjustment"
]);

// ================= TABLES =================

// 1. Student Profiles (Adaptive Learning specific data)
export const studentProfiles = pgTable("learning_student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: varchar("student_id", { length: 255 }).references(() => usersTable.id, { onDelete: "cascade" }),

  // Survey Data (The 10 steps)
  responses: jsonb("responses").notNull().default({}),
  
  // Vector profile for RAG matching
  profileVector: vector("profile_vector", { dimensions: 3072 }),

  // IA qualitative notes
  qualitativeNotes: text("qualitative_notes"),

  status: profileStatusEnum("status").default("draft").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [{
  uniqueStudentId: uniqueIndex("idx_student_profiles_student_id").on(t.studentId).where(sql`student_id IS NOT NULL`)
}]);

// 1.1 Student Profile History (Audit Trail)
export const studentProfileHistory = pgTable("learning_student_profile_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => studentProfiles.id, { onDelete: "cascade" }).notNull(),
  studentId: varchar("student_id", { length: 255 }),
  responses: jsonb("responses").notNull(),
  qualitativeNotes: text("qualitative_notes"),
  status: varchar("status", { length: 50 }),
  changedBy: varchar("changed_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Student Item Progress (SRS Motor SM-2)
export const studentItemProgress = pgTable("learning_student_item_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  itemId: varchar("item_id", { length: 255 }).references(() => learningItems.id).notNull(),

  status: itemStatusEnum("status").default("LOCKED").notNull(),

  // Adaptive Learning Metrics
  contextsPassed: integer("contexts_passed").default(0).notNull(), // Rule of 3 Contexts
  passedContextsIds: jsonb("passed_contexts_ids").$type<string[]>().default([]).notNull(), // Lesson IDs where item was passed
  structureChunksPassed: jsonb("structure_chunks_passed").$type<string[]>().default([]).notNull(), // IDs of chunks mastered

  // SM-2 Engine Fields
  interval: integer("interval").default(0).notNull(), // Days until next review
  easeFactor: doublePrecision("ease_factor").default(2.5).notNull(),
  consecutiveCorrect: integer("consecutive_correct").default(0).notNull(),
  nextReviewDate: timestamp("next_review_date").defaultNow().notNull(),

  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Learning Plans
export const learningPlans = pgTable("learning_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id").references(() => usersTable.id, { onDelete: "cascade" }), // Nullable for templates

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  languageId: uuid("language_id").notNull(), // Linked to curriculum_languages

  status: planStatusEnum("status").default("draft").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Plan Lessons (Sequence)
export const planLessons = pgTable("learning_plan_lessons", {
  planId: uuid("plan_id").references(() => learningPlans.id, { onDelete: "cascade" }).notNull(),
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completedPracticeDays: integer("completed_practice_days").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
}, (t) => [{
  pk: [t.planId, t.lessonId]
}]);

// 5. Practice Sessions (Persistence for resuming)
export const learningPracticeSessions = pgTable("learning_practice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: varchar("student_id", { length: 255 }).references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => learningPlans.id, { onDelete: "cascade" }).notNull(),
  
  state: jsonb("state").notNull(), // Practice session state (items, results, current index)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. XP Transactions (Ledger)
export const learningXpTransactions = pgTable("learning_xp_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: varchar("student_id", { length: 255 }).references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  
  amount: integer("amount").notNull(), // Positive or negative
  type: xpTransactionTypeEnum("type").notNull(),
  description: text("description"),
  
  metadata: jsonb("metadata").default({}), // Link to planId, lessonId, dayIndex
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Engagement Logs (Analytics)
export const learningEngagementLogs = pgTable("learning_engagement_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: varchar("student_id", { length: 255 }).references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  
  eventType: varchar("event_type", { length: 50 }).notNull(), // e.g. 'notification_click'
  metadata: jsonb("metadata").default({}), // notificationId, targetUrl, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// boolean import removed from here and moved to top

// ================= RELATIONS =================

export const studentProfilesRelations = relations(studentProfiles, ({ one, many }) => ({
  student: one(usersTable, {
    fields: [studentProfiles.studentId],
    references: [usersTable.id],
  }),
  history: many(studentProfileHistory),
}));

export const studentProfileHistoryRelations = relations(studentProfileHistory, ({ one }) => ({
  profile: one(studentProfiles, {
    fields: [studentProfileHistory.profileId],
    references: [studentProfiles.id],
  }),
}));

export const studentItemProgressRelations = relations(studentItemProgress, ({ one }) => ({
  user: one(usersTable, {
    fields: [studentItemProgress.studentId],
    references: [usersTable.id],
  }),
  item: one(learningItems, {
    fields: [studentItemProgress.itemId],
    references: [learningItems.id],
  }),
}));

export const learningPlansRelations = relations(learningPlans, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [learningPlans.studentId],
    references: [usersTable.id],
  }),
  language: one(languages, {
    fields: [learningPlans.languageId],
    references: [languages.id],
  }),
  lessons: many(planLessons),
}));

export const planLessonsRelations = relations(planLessons, ({ one }) => ({
  plan: one(learningPlans, {
    fields: [planLessons.planId],
    references: [learningPlans.id],
  }),
  lesson: one(lessons, {
    fields: [planLessons.lessonId],
    references: [lessons.id],
  }),
}));

export const learningPracticeSessionsRelations = relations(learningPracticeSessions, ({ one }) => ({
  student: one(usersTable, {
    fields: [learningPracticeSessions.studentId],
    references: [usersTable.id],
  }),
  plan: one(learningPlans, {
    fields: [learningPracticeSessions.planId],
    references: [learningPlans.id],
  }),
}));

export const learningXpTransactionsRelations = relations(learningXpTransactions, ({ one }) => ({
  student: one(usersTable, {
    fields: [learningXpTransactions.studentId],
    references: [usersTable.id],
  }),
}));

export const learningEngagementLogsRelations = relations(learningEngagementLogs, ({ one }) => ({
  student: one(usersTable, {
    fields: [learningEngagementLogs.studentId],
    references: [usersTable.id],
  }),
}));

// ================= ZOD SCHEMAS (Drizzle-Zod) =================

export const insertStudentProfileSchema = createInsertSchema(studentProfiles);
export const selectStudentProfileSchema = createSelectSchema(studentProfiles);

export const insertStudentItemProgressSchema = createInsertSchema(studentItemProgress);
export const selectStudentItemProgressSchema = createSelectSchema(studentItemProgress);

export const insertLearningPlanSchema = createInsertSchema(learningPlans);
export const selectLearningPlanSchema = createSelectSchema(learningPlans);

// ================= SURVEY STEP SCHEMAS (Custom Zod) =================

export const step1Schema = z.object({
  fullName: z.string().min(3, "Nome muito curto"),
  birthDate: z.string().or(z.date()),
  isMinor: z.boolean().default(false),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
  occupation: z.string().min(2, "Informe sua profissão ou série escolar"),
});

export const step2Schema = z.object({
  languageOfInterest: z.string().uuid("Selecione um idioma").optional(),
  previousStudy: z.boolean(),
  studyDuration: z.enum(["less_than_6m", "6m_to_2y", "more_than_2y"]).optional(),
  selfAssessedLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export const step3Schema = z.object({
  mainGoals: z.array(z.string()).min(1, "Selecione pelo menos um objetivo"),
  targetDeadline: z.string().optional(),
  deadlineReason: z.string().optional(),
  specificMotivation: z.string().optional(),
  commitmentLevel: z.number().min(1).max(10),
});

export const step4Schema = z.object({
  weeklyFrequency: z.number().min(1).max(7),
  preferredTimes: z.string().optional(),
  dailyStudyTime: z.enum(["none", "5_30min", "30_60min", "1h_plus"]),
});

export const step5Schema = z.object({
  employmentStatus: z.string().optional(),
  professionalArea: z.string().optional(),
  professionalUse: z.array(z.string()).optional(),
  usageType: z.enum(["writing", "speaking", "balanced"]),
  technicalVocabNeeded: z.boolean().default(false).optional(),
  currentUsageFrequency: z.string().optional(),
});

export const step6Schema = z.object({
  hobbies: z.array(z.string()).optional(),
  mediaConsumptionFrequency: z.string().optional(),
  contentTypes: z.array(z.string()).optional(),
  conversationTopics: z.string().optional(),
});

export const step7Schema = z.object({
  preferredMethods: z.array(z.string()).max(3, "Selecione no máximo 3 métodos"),
  activityPreferences: z.record(z.string(), z.number().min(1).max(5)).optional(),
});

export const step8Schema = z.object({
  mainDifficulties: z.array(z.string()).min(1, "Selecione pelo menos uma dificuldade"),
  whatWorked: z.string().optional(),
  whatDidntWork: z.string().optional(),
  specialNeeds: z.string().optional(),
  speakingAnxiety: z.enum(["none", "low", "medium", "high", "very_high"]),
});

export const step9Schema = z.object({
  languageVariant: z.string().optional(),
  accentGoal: z.enum(["intelligible", "natural"]).optional(),
  classExpectations: z.array(z.string()).max(3, "Selecione no máximo 3 expectativas"),
  learningPace: z.enum(["intense", "moderate", "relaxed", "flexible"]),
  correctionStyle: z.enum(["immediate", "important_only", "end_of_lesson", "gentle"]).optional(),
});

export const step10Schema = z.object({
  otherLanguages: z.string().optional(),
  generalObservations: z.string().optional(),
  restrictions: z.string().optional(),
  questions: z.string().optional(),
});

export const studentProfileSurveySchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
  step5: step5Schema,
  step6: step6Schema,
  step7: step7Schema,
  step8: step8Schema,
  step9: step9Schema,
  step10: step10Schema,
});

export type StudentProfileSurveyData = z.infer<typeof studentProfileSurveySchema>;
export type StudentProfileSurveyInput = z.input<typeof studentProfileSurveySchema>;

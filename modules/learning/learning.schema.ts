import {
  pgTable, uuid, varchar, text, timestamp, integer, doublePrecision, pgEnum, jsonb, vector, boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "@/modules/user/user.schema";
import { languages, learningItems, lessons } from "@/modules/curriculum/curriculum.schema";

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

// ================= TABLES =================

// 1. Student Profiles (Adaptive Learning specific data)
export const studentProfiles = pgTable("learning_student_profiles", {
  studentId: varchar("student_id", { length: 255 }).primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),

  // Vector profile for RAG matching
  profileVector: vector("profile_vector", { dimensions: 3072 }),

  // IA qualitative notes
  qualitativeNotes: text("qualitative_notes"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
}, (t) => [{
  pk: [t.planId, t.lessonId]
}]);

// boolean import removed from here and moved to top

// ================= RELATIONS =================

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(usersTable, {
    fields: [studentProfiles.studentId],
    references: [usersTable.id],
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

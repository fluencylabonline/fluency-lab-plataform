import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "../user/user.schema";
import type { JSONContent } from "@tiptap/core";

// ================= TYPES =================

export type LessonContentBlock = 
  | { type: "text"; content: JSONContent } 
  | { type: "video"; url: string; provider: "youtube" | "drive" | "storage" };

export interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple-choice" | "true-false";
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface CourseProgress {
  lessons: Record<string, number>; // lessonId -> percentage (0-100)
}

// ================= TABLES =================

export const coursesTable = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  language: text("language").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  duration: text("duration").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  role: text("role").default("student").notNull(), // access level required
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseSectionsTable = pgTable("course_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => coursesTable.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseLessonsTable = pgTable("course_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id").references(() => courseSectionsTable.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  duration: text("duration"),
  contentType: text("content_type").$type<"video" | "text" | "quiz">().notNull().default("text"),
  contentBlocks: jsonb("content_blocks").$type<LessonContentBlock[]>().default([]).notNull(),
  quizId: uuid("quiz_id"), // Optional link to a quiz
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseQuizzesTable = pgTable("course_quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => coursesTable.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").$type<QuizQuestion[]>().default([]).notNull(),
  passingScore: integer("passing_score").default(70).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseQuizSubmissionsTable = pgTable("course_quiz_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => courseQuizzesTable.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(), // questionId -> selectedOption
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseEnrollmentsTable = pgTable("course_enrollments", {
  userId: text("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  courseId: uuid("course_id").references(() => coursesTable.id, { onDelete: "cascade" }).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completed: boolean("completed").default(false).notNull(),
  progress: jsonb("progress").$type<CourseProgress>().default({ lessons: {} }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.courseId] })
]);

// ================= RELATIONS =================

export const coursesRelations = relations(coursesTable, ({ many }) => ({
  sections: many(courseSectionsTable),
  enrollments: many(courseEnrollmentsTable),
}));

export const courseSectionsRelations = relations(courseSectionsTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [courseSectionsTable.courseId],
    references: [coursesTable.id],
  }),
  lessons: many(courseLessonsTable),
}));

export const courseLessonsRelations = relations(courseLessonsTable, ({ one }) => ({
  section: one(courseSectionsTable, {
    fields: [courseLessonsTable.sectionId],
    references: [courseSectionsTable.id],
  }),
  quiz: one(courseQuizzesTable, {
    fields: [courseLessonsTable.quizId],
    references: [courseQuizzesTable.id],
  }),
}));

export const courseQuizzesRelations = relations(courseQuizzesTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [courseQuizzesTable.courseId],
    references: [coursesTable.id],
  }),
  submissions: many(courseQuizSubmissionsTable),
}));

export const courseQuizSubmissionsRelations = relations(courseQuizSubmissionsTable, ({ one }) => ({
  quiz: one(courseQuizzesTable, {
    fields: [courseQuizSubmissionsTable.quizId],
    references: [courseQuizzesTable.id],
  }),
  user: one(usersTable, {
    fields: [courseQuizSubmissionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollmentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [courseEnrollmentsTable.userId],
    references: [usersTable.id],
  }),
  course: one(coursesTable, {
    fields: [courseEnrollmentsTable.courseId],
    references: [coursesTable.id],
  }),
}));

// ================= ZOD SCHEMAS =================

export const insertCourseSchema = createInsertSchema(coursesTable, {
  title: (s) => s.min(3, "O título deve ter pelo menos 3 caracteres"),
  description: (s) => s.min(10, "A descrição deve ter pelo menos 10 caracteres"),
  duration: (s) => s.regex(/^\d+h?$/, "A duração deve ser um número ou seguir o formato '10h'"),
  language: (s) => s.min(2, "Selecione um idioma"),
  imageUrl: (s) => s.url("URL da imagem inválida"),
});

export const selectCourseSchema = createSelectSchema(coursesTable);

export const insertSectionSchema = createInsertSchema(courseSectionsTable);
export const insertLessonSchema = createInsertSchema(courseLessonsTable, {
  contentType: z.enum(["video", "text", "quiz"]),
});
export const insertQuizSchema = createInsertSchema(courseQuizzesTable);
export const insertQuizSubmissionSchema = createInsertSchema(courseQuizSubmissionsTable);
export const insertEnrollmentSchema = createInsertSchema(courseEnrollmentsTable);

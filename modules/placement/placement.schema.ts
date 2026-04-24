import { pgTable, text, timestamp, boolean, pgEnum, integer, serial, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "../user/user.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { languages, learningItems, media } from "../curriculum/curriculum.schema";

export const skillTypeEnum = pgEnum("skill_type", ['grammar', 'vocabulary', 'reading', 'listening']);
export const testStatusEnum = pgEnum("test_status", ['in_progress', 'completed', 'abandoned']);
export const questionStatusEnum = pgEnum("question_status", ['draft', 'active', 'archived']);
export const questionTypeEnum = pgEnum("placement_question_type", ['multiple_choice', 'unscramble', 'audio_comprehension', 'grammar', 'context', 'writing']);

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  context: text("context"), 
  options: jsonb("options").$type<{ text: string, id: string }[]>().notNull(),
  correctOptionId: text("correct_option_id").notNull(),
  skill: skillTypeEnum("skill").notNull(),
  type: questionTypeEnum("type").default("multiple_choice").notNull(),
  difficultyLevel: integer("difficulty_level").notNull(), 
  cefrLevel: text("cefr_level").notNull(), // A1, A2, B1, B2, C1, C2
  languageId: uuid("language_id").references(() => languages.id).notNull(),
  status: questionStatusEnum("status").default("draft").notNull(),
  audioScript: text("audio_script"), // For browser TTS
  learningItemId: varchar("learning_item_id", { length: 255 }).references(() => learningItems.id),
  sourceMediaId: uuid("source_media_id").references(() => media.id),
  metadata: jsonb("metadata").$type<{
    audioRange?: { start: number, end: number };
    mediaUrl?: string;
    unscrambleData?: { words: string[], correctOrder: number[] };
    gapFillData?: { sentenceWithGap: string, correctAnswer: string };
    subType?: string;
    aiGenerated?: boolean;
    audioScript?: string;
  }>(),
  timesAnswered: integer("times_answered").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const placementTestsTable = pgTable("placement_tests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  languageId: uuid("language_id").references(() => languages.id).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  initialEloScore: integer("initial_elo_score").notNull(),
  finalEloScore: integer("final_elo_score"),
  status: testStatusEnum("status").default("in_progress"),
});

export const testAnswersTable = pgTable("test_answers", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => placementTestsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questionsTable.id),
  selectedOptionId: text("selected_option_id"),
  isCorrect: boolean("is_correct").notNull(),
  eloScoreAfterAnswer: integer("elo_score_after_answer").notNull(),
  answeredAt: timestamp("answered_at").defaultNow(),
});

// Zod Schemas
export const selectQuestionSchema = createSelectSchema(questionsTable);
export const insertQuestionSchema = createInsertSchema(questionsTable);
export const selectPlacementTestSchema = createSelectSchema(placementTestsTable);
export const selectTestAnswerSchema = createSelectSchema(testAnswersTable);

// Validation Schemas
export const submitAnswerSchema = z.object({
  testId: z.number(),
  questionId: z.number(),
  selectedOptionId: z.string(),
});

export type Question = typeof questionsTable.$inferSelect;
export type PlacementTest = typeof placementTestsTable.$inferSelect;
export type TestAnswer = typeof testAnswersTable.$inferSelect;

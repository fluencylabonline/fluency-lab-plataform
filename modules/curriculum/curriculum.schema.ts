import {
  pgTable, uuid, varchar, text, timestamp, integer, pgEnum, jsonb, vector,
  boolean, uniqueIndex, primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "../user/user.schema";
import type {
  Segment,
  MediaConfig,
  LearningItemMetadata,
  AnalysisResult,
  QualityResult,
  QuizData
} from "./curriculum.types";
import type { JSONContent } from "@tiptap/core";

// ================= ENUMS =================

export const cefrLevelEnum = pgEnum("cefr_level", ["A1", "A2", "B1", "B2", "C1", "C2"]);

export const itemTypeEnum = pgEnum("learning_item_type", ["VOCABULARY", "STRUCTURE"]);

export const mediaStatusEnum = pgEnum("media_status", ["pending_review", "approved"]);

export const lessonStatusEnum = pgEnum("lesson_status", [
  "draft",
  "transcribing",
  "analyzing",
  "processing_items",
  "reviewing",
  "reviewing_quiz",
  "ready",
  "error"
]);

export const priorityEnum = pgEnum("item_priority", ["CORE", "SECONDARY"]);

// ================= TABLES =================

// 1. Languages
export const languages = pgTable("curriculum_languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 10 }).notNull().unique(), // ISO code (EN, PT, etc)
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Media (Transcription & Timestamps)
export const media = pgTable("curriculum_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: varchar("url", { length: 512 }).notNull(),
  transcriptionText: text("transcription_text"),
  transcriptionTimestamps: jsonb("transcription_timestamps").$type<Segment[]>(),
  config: jsonb("config").$type<MediaConfig | null>(),
  status: mediaStatusEnum("status").default("pending_review").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Learning Items (Vocab & Structure)
export const learningItems = pgTable("curriculum_learning_items", {
  id: varchar("id", { length: 255 }).primaryKey(), // Pattern: {code}_{lemma}_{type}
  languageId: uuid("language_id").references(() => languages.id).notNull(),
  type: itemTypeEnum("type").notNull(),
  lemma: text("lemma").notNull(),
  translation: text("translation"),

  // Vocab: { definition, phonetic, level, key_image_words, is_visual, meanings, forms }
  // Structure: { LearningStructureType, name }
  metadata: jsonb("metadata").$type<LearningItemMetadata>().notNull(),

  // Array of chunks for structures: [{ phrase, vocab_ids, order, grammatical_roles }]
  structureChunks: jsonb("structure_chunks").$type<Array<{
    phrase: string;
    vocab_ids: string[];
    order: number[];
    grammatical_roles: string[];
  }>>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Lessons
export const lessons = pgTable("curriculum_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  languageId: uuid("language_id").references(() => languages.id).notNull(),
  nativeLanguageId: uuid("native_language_id").references(() => languages.id).notNull(),
  mediaId: uuid("media_id").references(() => media.id),
  title: varchar("title", { length: 255 }).notNull(),
  difficulty: cefrLevelEnum("difficulty").notNull(),
  contentText: text("content_text"),
  contentJson: jsonb("content_json").$type<JSONContent | null>(), // Tiptap content or rich structure
  analysisResultJson: jsonb("analysis_result_json").$type<AnalysisResult | null>(), // Merged vocab/structures (transcription + lesson)
  qualityAnalysisJson: jsonb("quality_analysis_json").$type<QualityResult | null>(), // Pedagogical audit (score, sections)

  // Embedding for RAG
  embedding: vector("embedding", { dimensions: 3072 }),
  quizData: jsonb("quiz_data").$type<QuizData | null>(),
  status: lessonStatusEnum("status").default("draft").notNull(),
  creationStep: integer("creation_step").default(1).notNull(), // Steps 1 to 9
  errorMessage: text("error_message"),

  // Versioning and Caching
  contentHash: varchar("content_hash", { length: 64 }),
  version: integer("version").default(1).notNull(),
  deletedAt: timestamp("deleted_at"),

  // Recess specific
  isRecessActivity: boolean("is_recess_activity").default(false).notNull(),
  teacherId: varchar("teacher_id", { length: 128 }), // Optional: private activity

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Lesson - Learning Items Junction (M:N)
export const lessonLearningItems = pgTable("curriculum_lesson_learning_items", {
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  itemId: varchar("item_id", { length: 255 }).references(() => learningItems.id, { onDelete: "cascade" }).notNull(),
  priority: priorityEnum("priority").default("CORE").notNull(),
}, (t) => [
  primaryKey({ columns: [t.lessonId, t.itemId] })
]);

// 6. Rate Limiting
export const rateLimits = pgTable("curriculum_rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceName: varchar("service_name", { length: 50 }).notNull(), // e.g., "gemini", "unsplash"
  identifier: varchar("identifier", { length: 255 }).notNull(), // e.g., userId or "global"
  windowStart: timestamp("window_start").defaultNow().notNull(),
  count: integer("count").default(0).notNull(),
}, (t) => [
  uniqueIndex("idx_rate_limit_service_identifier").on(t.serviceName, t.identifier)
]);

// 7. AI Cache
export const aiCache = pgTable("ai_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  hash: varchar("hash", { length: 64 }).notNull().unique(), // SHA-256 of the prompt/input
  serviceName: varchar("service_name", { length: 50 }).notNull(), // e.g., "embedding", "enrich", "placement"
  response: jsonb("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// ================= RELATIONS =================

export const languagesRelations = relations(languages, ({ many }) => ({
  learningItems: many(learningItems),
  targetLessons: many(lessons, { relationName: "targetLanguage" }),
  nativeLessons: many(lessons, { relationName: "nativeLanguage" }),
}));

export const mediaRelations = relations(media, ({ many }) => ({
  lessons: many(lessons),
}));

export const learningItemsRelations = relations(learningItems, ({ one, many }) => ({
  language: one(languages, {
    fields: [learningItems.languageId],
    references: [languages.id],
  }),
  lessons: many(lessonLearningItems),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  media: one(media, {
    fields: [lessons.mediaId],
    references: [media.id],
  }),
  language: one(languages, {
    fields: [lessons.languageId],
    references: [languages.id],
    relationName: "targetLanguage",
  }),
  nativeLanguage: one(languages, {
    fields: [lessons.nativeLanguageId],
    references: [languages.id],
    relationName: "nativeLanguage",
  }),
  items: many(lessonLearningItems),
}));

export const lessonLearningItemsRelations = relations(lessonLearningItems, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonLearningItems.lessonId],
    references: [lessons.id],
  }),
  item: one(learningItems, {
    fields: [lessonLearningItems.itemId],
    references: [learningItems.id],
  }),
}));

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  user: one(usersTable, {
    fields: [rateLimits.identifier],
    references: [usersTable.id],
  }),
}));

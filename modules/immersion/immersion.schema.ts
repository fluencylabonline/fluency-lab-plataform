import { pgTable, uuid, varchar, timestamp, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "@/modules/user/user.schema";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ================= TABLES =================

/**
 * Persists active game progress for cross-device sync.
 * Primary source for offline play remains localStorage.
 */
export const immersionProgress = pgTable("immersion_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  gameId: varchar("game_id", { length: 50 }).notNull(), // 'wordle', 'word-ladder'
  lang: varchar("lang", { length: 10 }).notNull(),
  
  state: jsonb("state").notNull(), // { guesses, target, finished, current }
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [{
  uniqueProgress: uniqueIndex("idx_immersion_progress_user_game").on(t.userId, t.gameId)
}]);

/**
 * Stores completed game results.
 */
export const immersionHistory = pgTable("immersion_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  gameId: varchar("game_id", { length: 50 }).notNull(),
  
  lang: varchar("lang", { length: 10 }).notNull(),
  word: varchar("word", { length: 255 }).notNull(),
  success: boolean("success").notNull(),
  attempts: integer("attempts").notNull(),
  metadata: jsonb("metadata").default({}), // Extra info like duration, etc.
  
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

// ================= RELATIONS =================

export const immersionProgressRelations = relations(immersionProgress, ({ one }) => ({
  user: one(usersTable, {
    fields: [immersionProgress.userId],
    references: [usersTable.id],
  }),
}));

export const immersionHistoryRelations = relations(immersionHistory, ({ one }) => ({
  user: one(usersTable, {
    fields: [immersionHistory.userId],
    references: [usersTable.id],
  }),
}));

// ================= ZOD SCHEMAS =================

export const insertImmersionProgressSchema = createInsertSchema(immersionProgress);
export const selectImmersionProgressSchema = createSelectSchema(immersionProgress);

export const insertImmersionHistorySchema = createInsertSchema(immersionHistory);
export const selectImmersionHistorySchema = createSelectSchema(immersionHistory);

// Action-specific schemas
export const saveImmersionProgressSchema = z.object({
  gameId: z.enum(["wordle", "word-ladder", "lyrics-training"]),
  lang: z.string().min(2),
  state: z.any(),
});

export const recordImmersionResultSchema = z.object({
  gameId: z.enum(["wordle", "word-ladder", "lyrics-training"]),
  entry: z.object({
    word: z.string(),
    ts: z.number(),
    success: z.boolean(),
    attempts: z.number(),
    lang: z.string(),
    length: z.number(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "../user/user.schema";
import { notebooksTable } from "../notebook/notebook.schema";
import { z } from "zod";

// ================= ENUMS =================
export const transcriptionStatusEnum = pgEnum("transcription_status", [
  "pending",
  "available",
  "failed",
]);

// ================= TABELAS =================

/**
 * Stores historical data for every video call session.
 */
export const callSessionsTable = pgTable("call_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  streamCallId: varchar("stream_call_id", { length: 255 }).notNull().unique(),
  studentId: varchar("student_id", { length: 128 })
    .notNull()
    .references(() => usersTable.id),
  teacherId: varchar("teacher_id", { length: 128 })
    .notNull()
    .references(() => usersTable.id),
  notebookId: uuid("notebook_id").references(() => notebooksTable.id),

  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),

  transcription: text("transcription"),
  transcriptionStatus: transcriptionStatusEnum("transcription_status")
    .default("pending")
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ================= SCHEMAS =================

/**
 * Schema for initiating a video call between teacher and student.
 * The teacher calls this from the notebook page.
 */
export const startCallSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  notebookId: z.string().uuid("Invalid notebook ID"),
});

/**
 * Schema for ending a call (teacher's action — terminates for all).
 */
export const endCallSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  callId: z.string().min(1, "Call ID is required"),
  notebookId: z.string().uuid().optional(),
});

/**
 * Schema for generating a Stream user token (student join flow).
 */
export const generateStreamTokenSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Schema for student leaving a call (without ending it for the teacher).
 */
export const leaveCallSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

/**
 * Schema for manually syncing call transcriptions.
 */
export const syncCallTranscriptionSchema = z.object({
  streamCallId: z.string().min(1, "Stream Call ID is required"),
});

// --- Types ---
export type StartCallValues = z.input<typeof startCallSchema>;
export type EndCallValues = z.input<typeof endCallSchema>;
export type GenerateStreamTokenValues = z.input<typeof generateStreamTokenSchema>;
export type LeaveCallValues = z.input<typeof leaveCallSchema>;
export type SyncCallTranscriptionValues = z.input<typeof syncCallTranscriptionSchema>;

export type CallSession = typeof callSessionsTable.$inferSelect;
export type NewCallSession = typeof callSessionsTable.$inferInsert;

import { pgTable, uuid, varchar, timestamp, pgEnum, index, jsonb, text } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "../user/user.schema";
import { transcriptionStatusEnum } from "../call/call.schema";
import { studentProfiles } from "../learning/learning.schema";

// ================= ENUMS =================
export const trialRoomStatusEnum = pgEnum("trial_room_status", ["active", "ended"]);
export const trialRequestStatusEnum = pgEnum("trial_request_status", ["pending", "approved", "denied"]);

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type TrialNotes = {
  goals: string[];
  level: (typeof CEFR_LEVELS)[number] | null;
  strengths: string[];
  improve: string[];
  freeText: string;
};

// ================= TABELAS =================

/** Sala de aula experimental: criada pelo admin, acessada por um código curto no link. */
export const trialRoomsTable = pgTable("trial_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  hostId: varchar("host_id", { length: 128 })
    .notNull()
    .references(() => usersTable.id),
  streamCallId: varchar("stream_call_id", { length: 255 }).notNull().unique(),
  status: trialRoomStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),

  /** Anotações do professor durante a chamada (nunca expostas ao visitante). */
  notes: jsonb("notes").$type<TrialNotes>(),
  transcription: text("transcription"),
  transcriptionStatus: transcriptionStatusEnum("transcription_status").default("pending").notNull(),
  /** Perfil do aluno (rascunho) gerado a partir da transcrição + anotações. */
  profileId: uuid("profile_id").references(() => studentProfiles.id, { onDelete: "set null" }),
  analyzedAt: timestamp("analyzed_at"),
});

/** Pedido de entrada de um visitante (sem conta). O token da Stream só sai depois de `approved`. */
export const trialJoinRequestsTable = pgTable(
  "trial_join_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => trialRoomsTable.id, { onDelete: "cascade" }),
    guestId: varchar("guest_id", { length: 64 }).notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    status: trialRequestStatusEnum("status").default("pending").notNull(),
    /** Informado pelo visitante ao fim da chamada; liga o perfil ao aluno quando a conta é criada. */
    email: varchar("email", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("trial_join_requests_room_idx").on(t.roomId, t.status),
    index("trial_join_requests_email_idx").on(sql`lower(${t.email})`),
  ]
);

export const trialRoomsRelations = relations(trialRoomsTable, ({ many, one }) => ({
  requests: many(trialJoinRequestsTable),
  profile: one(studentProfiles, { fields: [trialRoomsTable.profileId], references: [studentProfiles.id] }),
}));

export const trialJoinRequestsRelations = relations(trialJoinRequestsTable, ({ one }) => ({
  room: one(trialRoomsTable, { fields: [trialJoinRequestsTable.roomId], references: [trialRoomsTable.id] }),
}));

export type TrialRoom = typeof trialRoomsTable.$inferSelect;
export type TrialJoinRequest = typeof trialJoinRequestsTable.$inferSelect;
export type NewTrialRoom = typeof trialRoomsTable.$inferInsert;
export type NewTrialJoinRequest = typeof trialJoinRequestsTable.$inferInsert;

// ================= SCHEMAS =================

/** Código no formato abc-defg-hij. */
export const roomCodeSchema = z.string().regex(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/, "Invalid room code");

export const roomCodeInputSchema = z.object({ code: roomCodeSchema });

export const requestToJoinSchema = z.object({
  code: roomCodeSchema,
  name: z.string().trim().max(60).optional(),
});

export const requestStatusSchema = z.object({
  code: roomCodeSchema,
  requestId: z.string().uuid(),
  guestId: z.string().min(1).max(64),
});

export const decideRequestSchema = z.object({
  code: roomCodeSchema,
  requestId: z.string().uuid(),
  approve: z.boolean(),
});

const noteList = z.array(z.string().trim().min(1).max(120)).max(20);

export const trialNotesSchema = z.object({
  goals: noteList,
  level: z.enum(CEFR_LEVELS).nullable(),
  strengths: noteList,
  improve: noteList,
  freeText: z.string().max(4000),
});

export const saveNotesSchema = z.object({ code: roomCodeSchema, notes: trialNotesSchema });

export const guestEmailSchema = z.object({
  code: roomCodeSchema,
  requestId: z.string().uuid(),
  guestId: z.string().min(1).max(64),
  email: z.string().trim().toLowerCase().email().max(255),
});

export const emptyTrialNotes = (): TrialNotes => ({ goals: [], level: null, strengths: [], improve: [], freeText: "" });

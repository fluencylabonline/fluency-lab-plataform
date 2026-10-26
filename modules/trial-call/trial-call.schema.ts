import { pgTable, uuid, varchar, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "../user/user.schema";

// ================= ENUMS =================
export const trialRoomStatusEnum = pgEnum("trial_room_status", ["active", "ended"]);
export const trialRequestStatusEnum = pgEnum("trial_request_status", ["pending", "approved", "denied"]);

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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("trial_join_requests_room_idx").on(t.roomId, t.status)]
);

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

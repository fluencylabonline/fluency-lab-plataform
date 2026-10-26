import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  trialJoinRequestsTable,
  trialRoomsTable,
  type NewTrialJoinRequest,
  type NewTrialRoom,
} from "./trial-call.schema";

/**
 * trial-call.repository.ts — Pure Drizzle queries for trial rooms and join requests.
 */
export const trialCallRepository = {
  async createRoom(data: NewTrialRoom) {
    const [row] = await db.insert(trialRoomsTable).values(data).returning();
    return row;
  },

  async findRoomByCode(code: string) {
    return db.query.trialRoomsTable.findFirst({ where: eq(trialRoomsTable.code, code) });
  },

  async endRoom(id: string) {
    const [row] = await db
      .update(trialRoomsTable)
      .set({ status: "ended", endedAt: new Date() })
      .where(eq(trialRoomsTable.id, id))
      .returning();
    return row;
  },

  /** Encerra salas ativas criadas antes de `before` (limpeza de salas esquecidas). */
  async endStaleRooms(before: Date) {
    await db
      .update(trialRoomsTable)
      .set({ status: "ended", endedAt: new Date() })
      .where(and(eq(trialRoomsTable.status, "active"), lt(trialRoomsTable.createdAt, before)));
  },

  async createRequest(data: NewTrialJoinRequest) {
    const [row] = await db.insert(trialJoinRequestsTable).values(data).returning();
    return row;
  },

  async findRequest(id: string) {
    return db.query.trialJoinRequestsTable.findFirst({ where: eq(trialJoinRequestsTable.id, id) });
  },

  async listPendingRequests(roomId: string) {
    return db.query.trialJoinRequestsTable.findMany({
      where: and(eq(trialJoinRequestsTable.roomId, roomId), eq(trialJoinRequestsTable.status, "pending")),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
  },

  async setRequestStatus(id: string, status: "pending" | "approved" | "denied") {
    const [row] = await db
      .update(trialJoinRequestsTable)
      .set({ status })
      .where(eq(trialJoinRequestsTable.id, id))
      .returning();
    return row;
  },
};

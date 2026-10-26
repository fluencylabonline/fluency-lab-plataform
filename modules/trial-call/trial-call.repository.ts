import "server-only";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles } from "@/modules/learning/learning.schema";
import {
  trialJoinRequestsTable,
  trialRoomsTable,
  type NewTrialJoinRequest,
  type NewTrialRoom,
  type TrialNotes,
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

  async findRoomById(id: string) {
    return db.query.trialRoomsTable.findFirst({ where: eq(trialRoomsTable.id, id) });
  },

  async findRoomByStreamCallId(streamCallId: string) {
    return db.query.trialRoomsTable.findFirst({ where: eq(trialRoomsTable.streamCallId, streamCallId) });
  },

  async saveNotes(id: string, notes: TrialNotes) {
    await db.update(trialRoomsTable).set({ notes }).where(eq(trialRoomsTable.id, id));
  },

  async saveTranscription(id: string, data: { transcription?: string; status: "pending" | "available" | "failed" }) {
    await db
      .update(trialRoomsTable)
      .set({ transcription: data.transcription, transcriptionStatus: data.status })
      .where(eq(trialRoomsTable.id, id));
  },

  async setProfile(id: string, profileId: string) {
    await db.update(trialRoomsTable).set({ profileId, analyzedAt: new Date() }).where(eq(trialRoomsTable.id, id));
  },

  async setRequestEmail(id: string, email: string) {
    await db.update(trialJoinRequestsTable).set({ email }).where(eq(trialJoinRequestsTable.id, id));
  },

  /** Pedidos aprovados da sala (quem de fato entrou), para rotular a transcrição e a lista do admin. */
  async listApprovedRequests(roomId: string) {
    return db.query.trialJoinRequestsTable.findMany({
      where: and(eq(trialJoinRequestsTable.roomId, roomId), eq(trialJoinRequestsTable.status, "approved")),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
  },

  /** Lista de aulas experimentais do admin, mais recentes primeiro, com o perfil ligado. */
  async listRoomsWithGuests(hostId?: string) {
    return db.query.trialRoomsTable.findMany({
      where: hostId ? eq(trialRoomsTable.hostId, hostId) : undefined,
      orderBy: [desc(trialRoomsTable.createdAt)],
      limit: 200,
      with: { requests: true, profile: true },
    });
  },

  /**
   * Perfil de aula experimental ainda sem aluno cujo visitante informou este e-mail.
   * Usado ao criar o aluno para ligar o perfil automaticamente.
   */
  async findUnlinkedProfileByEmail(email: string) {
    const rows = await db
      .select({ profileId: trialRoomsTable.profileId, createdAt: trialRoomsTable.createdAt })
      .from(trialJoinRequestsTable)
      .innerJoin(trialRoomsTable, eq(trialRoomsTable.id, trialJoinRequestsTable.roomId))
      .innerJoin(studentProfiles, eq(studentProfiles.id, trialRoomsTable.profileId))
      .where(and(sql`lower(${trialJoinRequestsTable.email}) = ${email.toLowerCase()}`, isNull(studentProfiles.studentId)))
      .orderBy(desc(trialRoomsTable.createdAt))
      .limit(1);
    return rows[0]?.profileId ?? null;
  },
};

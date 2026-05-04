import { db } from "@/lib/db";
import { callSessionsTable, type CallSession, type NewCallSession } from "./call.schema";
import { eq, desc } from "drizzle-orm";

/**
 * call.repository.ts — Pure Drizzle queries for call sessions.
 */
export const callRepository = {
  /**
   * Create a new call session record.
   */
  async create(data: NewCallSession) {
    const [result] = await db.insert(callSessionsTable).values(data).returning();
    return result;
  },

  /**
   * Update an existing call session (e.g., set endedAt, duration, or transcription).
   */
  async update(streamCallId: string, data: Partial<CallSession>) {
    const [result] = await db
      .update(callSessionsTable)
      .set(data)
      .where(eq(callSessionsTable.streamCallId, streamCallId))
      .returning();
    return result;
  },

  /**
   * Find a session by its Stream call ID.
   */
  async findByStreamId(streamCallId: string) {
    return db.query.callSessionsTable.findFirst({
      where: eq(callSessionsTable.streamCallId, streamCallId),
    });
  },

  /**
   * List all calls for a specific student, ordered by most recent.
   */
  async listByStudent(studentId: string) {
    return db.query.callSessionsTable.findMany({
      where: eq(callSessionsTable.studentId, studentId),
      orderBy: [desc(callSessionsTable.startedAt)],
    });
  },
};

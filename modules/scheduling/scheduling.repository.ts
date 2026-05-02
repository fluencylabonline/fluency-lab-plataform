import { db } from "@/lib/db";
import {
  recurrenceRules,
  studentCredits,
  slotInstances,
  schedulingAuditLogs,
  recessRequestsTable
} from "./scheduling.schema";
import { eq, and, lte, gte, isNull, inArray, between, ne, isNotNull, asc } from "drizzle-orm";
import {
  NewRecurrenceRule,
  NewStudentCredit,
  NewSlotInstance,
  NewSchedulingAuditLog
} from "./scheduling.types";


export const schedulingRepository = {
  // --- Slot Instances ---
  async findById(id: string) {
    return db.query.slotInstances.findFirst({
      where: eq(slotInstances.id, id),
      with: {
        rule: true,
        credit: true,
      },
    });
  },

  async findByStudent(studentId: string) {
    return db.query.slotInstances.findMany({
      where: eq(slotInstances.studentId, studentId),
      orderBy: [slotInstances.startAt],
    });
  },

  async findByTeacher(teacherId: string) {
    return db.query.slotInstances.findMany({
      where: eq(slotInstances.teacherId, teacherId),
      orderBy: [slotInstances.startAt],
    });
  },

  async updateStatus(id: string, status: typeof slotInstances.status.enumValues[number]) {
    return db.update(slotInstances)
      .set({ status, updatedAt: new Date() })
      .where(eq(slotInstances.id, id))
      .returning();
  },

  async updateSlot(id: string, data: Partial<typeof slotInstances.$inferInsert>) {
    return db.update(slotInstances)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(slotInstances.id, id))
      .returning();
  },

  async deleteSlot(id: string) {
    return db.delete(slotInstances)
      .where(eq(slotInstances.id, id))
      .returning();
  },

  async deleteFutureSlots(ruleId: string, fromDate: Date) {
    return db.delete(slotInstances)
      .where(
        and(
          eq(slotInstances.ruleId, ruleId),
          gte(slotInstances.startAt, fromDate)
        )
      )
      .returning();
  },

  async updateFutureSlots(ruleId: string, fromDate: Date, data: Partial<typeof slotInstances.$inferInsert>) {
    return db.update(slotInstances)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(slotInstances.ruleId, ruleId),
          gte(slotInstances.startAt, fromDate)
        )
      )
      .returning();
  },

  async updateFutureAvailableSlots(ruleId: string, studentId: string, startAt: Date) {
    return db.update(slotInstances)
      .set({
        studentId,
        status: "scheduled",
        updatedAt: new Date()
      })
      .where(
        and(
          eq(slotInstances.ruleId, ruleId),
          eq(slotInstances.status, "available"),
          gte(slotInstances.startAt, startAt)
        )
      )
      .returning();
  },

  async createSlotInstance(data: NewSlotInstance) {
    return db.insert(slotInstances).values(data).returning();
  },

  // --- Recurrence Rules ---
  async findRuleById(id: string, dbClient?: typeof db) {
    const client = dbClient || db;
    return client.query.recurrenceRules.findFirst({
      where: eq(recurrenceRules.id, id),
    });
  },

  async findAllRules() {
    return db.query.recurrenceRules.findMany();
  },

  async findSlotByRuleAndDate(ruleId: string, startAt: Date, dbClient?: typeof db) {
    const client = dbClient || db;
    return client.query.slotInstances.findFirst({
      where: and(
        eq(slotInstances.ruleId, ruleId),
        eq(slotInstances.startAt, startAt)
      ),
    });
  },

  async updateRule(id: string, data: Partial<NewRecurrenceRule>) {
    return db.update(recurrenceRules)
      .set(data)
      .where(eq(recurrenceRules.id, id))
      .returning();
  },

  // --- Student Credits ---
  async findCreditById(id: string) {
    return db.query.studentCredits.findFirst({
      where: eq(studentCredits.id, id),
    });
  },

  // --- Recess ---
  async findRecessesByTeacher(teacherId: string) {
    return db.query.recessRequestsTable.findMany({
      where: eq(recessRequestsTable.teacherId, teacherId),
      orderBy: [recessRequestsTable.startDate],
    });
  },

  async findCreditsByStudent(studentId: string, onlyActive: boolean = true) {
    const filters = [eq(studentCredits.studentId, studentId)];

    if (onlyActive) {
      filters.push(isNull(studentCredits.usedAt));
      filters.push(gte(studentCredits.expiresAt, new Date()));
    }

    return db.query.studentCredits.findMany({
      where: and(...filters),
      orderBy: [studentCredits.expiresAt],
    });
  },

  async findOverlappingSlot(teacherId: string, startAt: Date, endAt: Date, excludeId?: string, dbClient?: typeof db) {
    const client = dbClient || db;
    const filters = [
      eq(slotInstances.teacherId, teacherId),
      lte(slotInstances.startAt, endAt),
      gte(slotInstances.endAt, startAt),
    ];

    if (excludeId) {
      filters.push(ne(slotInstances.id, excludeId));
    }

    return client.query.slotInstances.findFirst({
      where: and(...filters),
    });
  },

  async findOverdueClasses(thresholdTime: Date) {
    return db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.status, "scheduled"),
        lte(slotInstances.startAt, thresholdTime)
      ),
    });
  },

  async updateStatusBulk(ids: string[], status: typeof slotInstances.status.enumValues[number]) {
    if (ids.length === 0) return;
    await db.update(slotInstances)
      .set({ status, updatedAt: new Date() })
      .where(inArray(slotInstances.id, ids));
  },

  async createCredit(data: NewStudentCredit) {
    return db.insert(studentCredits).values(data).returning();
  },

  async consumeCredit(id: string, usedForClassId: string) {
    return db.update(studentCredits)
      .set({
        usedAt: new Date(),
        usedForClassId
      })
      .where(eq(studentCredits.id, id))
      .returning();
  },

  async expireCredits(now: Date) {
    // This is more logic-heavy, usually handled in service or with a specific update
    return db.update(studentCredits)
      .set({ usedAt: now }) // Or another way to mark expired
      .where(
        and(
          isNull(studentCredits.usedAt),
          lte(studentCredits.expiresAt, now)
        )
      )
      .returning();
  },

  async findClassesForReminders(type: "24h" | "1h", windowStart: Date, windowEnd: Date) {
    const reminderField = type === "24h" ? slotInstances.reminder24hSent : slotInstances.reminder1hSent;

    return db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.status, "scheduled"),
        eq(reminderField, false),
        between(slotInstances.startAt, windowStart, windowEnd)
      ),
    });
  },

  async markRemindersAsSent(ids: string[], type: "24h" | "1h") {
    if (ids.length === 0) return;
    const reminderField = type === "24h" ? "reminder24hSent" : "reminder1hSent";

    await db.update(slotInstances)
      .set({ [reminderField]: true })
      .where(inArray(slotInstances.id, ids));
  },

  async findCompletedByTeacherInRange(teacherId: string, start: Date, end: Date) {
    return db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.teacherId, teacherId),
        inArray(slotInstances.status, ["completed", "no-show", 'canceled-student']),
        between(slotInstances.startAt, start, end)
      ),
      with: {
        student: {
          columns: {
            name: true,
            assignedPlanId: true,
            isActive: true,
          }
        }
      },
      orderBy: [slotInstances.startAt],
    });
  },
  async findByTeacherInRange(teacherId: string, start: Date, end: Date) {
    return db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.teacherId, teacherId),
        between(slotInstances.startAt, start, end)
      ),
      with: {
        student: {
          columns: {
            name: true,
            assignedPlanId: true,
            isActive: true,
          }
        },
        rule: true,
      },
      orderBy: [slotInstances.startAt],
    });
  },
  async createAuditLog(data: NewSchedulingAuditLog) {
    return db.insert(schedulingAuditLogs).values(data).returning();
  },

  async findUniqueStudentsByTeacher(teacherId: string) {
    const results = await db.selectDistinct({ studentId: slotInstances.studentId })
      .from(slotInstances)
      .where(
        and(
          eq(slotInstances.teacherId, teacherId),
          isNotNull(slotInstances.studentId)
        )
      );
    
    return results.map(r => r.studentId as string);
  },

  async findNextClassForStudent(studentId: string, teacherId: string) {
    return db.query.slotInstances.findFirst({
      where: and(
        eq(slotInstances.studentId, studentId),
        eq(slotInstances.teacherId, teacherId),
        gte(slotInstances.startAt, new Date()),
        eq(slotInstances.status, "scheduled")
      ),
      orderBy: [asc(slotInstances.startAt)]
    });
  }
};


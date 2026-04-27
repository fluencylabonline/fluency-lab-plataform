import { db } from "@/lib/db";
import { payoutsTable } from "./payout.schema";
import { slotInstances } from "@/modules/scheduling/scheduling.schema";
import { eq, and, isNull, between, inArray, sum } from "drizzle-orm";

export const payoutRepository = {
  async createPayout(data: typeof payoutsTable.$inferInsert) {
    const [payout] = await db.insert(payoutsTable).values(data).returning();
    return payout;
  },

  async updatePayout(id: string, data: Partial<typeof payoutsTable.$inferInsert>) {
    const [payout] = await db.update(payoutsTable).set(data).where(eq(payoutsTable.id, id)).returning();
    return payout;
  },

  async findByExternalId(externalId: string) {
    return db.query.payoutsTable.findFirst({
      where: eq(payoutsTable.externalId, externalId),
    });
  },

  async findUnpaidClassesByTeacher(teacherId: string, start: Date, end: Date) {
    return db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.teacherId, teacherId),
        inArray(slotInstances.status, ["completed", "no-show"]),
        isNull(slotInstances.payoutId),
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

  async linkClassesToPayout(classIds: string[], payoutId: string) {
    if (classIds.length === 0) return;
    await db.update(slotInstances)
      .set({ payoutId })
      .where(inArray(slotInstances.id, classIds));
  },

  async sumPayouts(filters: { status: "completed" | "pending"; start: Date; end: Date }) {
    const [result] = await db
      .select({ total: sum(payoutsTable.amount) })
      .from(payoutsTable)
      .where(and(
        eq(payoutsTable.status, filters.status),
        between(payoutsTable.createdAt, filters.start, filters.end)
      ));
    
    return Number(result?.total || 0);
  }
};

import "server-only";
import { db } from "@/lib/db";
import { payoutsTable } from "./payout.schema";
import { slotInstances } from "@/modules/scheduling/scheduling.schema";
import { eq, and, isNull, between, inArray, sum, desc, sql, ne } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

function unpaidClassesQuery(exec: Executor, teacherId: string, start: Date, end: Date) {
  return exec.query.slotInstances.findMany({
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
}

export type UnpaidClass = Awaited<ReturnType<typeof unpaidClassesQuery>>[number];

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
    return unpaidClassesQuery(db, teacherId, start, end);
  },

  /**
   * Reserva as aulas não pagas do período para um novo repasse, de forma atômica:
   * lock consultivo por professor/mês serializa cliques/abas/admins simultâneos, o payout
   * nasce "pending" e as aulas só são vinculadas se ainda estiverem livres. Se outra execução
   * já pegou alguma aula, a transação inteira é desfeita.
   */
  async reservePayout(
    teacherId: string,
    month: number,
    year: number,
    start: Date,
    end: Date,
    build: (classes: UnpaidClass[]) => Omit<typeof payoutsTable.$inferInsert, "status">
  ) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`payout:${teacherId}:${year}:${month}`}))`);

      const classes = await unpaidClassesQuery(tx, teacherId, start, end);
      const data = build(classes);
      const classIds = classes.map((c) => c.id);

      const existing = await tx.query.payoutsTable.findFirst({
        where: eq(payoutsTable.externalId, data.externalId),
      });

      let payout: typeof payoutsTable.$inferSelect;
      if (existing) {
        if (existing.status !== "failed") {
          throw new Error(
            existing.status === "completed"
              ? "Este repasse já foi pago."
              : "Já existe um repasse em processamento para estas aulas. Confira no AbacatePay antes de tentar de novo."
          );
        }
        // Repasse recusado antes pelo provedor: reaproveita o mesmo registro/externalId.
        [payout] = await tx.update(payoutsTable)
          .set({ ...data, status: "pending", abacatePayoutId: null })
          .where(eq(payoutsTable.id, existing.id))
          .returning();
      } else {
        [payout] = await tx.insert(payoutsTable).values({ ...data, status: "pending" }).returning();
      }

      const linked = await tx.update(slotInstances)
        .set({ payoutId: payout.id })
        .where(and(inArray(slotInstances.id, classIds), isNull(slotInstances.payoutId)))
        .returning({ id: slotInstances.id });

      if (linked.length !== classIds.length) {
        throw new Error("As aulas do período mudaram durante o processamento. Tente novamente.");
      }

      return { payout, classes };
    });
  },

  async releasePayoutClasses(payoutId: string) {
    await db.update(slotInstances)
      .set({ payoutId: null })
      .where(eq(slotInstances.payoutId, payoutId));
  },

  async findScheduledClassesByTeacher(teacherId: string, start: Date, end: Date) {
    return db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.teacherId, teacherId),
        eq(slotInstances.status, "scheduled"),
        between(slotInstances.startAt, start, end)
      ),
      with: {
        student: {
          columns: {
            name: true,
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
  },

  async findPayoutsByTeacher(teacherId: string) {
    return db.query.payoutsTable.findMany({
      // Repasses recusados pelo provedor não movimentaram dinheiro nem têm aulas vinculadas.
      where: and(eq(payoutsTable.teacherId, teacherId), ne(payoutsTable.status, "failed")),
      with: {
        classes: {
          with: {
            student: {
              columns: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: [desc(payoutsTable.createdAt)],
    });
  }
};

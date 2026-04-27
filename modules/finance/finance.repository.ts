import { db } from "@/lib/db";
import { transactionsTable, fiscalConfigsTable } from "./finance.schema";
import { eq, and, between, sum, sql } from "drizzle-orm";

export const financeRepository = {
  // --- Transactions ---
  async createTransaction(data: typeof transactionsTable.$inferInsert) {
    const [transaction] = await db.insert(transactionsTable).values(data).returning();
    return transaction;
  },

  async updateTransaction(id: string, data: Partial<typeof transactionsTable.$inferInsert>) {
    const [transaction] = await db
      .update(transactionsTable)
      .set(data)
      .where(eq(transactionsTable.id, id))
      .returning();
    return transaction;
  },

  async deleteTransaction(id: string) {
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
  },

  async getTransactions(filters?: { type?: "income" | "expense"; status?: "paid" | "pending" | "cancelled"; start?: Date; end?: Date }) {
    let where = sql`1=1`;
    
    if (filters?.type) {
      where = and(where, eq(transactionsTable.type, filters.type))!;
    }
    if (filters?.status) {
      where = and(where, eq(transactionsTable.status, filters.status))!;
    }
    if (filters?.start && filters?.end) {
      where = and(where, between(transactionsTable.date, filters.start, filters.end))!;
    }

    return db.query.transactionsTable.findMany({
      where,
      orderBy: (transactions, { desc }) => [desc(transactions.date)],
    });
  },

  async getTransactionsTotal(filters: { type: "income" | "expense"; status: "paid" | "pending"; start: Date; end: Date; deductible?: boolean }) {
    let where = and(
      eq(transactionsTable.type, filters.type),
      eq(transactionsTable.status, filters.status),
      between(transactionsTable.date, filters.start, filters.end)
    );

    if (filters.deductible !== undefined) {
      where = and(where, eq(transactionsTable.deductible, filters.deductible));
    }

    const [result] = await db
      .select({ total: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(where);

    return Number(result?.total || 0);
  },

  // --- Fiscal Configs ---
  async getFiscalConfigByYear(year: number) {
    return db.query.fiscalConfigsTable.findFirst({
      where: eq(fiscalConfigsTable.year, year),
    });
  },

  async upsertFiscalConfig(data: typeof fiscalConfigsTable.$inferInsert) {
    const [config] = await db
      .insert(fiscalConfigsTable)
      .values(data)
      .onConflictDoUpdate({
        target: fiscalConfigsTable.year,
        set: {
          meiExemptPercentage: data.meiExemptPercentage,
          irpfRanges: data.irpfRanges,
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  },
  async getUniqueCategories(): Promise<string[]> {
    const results = await db
      .selectDistinct({ category: transactionsTable.category })
      .from(transactionsTable)
      .where(sql`${transactionsTable.category} IS NOT NULL`);
    
    return results.map(r => r.category as string);
  },
};

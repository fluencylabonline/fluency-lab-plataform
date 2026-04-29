import { db } from "@/lib/db";
import { usersTable } from "../user/user.schema";
import { transactionsTable } from "../finance/finance.schema";
import { slotInstances } from "../scheduling/scheduling.schema";
import { coursesTable, courseEnrollmentsTable } from "../course/course.schema";
import { eq, and, gte, lte, sql, count, sum, desc } from "drizzle-orm";
import { startOfMonth, subMonths } from "date-fns";

export const dashboardRepository = {
  async countActiveStudents() {
    const result = await db
      .select({ value: count() })
      .from(usersTable)
      .where(and(eq(usersTable.role, "student"), eq(usersTable.isActive, true)));
    return result[0]?.value ?? 0;
  },

  async countNewStudents(startDate: Date, endDate: Date) {
    const result = await db
      .select({ value: count() })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "student"),
          gte(usersTable.createdAt, startDate),
          lte(usersTable.createdAt, endDate)
        )
      );
    return result[0]?.value ?? 0;
  },

  async getMonthlyRevenue(startDate: Date, endDate: Date) {
    const result = await db
      .select({ value: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.type, "income"),
          eq(transactionsTable.status, "paid"),
          gte(transactionsTable.date, startDate),
          lte(transactionsTable.date, endDate)
        )
      );
    return Number(result[0]?.value ?? 0);
  },

  async getPendingRevenue() {
    const result = await db
      .select({ value: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.type, "income"),
          eq(transactionsTable.status, "pending")
        )
      );
    return Number(result[0]?.value ?? 0);
  },

  async getCashFlow(limitMonths = 6) {
    const startDate = startOfMonth(subMonths(new Date(), limitMonths - 1));

    // Using raw SQL for grouping by month because Drizzle's grouping can be tricky across different DBs
    // but Neon is Postgres, so we use to_char or date_trunc
    const result = await db.execute(sql`
      SELECT 
        to_char(date_trunc('month', date), 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date >= ${startDate}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    return result.rows as unknown as { month: string; income: string; expense: string }[];
  },

  async getTodayClassesCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db
      .select({ value: count() })
      .from(slotInstances)
      .where(
        and(
          gte(slotInstances.startAt, today),
          lte(slotInstances.startAt, tomorrow),
          eq(slotInstances.status, "scheduled")
        )
      );
    return result[0]?.value ?? 0;
  },

  async getAttendanceStats() {
    const result = await db
      .select({
        status: slotInstances.status,
        count: count()
      })
      .from(slotInstances)
      .groupBy(slotInstances.status);

    return result;
  },

  async getOnboardingFunnel() {
    const result = await db
      .select({
        step: usersTable.onboardingStep,
        count: count()
      })
      .from(usersTable)
      .where(eq(usersTable.role, "student"))
      .groupBy(usersTable.onboardingStep)
      .orderBy(usersTable.onboardingStep);

    return result;
  },

  async getPopularCourses(limit = 5) {
    const result = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title,
        enrollments: count(courseEnrollmentsTable.userId)
      })
      .from(coursesTable)
      .leftJoin(courseEnrollmentsTable, eq(coursesTable.id, courseEnrollmentsTable.courseId))
      .groupBy(coursesTable.id, coursesTable.title)
      .orderBy(desc(count(courseEnrollmentsTable.userId)))
      .limit(limit);

    return result;
  }
};

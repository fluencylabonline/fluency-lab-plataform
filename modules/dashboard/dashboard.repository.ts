import { db } from "@/lib/db";
import { usersTable } from "../user/user.schema";
import { transactionsTable } from "../finance/finance.schema";
import { slotInstances } from "../scheduling/scheduling.schema";
import { coursesTable, courseEnrollmentsTable } from "../course/course.schema";
import { eq, and, gte, lte, sql, count, sum, desc, inArray, aliasedTable } from "drizzle-orm";
import { startOfMonth, subMonths, format } from "date-fns";
import { installmentsTable } from "../billing/billing.schema";
import { payoutsTable } from "../payout/payout.schema";

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
    const installmentsResult = await db
      .select({ value: sum(installmentsTable.amount) })
      .from(installmentsTable)
      .where(
        and(
          eq(installmentsTable.status, "paid"),
          gte(installmentsTable.paidAt, startDate),
          lte(installmentsTable.paidAt, endDate)
        )
      );

    const transactionsResult = await db
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

    const installmentsSum = Number(installmentsResult[0]?.value ?? 0);
    const transactionsSum = Number(transactionsResult[0]?.value ?? 0);

    return installmentsSum + transactionsSum;
  },

  async getPendingRevenue() {
    const installmentsResult = await db
      .select({ value: sum(installmentsTable.amount) })
      .from(installmentsTable)
      .where(
        and(
          inArray(installmentsTable.status, ["pending", "overdue"])
        )
      );

    const transactionsResult = await db
      .select({ value: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.type, "income"),
          eq(transactionsTable.status, "pending")
        )
      );

    const installmentsSum = Number(installmentsResult[0]?.value ?? 0);
    const transactionsSum = Number(transactionsResult[0]?.value ?? 0);

    return installmentsSum + transactionsSum;
  },

  async getCashFlow(limitMonths = 6) {
    const now = new Date();
    const startDate = startOfMonth(subMonths(now, limitMonths - 1));

    // 1. Fetch paid installments (income)
    const installmentsResult = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${installmentsTable.paidAt}), 'YYYY-MM')`,
        amount: sum(installmentsTable.amount),
      })
      .from(installmentsTable)
      .where(
        and(
          eq(installmentsTable.status, "paid"),
          gte(installmentsTable.paidAt, startDate)
        )
      )
      .groupBy(sql`date_trunc('month', ${installmentsTable.paidAt})`);

    // 2. Fetch manual transactions (income & expenses)
    const transactionsResult = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${transactionsTable.date}), 'YYYY-MM')`,
        type: transactionsTable.type,
        amount: sum(transactionsTable.amount),
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.status, "paid"),
          gte(transactionsTable.date, startDate)
        )
      )
      .groupBy(sql`date_trunc('month', ${transactionsTable.date})`, transactionsTable.type);

    // 3. Fetch completed teacher payouts (expenses)
    const payoutsResult = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${payoutsTable.createdAt}), 'YYYY-MM')`,
        amount: sum(payoutsTable.amount),
      })
      .from(payoutsTable)
      .where(
        and(
          eq(payoutsTable.status, "completed"),
          gte(payoutsTable.createdAt, startDate)
        )
      )
      .groupBy(sql`date_trunc('month', ${payoutsTable.createdAt})`);

    // 4. Initialize months map for the last limitMonths to guarantee no month is missing
    const monthsMap = new Map<string, { income: number; expense: number }>();
    for (let i = limitMonths - 1; i >= 0; i--) {
      const monthStr = format(subMonths(now, i), "yyyy-MM");
      monthsMap.set(monthStr, { income: 0, expense: 0 });
    }

    // 5. Aggregate installments (income)
    for (const row of installmentsResult) {
      if (row.month && monthsMap.has(row.month)) {
        const val = monthsMap.get(row.month)!;
        val.income += Number(row.amount || 0);
      }
    }

    // 6. Aggregate payouts (expense)
    for (const row of payoutsResult) {
      if (row.month && monthsMap.has(row.month)) {
        const val = monthsMap.get(row.month)!;
        val.expense += Number(row.amount || 0);
      }
    }

    // 7. Aggregate manual transactions (income & expense)
    for (const row of transactionsResult) {
      if (row.month && monthsMap.has(row.month)) {
        const val = monthsMap.get(row.month)!;
        if (row.type === "income") {
          val.income += Number(row.amount || 0);
        } else if (row.type === "expense") {
          val.expense += Number(row.amount || 0);
        }
      }
    }

    // 8. Convert to result array ordered chronologically
    return Array.from(monthsMap.entries()).map(([month, data]) => ({
      month,
      income: String(data.income),
      expense: String(data.expense),
    }));
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

  async countClasses(startDate: Date, endDate: Date) {
    const result = await db
      .select({ value: count() })
      .from(slotInstances)
      .where(
        and(
          gte(slotInstances.startAt, startDate),
          lte(slotInstances.startAt, endDate),
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

  async getOnboardingStudents() {
    return db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        photoUrl: usersTable.photoUrl,
        onboardingStep: usersTable.onboardingStep,
      })
      .from(usersTable)
      .where(and(eq(usersTable.role, "student"), eq(usersTable.isActive, true)));
  },

  async getTodayClassesList() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const students = aliasedTable(usersTable, "students");
    const teachers = aliasedTable(usersTable, "teachers");

    return db
      .select({
        id: slotInstances.id,
        studentId: slotInstances.studentId,
        studentName: students.name,
        studentPhotoUrl: students.photoUrl,
        teacherId: slotInstances.teacherId,
        teacherName: teachers.name,
        teacherPhotoUrl: teachers.photoUrl,
        startAt: slotInstances.startAt,
        endAt: slotInstances.endAt,
        status: slotInstances.status,
        type: slotInstances.type,
        lessonTitle: slotInstances.lessonTitle,
      })
      .from(slotInstances)
      .leftJoin(students, eq(slotInstances.studentId, students.id))
      .leftJoin(teachers, eq(slotInstances.teacherId, teachers.id))
      .where(
        and(
          gte(slotInstances.startAt, today),
          lte(slotInstances.startAt, tomorrow),
          eq(slotInstances.status, "scheduled")
        )
      )
      .orderBy(slotInstances.startAt);
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
  },

  async getPwaStats() {
    const students = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        photoUrl: usersTable.photoUrl,
        pwaInstalled: usersTable.pwaInstalled,
        pwaInstalledAt: usersTable.pwaInstalledAt,
        locale: usersTable.locale,
      })
      .from(usersTable)
      .where(and(eq(usersTable.role, "student"), eq(usersTable.isActive, true)))
      .orderBy(desc(usersTable.pwaInstalled), usersTable.name);

    const total = students.length;
    const installed = students.filter((s) => s.pwaInstalled).length;

    return { total, installed, students };
  }
};


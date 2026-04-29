import { dashboardRepository } from "./dashboard.repository";
import { AdminDashboardOverview, MonthlyFinance, OnboardingStepStats } from "./dashboard.types";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dashboardService = {
  async getAdminOverview(): Promise<AdminDashboardOverview> {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // 1. Core Stats
    const [
      activeStudents,
      mrrCurrent,
      mrrLast,
      todayClasses,
      newStudentsCurrent,
      newStudentsLast
    ] = await Promise.all([
      dashboardRepository.countActiveStudents(),
      dashboardRepository.getMonthlyRevenue(currentMonthStart, now),
      dashboardRepository.getMonthlyRevenue(lastMonthStart, lastMonthEnd),
      dashboardRepository.getTodayClassesCount(),
      dashboardRepository.countNewStudents(currentMonthStart, now),
      dashboardRepository.countNewStudents(lastMonthStart, lastMonthEnd),
    ]);

    // 2. Finance Data
    const [cashFlowRaw, pendingIncome] = await Promise.all([
      dashboardRepository.getCashFlow(6),
      dashboardRepository.getPendingRevenue(),
    ]);

    const monthlyCashFlow: MonthlyFinance[] = cashFlowRaw.map(row => ({
      month: row.month,
      income: Number(row.income) / 100, // cents to real
      expense: Number(row.expense) / 100,
    }));

    // 3. Academic & Engagement
    const [attendanceRaw, funnelRaw, popularCourses] = await Promise.all([
      dashboardRepository.getAttendanceStats(),
      dashboardRepository.getOnboardingFunnel(),
      dashboardRepository.getPopularCourses(5),
    ]);

    const attendance = {
      completed: 0,
      noShow: 0,
      canceledStudent: 0,
      canceledTeacher: 0,
    };

    attendanceRaw.forEach(row => {
      if (row.status === "completed") attendance.completed = row.count;
      if (row.status === "no-show") attendance.noShow = row.count;
      if (row.status === "canceled-student") attendance.canceledStudent = row.count;
      if (row.status === "canceled-teacher" || row.status === "canceled-teacher-makeup") {
        attendance.canceledTeacher += row.count;
      }
    });

    const onboardingFunnel: OnboardingStepStats[] = funnelRaw.map(row => ({
      step: row.step,
      count: row.count,
      label: `Step ${row.step}`, // Can be mapped to specific names later
    }));

    return {
      stats: {
        mrr: {
          title: "Dashboard.stats.mrr",
          value: mrrCurrent / 100,
          change: mrrLast > 0 ? ((mrrCurrent - mrrLast) / mrrLast) * 100 : 0,
          trend: mrrCurrent >= mrrLast ? "up" : "down",
          format: "currency"
        },
        activeStudents: {
          title: "Dashboard.stats.activeStudents",
          value: activeStudents,
          format: "number"
        },
        todayClasses: {
          title: "Dashboard.stats.todayClasses",
          value: todayClasses,
          format: "number"
        },
        studentGrowth: {
          title: "Dashboard.stats.studentGrowth",
          value: newStudentsCurrent,
          change: newStudentsLast > 0 ? ((newStudentsCurrent - newStudentsLast) / newStudentsLast) * 100 : 0,
          trend: newStudentsCurrent >= newStudentsLast ? "up" : "down",
          format: "number"
        }
      },
      finance: {
        monthlyCashFlow,
        pendingIncome: pendingIncome / 100,
      },
      academic: {
        attendance,
        onboardingFunnel,
        popularCourses: popularCourses.map(c => ({
          id: c.id,
          title: c.title,
          enrollments: c.enrollments
        })),
        pendingCredits: 0, // TODO: Implement credits count in repository if needed
      }
    };
  }
};

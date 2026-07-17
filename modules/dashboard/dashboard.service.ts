import { dashboardRepository } from "./dashboard.repository";
import { AdminDashboardOverview, MonthlyFinance, OnboardingStepStats, OnboardingStudent } from "./dashboard.types";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfDay,
  endOfDay,
  subDays
} from "date-fns";

export const dashboardService = {
  async getAdminOverview(period: "day" | "week" | "month" = "month"): Promise<AdminDashboardOverview> {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let lastStart: Date;
    let lastEnd: Date;
    let comparisonLabel = "";

    if (period === "day") {
      currentStart = startOfDay(now);
      currentEnd = endOfDay(now);
      lastStart = startOfDay(subDays(now, 1));
      lastEnd = endOfDay(subDays(now, 1));
      comparisonLabel = "vs. ontem";
    } else if (period === "week") {
      currentStart = startOfWeek(now, { weekStartsOn: 1 });
      currentEnd = now;
      lastStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      lastEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      comparisonLabel = "vs. sem. anterior";
    } else {
      currentStart = startOfMonth(now);
      currentEnd = now;
      lastStart = startOfMonth(subMonths(now, 1));
      lastEnd = endOfMonth(subMonths(now, 1));
      comparisonLabel = "vs. mês anterior";
    }

    // 1. Core Stats
    const [
      activeStudents,
      revenueCurrent,
      revenueLast,
      classesCurrent,
      classesLast,
      newStudentsCurrent,
      newStudentsLast
    ] = await Promise.all([
      dashboardRepository.countActiveStudents(),
      dashboardRepository.getMonthlyRevenue(currentStart, currentEnd),
      dashboardRepository.getMonthlyRevenue(lastStart, lastEnd),
      dashboardRepository.countClasses(currentStart, currentEnd),
      dashboardRepository.countClasses(lastStart, lastEnd),
      dashboardRepository.countNewStudents(currentStart, currentEnd),
      dashboardRepository.countNewStudents(lastStart, lastEnd),
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
    const [attendanceRaw, onboardingStudents, popularCourses, pwaStats, todayClassesList] = await Promise.all([
      dashboardRepository.getAttendanceStats(),
      dashboardRepository.getOnboardingStudents(),
      dashboardRepository.getPopularCourses(5),
      dashboardRepository.getPwaStats(),
      dashboardRepository.getTodayClassesList(),
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
      if (row.status === "canceled-teacher") {
        attendance.canceledTeacher = row.count;
      }
    });

    // 4. Map Onboarding Funnel: group students by their onboarding step
    const stepsMap = new Map<number, { step: number; count: number; label: string; students: OnboardingStudent[] }>();
    const stepsLabels = ["Boas-vindas", "Documentos", "Pagamento", "Contrato", "Concluído"];
    for (let i = 1; i <= 5; i++) {
      stepsMap.set(i, {
        step: i,
        count: 0,
        label: stepsLabels[i - 1] || `Etapa ${i}`,
        students: []
      });
    }

    onboardingStudents.forEach(student => {
      const stepNum = student.onboardingStep || 1;
      const stepData = stepsMap.get(stepNum);
      if (stepData) {
        stepData.count += 1;
        stepData.students.push({
          id: student.id,
          name: student.name,
          email: student.email,
          photoUrl: student.photoUrl
        });
      }
    });

    const onboardingFunnel: OnboardingStepStats[] = Array.from(stepsMap.values());

    return {
      stats: {
        mrr: {
          title: "Dashboard.stats.mrr",
          value: revenueCurrent / 100,
          change: revenueLast > 0 ? ((revenueCurrent - revenueLast) / revenueLast) * 100 : 0,
          trend: revenueCurrent >= revenueLast ? "up" : "down",
          comparisonLabel,
          format: "currency"
        },
        activeStudents: {
          title: "Dashboard.stats.activeStudents",
          value: activeStudents,
          format: "number"
        },
        todayClasses: {
          title: "Dashboard.stats.todayClasses",
          value: classesCurrent,
          change: classesLast > 0 ? ((classesCurrent - classesLast) / classesLast) * 100 : 0,
          trend: classesCurrent >= classesLast ? "up" : "down",
          comparisonLabel,
          format: "number"
        },
        studentGrowth: {
          title: "Dashboard.stats.studentGrowth",
          value: newStudentsCurrent,
          change: newStudentsLast > 0 ? ((newStudentsCurrent - newStudentsLast) / newStudentsLast) * 100 : 0,
          trend: newStudentsCurrent >= newStudentsLast ? "up" : "down",
          comparisonLabel,
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
        pendingCredits: 0,
      },
      pwa: pwaStats,
      todayClassesList: todayClassesList.map(c => ({
        ...c,
        teacherName: c.teacherName || "Sem Nome",
        startAt: new Date(c.startAt),
        endAt: new Date(c.endAt)
      })),
    };
  }
};

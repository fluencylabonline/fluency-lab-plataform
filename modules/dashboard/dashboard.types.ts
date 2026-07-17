export interface StatCardData {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: string;
  format?: "currency" | "number" | "percentage";
  comparisonLabel?: string;
}

export interface PwaStudent {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  pwaInstalled: boolean;
  pwaInstalledAt: Date | null;
}

export interface PwaStats {
  total: number;
  installed: number;
  students: PwaStudent[];
}

export interface MonthlyFinance {
  month: string;
  income: number;
  expense: number;
}

export interface OnboardingStudent {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
}

export interface OnboardingStepStats {
  step: number;
  count: number;
  label: string;
  students: OnboardingStudent[];
}

export interface PopularCourse {
  id: string;
  title: string;
  enrollments: number;
}

export interface AttendanceStats {
  completed: number;
  noShow: number;
  canceledStudent: number;
  canceledTeacher: number;
}

export interface TodayClass {
  id: string;
  studentId: string | null;
  studentName: string | null;
  studentPhotoUrl: string | null;
  teacherId: string;
  teacherName: string;
  teacherPhotoUrl: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  type: string;
  lessonTitle: string | null;
}

export interface AdminDashboardOverview {
  stats: {
    mrr: StatCardData;
    activeStudents: StatCardData;
    todayClasses: StatCardData;
    studentGrowth: StatCardData;
  };
  finance: {
    monthlyCashFlow: MonthlyFinance[];
    pendingIncome: number;
  };
  academic: {
    attendance: AttendanceStats;
    onboardingFunnel: OnboardingStepStats[];
    popularCourses: PopularCourse[];
    pendingCredits: number;
  };
  pwa: PwaStats;
  todayClassesList: TodayClass[];
}

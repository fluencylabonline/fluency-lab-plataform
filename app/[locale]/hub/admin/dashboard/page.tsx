import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { dashboardService } from "@/modules/dashboard/dashboard.service";
import { Header } from "@/components/layout/header";
import { getTranslations } from "next-intl/server";
import { StatCard } from "./_components/StatCard";
import { FinanceCharts } from "./_components/FinanceCharts";
import { AcademicStats } from "./_components/AcademicStats";
import { OnboardingFunnel } from "./_components/OnboardingFunnel";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "class.view.all")) {
    redirect("/signin");
  }

  const data = await dashboardService.getAdminOverview();
  const t = await getTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-6">
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        user={user}
      />

      <main className="container pb-10 flex flex-col gap-8">
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard data={{ ...data.stats.mrr, title: t("stats.mrr") }} />
          <StatCard data={{ ...data.stats.activeStudents, title: t("stats.activeStudents") }} />
          <StatCard data={{ ...data.stats.todayClasses, title: t("stats.todayClasses") }} />
          <StatCard data={{ ...data.stats.studentGrowth, title: t("stats.studentGrowth") }} />
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <FinanceCharts 
            data={data.finance.monthlyCashFlow} 
            pendingIncome={data.finance.pendingIncome} 
          />
        </div>

        {/* Academic & Onboarding */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <AcademicStats 
              attendance={data.academic.attendance} 
              popularCourses={data.academic.popularCourses} 
            />
          </div>
          <div className="xl:col-span-1">
            <OnboardingFunnel data={data.academic.onboardingFunnel} />
          </div>
        </div>
      </main>
    </div>
  );
}

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
import { PwaStatsVault } from "./_components/PwaStatsVault";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "class.view.all")) {
    redirect("/signin");
  }

  const data = await dashboardService.getAdminOverview();
  const t = await getTranslations("Dashboard");

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        user={user}
        className="contents"
      />

      <main className="container max-w-7xl pb-12 pt-2 flex flex-col gap-8">
        {/* Section: KPIs */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">
            {t("sections.overview")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <StatCard data={{ ...data.stats.mrr, title: t("stats.mrr") }} />
            <StatCard data={{ ...data.stats.activeStudents, title: t("stats.activeStudents") }} />
            <StatCard data={{ ...data.stats.todayClasses, title: t("stats.todayClasses") }} />
            <StatCard data={{ ...data.stats.studentGrowth, title: t("stats.studentGrowth") }} />
            <PwaStatsVault data={data.pwa} />
          </div>
        </section>

        {/* Section: Finance */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">
            {t("sections.finance")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <FinanceCharts
              data={data.finance.monthlyCashFlow}
              pendingIncome={data.finance.pendingIncome}
            />
          </div>
        </section>

        {/* Section: Academic & Onboarding */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-0.5">
            {t("sections.academic")}
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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
        </section>
      </main>
    </div>
  );
}
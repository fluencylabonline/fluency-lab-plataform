import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Film, Layers } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-server";
import { courseService } from "@/modules/course/course.service";
import { Header } from "@/components/layout/header";
import { EmptyResults } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { holidayRecessDates, isHolidayRecessPeriod } from "@/lib/holiday-recess";

/** Todas as aulas de recesso gravadas (pacotes publicados), disponíveis o ano todo. */
export default async function StudentHolidayClassesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const [packages, t] = await Promise.all([
    courseService.getHolidayRecessPackages(user),
    getTranslations("HolidayClasses.student"),
  ]);
  const dates = holidayRecessDates();
  const inPeriod = isHolidayRecessPeriod();

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t("title")} subtitle={t("subtitle")} backHref="/hub/student/profile" className="contents" />

      <main className="container space-y-6 pt-6">
        <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground/85" data-tour="student-holiday-classes.notice">
          {inPeriod
            ? t("noticeInPeriod", { returnDay: dates.returnDay })
            : t("noticeOutOfPeriod", { firstDayOff: dates.firstDayOff, endDay: dates.endDay })}
        </div>

        {packages.length === 0 ? (
          <EmptyResults title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2" data-tour="student-holiday-classes.list">
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/hub/student/holiday-classes/${pkg.id}`}
                className="card group flex flex-col gap-4 p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Film className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{pkg.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{pkg.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                {pkg.sections.length > 0 && (
                  <ul className="space-y-1.5 border-t border-border/60 pt-3">
                    {pkg.sections.map((section) => (
                      <li key={section.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-foreground/80">
                          <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{section.title}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t("lessonsCount", { count: section.lessons.length })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("lessonsCount", { count: pkg.lessonCount })}</span>
                    {pkg.isEnrolled && <span className="font-semibold text-foreground">{pkg.progressPercentage}%</span>}
                  </div>
                  {pkg.isEnrolled && <Progress value={pkg.progressPercentage} className="h-1.5" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

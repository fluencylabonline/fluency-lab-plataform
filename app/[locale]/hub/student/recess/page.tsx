import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { format, startOfDay } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { BookOpen, Calendar, ChevronRight, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-server";
import { schedulingService } from "@/modules/scheduling/scheduling.service";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { EmptyResults } from "@/components/ui/empty";

type RecessItem = Awaited<ReturnType<typeof schedulingService.getStudentRecessActivities>>[number];

export default async function StudentRecessListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const [activities, t, locale] = await Promise.all([
    schedulingService.getStudentRecessActivities(user),
    getTranslations("StudentRecess.list"),
    getLocale(),
  ]);
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const today = startOfDay(new Date());
  const upcoming = activities.filter((a) => a.startAt >= today).reverse();
  const past = activities.filter((a) => a.startAt < today);

  const renderItem = (item: RecessItem) => (
    <Link
      key={item.id}
      href={`/hub/student/recess/${item.id}`}
      className="group flex items-center justify-between gap-4 rounded-md border border-zinc-200 p-4 transition-colors card hover:bg-zinc-50/80 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="rounded-md bg-purple-100/50 p-2.5 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-bold text-zinc-900 dark:text-zinc-100">{item.lessonTitle}</span>
            {item.difficulty && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase">
                {item.difficulty}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {t("classOf", { date: format(item.startAt, "PPP, HH:mm", { locale: dateLocale }) })}
            </span>
            {item.teacherName && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {t("teacher", { name: item.teacherName })}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="sr-only">{t("open")}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-1 dark:text-zinc-600" />
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t("title")} subtitle={t("subtitle")} backHref="/hub/student/profile" className="contents" />

      <main className="container space-y-8 py-6">
        {activities.length === 0 ? (
          <EmptyResults title={t("empty")} description={t("emptyText")} />
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="space-y-3" data-tour="student-recess-list.upcoming">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t("upcoming")}</h2>
                <div className="grid gap-3 md:grid-cols-2">{upcoming.map(renderItem)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3" data-tour="student-recess-list.past">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t("past")}</h2>
                <div className="grid gap-3 md:grid-cols-2">{past.map(renderItem)}</div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

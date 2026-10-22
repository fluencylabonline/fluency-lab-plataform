import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-server";
import { Header } from "@/components/layout/header";
import { learningService } from "@/modules/learning/learning.service";
import { cn } from "@/lib/utils";
import { levelBadgeClass } from "../../_components/level-style";

interface TemplatePageProps {
  params: Promise<{ planId: string; locale: string }>;
}

/** Lições de um template, na ordem da sequência. Cada uma abre a página de detalhes da lição. */
export default async function TeacherTemplatePage({ params }: TemplatePageProps) {
  const { planId, locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const plan = await learningService.getPlanById(planId);
  // Só templates publicados (plano sem aluno) são visíveis aqui.
  if (!plan || plan.studentId !== null || plan.status !== "approved") notFound();

  const t = await getTranslations("Lessons");
  const lessons = plan.lessons.filter((entry) => entry.lesson?.status === "ready");

  return (
    <div>
      <Header
        title={plan.name}
        subtitle={t("templateLessons", { count: lessons.length })}
        showSubHeader={false}
        className="contents"
        backHref={`/${locale}/hub/teacher/lessons`}
      />

      <main className="container pb-24 lg:pb-0">
        {plan.description && <p className="mb-6 max-w-3xl text-sm leading-relaxed text-foreground/70">{plan.description}</p>}

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lessons.map((entry, index) => (
            <li key={entry.lessonId}>
              <Link
                href={`/${locale}/hub/teacher/lessons/${entry.lessonId}`}
                className="card group flex h-full flex-col gap-2.5 p-4 outline-none sm:gap-3 sm:p-5 focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-2 text-xs font-bold text-foreground/80">
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-9 items-center justify-center rounded-md px-2 text-xs font-bold ring-1 ring-inset",
                      levelBadgeClass(entry.lesson.difficulty)
                    )}
                  >
                    {entry.lesson.difficulty}
                  </span>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <h3 className="text-[15px] font-bold leading-snug text-foreground line-clamp-2 sm:text-base transition-colors group-hover:text-primary">
                  {entry.lesson.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-foreground/70 line-clamp-2 sm:line-clamp-3">
                  {entry.lesson.contentText || t("noDescription")}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

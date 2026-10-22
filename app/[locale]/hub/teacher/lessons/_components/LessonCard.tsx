"use client";

import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { ArrowUpRight, Globe, Coffee } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { levelBadgeClass } from "./level-style";

interface LessonCardProps {
  lesson: LessonSummary;
}

export function LessonCard({ lesson }: LessonCardProps) {
  const t = useTranslations("Lessons");
  const commonT = useTranslations("Common");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <Link
      href={`/${locale}/hub/teacher/lessons/${lesson.id}`}
      className="card group flex h-full flex-col gap-2.5 p-4 outline-none sm:gap-3 sm:p-5 focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`${t("viewDetails")}: ${lesson.title}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-6 min-w-9 items-center justify-center rounded-md px-2 text-xs font-bold ring-1 ring-inset",
            levelBadgeClass(lesson.difficulty)
          )}
        >
          {lesson.difficulty}
        </span>
        {lesson.isRecessActivity && (
          <span className="inline-flex h-6 items-center gap-1 rounded-md bg-amber-500/15 px-2 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300">
            <Coffee className="h-3 w-3" />
            {t("recessTag")}
          </span>
        )}
        <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <h3 className="text-[15px] font-bold leading-snug text-foreground line-clamp-2 sm:text-base transition-colors group-hover:text-primary">
        {lesson.title}
      </h3>

      <p className="flex-1 text-sm leading-relaxed text-foreground/70 line-clamp-2 sm:line-clamp-3">
        {lesson.contentText || t("noDescription")}
      </p>

      <div className="flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground">
        <Globe className="h-3.5 w-3.5" />
        {lesson.language?.name || commonT("language")}
      </div>
    </Link>
  );
}

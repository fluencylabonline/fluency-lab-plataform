"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Globe, Layers } from "lucide-react";

export interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  languageId: string;
  languageName: string | null;
  lessonsCount: number;
}

/** Template (sequência de lições): abre a página com as lições dele. */
export function TemplateCard({ template }: { template: TemplateSummary }) {
  const t = useTranslations("Lessons");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <Link
      href={`/${locale}/hub/teacher/lessons/templates/${template.id}`}
      className="card group flex h-full flex-col gap-2.5 p-4 outline-none sm:gap-3 sm:p-5 focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`${t("viewTemplate")}: ${template.name}`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 items-center gap-1 rounded-md bg-primary/10 px-2 text-xs font-bold text-primary ring-1 ring-inset ring-primary/30">
          <Layers className="h-3 w-3" />
          {t("templateLessons", { count: template.lessonsCount })}
        </span>
        <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <h3 className="text-[15px] font-bold leading-snug text-foreground line-clamp-2 sm:text-base transition-colors group-hover:text-primary">
        {template.name}
      </h3>

      <p className="flex-1 text-sm leading-relaxed text-foreground/70 line-clamp-2 sm:line-clamp-3">
        {template.description || t("noDescription")}
      </p>

      <div className="flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground">
        <Globe className="h-3.5 w-3.5" />
        {template.languageName}
      </div>
    </Link>
  );
}

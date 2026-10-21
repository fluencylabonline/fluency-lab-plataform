"use client";

import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";

interface HolidayClassesCardProps {
  packageCount: number;
  returnDay: string;
}

/** No recesso de fim de ano, ocupa o lugar do cartão de próxima aula. */
export function HolidayClassesCard({ packageCount, returnDay }: HolidayClassesCardProps) {
  const t = useTranslations("HolidayClasses.card");

  return (
    <div className="card p-6 flex flex-col items-center justify-center text-center h-full">
      <div className="p-3 rounded-full bg-primary/10 mb-4 text-primary">
        <Film className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{t("title")}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-[260px]">
        {t("description", { returnDay })}
      </p>
      <p className="mt-1 text-xs font-semibold text-primary">{t("packages", { count: packageCount })}</p>
      <Link
        href="/hub/student/holiday-classes"
        className={buttonVariants({ className: "mt-5 gap-2" })}
      >
        {t("cta")}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

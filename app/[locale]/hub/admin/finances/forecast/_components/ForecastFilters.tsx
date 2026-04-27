"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ForecastFiltersProps {
  currentMonth: number | "all";
  currentYear: number;
}

export function ForecastFilters({ currentMonth, currentYear }: ForecastFiltersProps) {
  const t = useTranslations("AdminFinances");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const monthLabels = useMemo(() => [
    t("months.january"), t("months.february"), t("months.march"),
    t("months.april"), t("months.may"), t("months.june"),
    t("months.july"), t("months.august"), t("months.september"),
    t("months.october"), t("months.november"), t("months.december"),
  ], [t]);

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => now - i);
  }, []);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 bg-card p-3 rounded-2xl border border-border/50 shadow-xs">
      <Select
        value={currentMonth.toString()}
        onValueChange={(v) => updateFilters("month", v)}
      >
        <SelectTrigger className="w-[160px] rounded-xl border-border/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allMonths")}</SelectItem>
          {monthLabels.map((label, i) => (
            <SelectItem key={i} value={i.toString()}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentYear.toString()}
        onValueChange={(v) => updateFilters("year", v)}
      >
        <SelectTrigger className="w-[100px] rounded-xl border-border/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

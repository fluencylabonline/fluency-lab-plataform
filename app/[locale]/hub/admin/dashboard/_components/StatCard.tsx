"use client";

import { StatCardData } from "@/modules/dashboard/dashboard.types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StatCardProps {
  data: StatCardData;
}

export function StatCard({ data }: StatCardProps) {
  const t = useTranslations("Dashboard.stats");
  
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: data.format === "currency" ? "currency" : "decimal",
    currency: "BRL",
    maximumFractionDigits: data.format === "currency" ? 2 : 0,
  }).format(Number(data.value));

  const hasChange = typeof data.change === "number";

  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-100 dark:border-emerald-900/60",
      label: "text-emerald-600 dark:text-emerald-400",
    },
    down: {
      icon: TrendingDown,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-100 dark:border-rose-900/60",
      label: "text-rose-600 dark:text-rose-400",
    },
    neutral: {
      icon: Minus,
      color: "text-muted-foreground",
      bg: "bg-muted/40",
      border: "border-border/60",
      label: "text-muted-foreground",
    },
  };

  const trend = data.trend ?? "neutral";
  const config = trendConfig[trend];
  const Icon = config.icon;

  return (
    <div className="card relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
      {/* Subtle top accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          trend === "up" && "bg-emerald-400",
          trend === "down" && "bg-rose-400",
          trend === "neutral" && "bg-border"
        )}
      />

      <div className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {data.title}
        </div>
        <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg", config.bg, config.border, "border")}>
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {formattedValue}
        </div>

        {hasChange && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn("text-xs font-semibold tabular-nums", config.label)}>
              {data.change! > 0 ? "+" : ""}{data.change?.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground/60">
              {t("vsLastMonth")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
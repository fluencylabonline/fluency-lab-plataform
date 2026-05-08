"use client";

import { OnboardingStepStats } from "@/modules/dashboard/dashboard.types";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface OnboardingFunnelProps {
  data: OnboardingStepStats[];
}

export function OnboardingFunnel({ data }: OnboardingFunnelProps) {
  const t = useTranslations("Dashboard.onboarding");
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const firstCount = data[0]?.count ?? 1;

  return (
    <div className="card h-full">
      <div className="px-6 pt-6 pb-3">
        <h3 className="subtitle">{t("title")}</h3>
        <div className="paragraph">{t("subtitle")}</div>
      </div>
      <div className="px-6 pb-6">
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((step, idx) => {
              const pct = Math.round((step.count / maxCount) * 100);
              const conversionFromFirst =
                idx > 0 && firstCount > 0
                  ? Math.round((step.count / firstCount) * 100)
                  : null;

              return (
                <div key={step.step} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Step number pill */}
                      <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{step.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {conversionFromFirst !== null && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {conversionFromFirst}%
                        </span>
                      )}
                      <span className="text-sm font-semibold tabular-nums">
                        {step.count}
                        <span className="text-xs text-muted-foreground font-normal ml-0.5">{t("students")}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `hsl(var(--primary) / ${1 - idx * 0.12})`,
                      }}
                    />
                  </div>

                  {/* Drop-off indicator between steps */}
                  {idx < data.length - 1 && data[idx + 1] && (
                    <div className="flex items-center gap-1 pl-7">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        {data[idx + 1].count < step.count
                          ? t("dropped", { count: step.count - data[idx + 1].count })
                          : ""}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[180px] gap-2 text-muted-foreground">
            <Users className="h-8 w-8 opacity-30" />
            <span className="text-sm">{t("empty")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
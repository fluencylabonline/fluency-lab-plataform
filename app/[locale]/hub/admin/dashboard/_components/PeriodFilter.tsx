"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function PeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("period") || "month";

  const periods = [
    { value: "day", label: "Dia" },
    { value: "week", label: "Semana" },
    { value: "month", label: "Mês" },
  ];

  return (
    <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50">
      {periods.map((p) => {
        const active = currentPeriod === p.value;
        return (
          <button
            key={p.value}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("period", p.value);
              router.push(`?${params.toString()}`, { scroll: false });
            }}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
              active
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

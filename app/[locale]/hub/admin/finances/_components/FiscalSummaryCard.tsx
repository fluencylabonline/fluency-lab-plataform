"use client";

import { useFormatter, useTranslations } from "next-intl";
import { LandmarkIcon, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FiscalSummaryCardProps {
  irpfDue: number;
  year: number;
}

export function FiscalSummaryCard({ irpfDue, year }: FiscalSummaryCardProps) {
  const t = useTranslations("AdminFinances.metrics");
  const format = useFormatter();

  return (
    <div className="card border-border overflow-hidden">
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <LandmarkIcon className="size-5 text-purple-500" />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[200px] text-xs">{t("irpfTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("irpfDue")}
          </span>
          <span className="text-2xl font-bold tracking-tight">
            {format.number(irpfDue / 100, { style: "currency", currency: "BRL" })}
          </span>
          <span className="text-[11px] text-muted-foreground mt-1">
            {t("irpfAnnualCaption", { year })}
          </span>
        </div>
      </div>
    </div>
  );
}

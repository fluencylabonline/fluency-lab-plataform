"use client";

import { useTranslations, useFormatter } from "next-intl";
import { ArrowUpCircle, ArrowDownCircle, Wallet, LandmarkIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FinanceMetrics, MonthlyBreakdownItem } from "@/modules/finance/finance.types";

interface MetricsCardsProps {
  metrics: FinanceMetrics;
  monthlyBreakdown: MonthlyBreakdownItem[];
  currentMonth: number | "all";
}

export function MetricsCards({ metrics, monthlyBreakdown, currentMonth }: MetricsCardsProps) {
  const t = useTranslations("AdminFinances.metrics");
  const format = useFormatter();

  const selectedMonthData = currentMonth !== "all" ? monthlyBreakdown[currentMonth as number] : null;

  const cards = [
    {
      title: t("revenue"),
      value: metrics.revenue.total,
      icon: ArrowUpCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      details: [
        { label: t("installments"), value: metrics.revenue.installments },
        { label: t("extraRevenue"), value: metrics.revenue.extra },
        ...(selectedMonthData ? [{ label: t("monthlyTotal"), value: selectedMonthData.revenue, isTotal: true }] : []),
      ],
    },
    {
      title: t("expenses"),
      value: metrics.expenses.total,
      icon: ArrowDownCircle,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      details: [
        { label: t("teacherPayouts"), value: metrics.expenses.payouts },
        { label: t("extraExpenses"), value: metrics.expenses.extra },
        ...(selectedMonthData ? [{ label: t("monthlyTotal"), value: selectedMonthData.expenses, isTotal: true }] : []),
      ],
    },
    {
      title: t("netProfit"),
      value: metrics.netProfit,
      icon: Wallet,
      color: metrics.netProfit >= 0 ? "text-blue-500" : "text-amber-500",
      bgColor: metrics.netProfit >= 0 ? "bg-blue-500/10" : "bg-amber-500/10",
      details: selectedMonthData ? [
        { label: t("monthlyTotal"), value: selectedMonthData.netProfit, isTotal: true }
      ] : [],
    },
    {
      title: t("irpfDue"),
      value: metrics.fiscal.irpfDue,
      icon: LandmarkIcon,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      tooltip: t("irpfTooltip"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="card border-border overflow-hidden">
          <div className="p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded-lg", card.bgColor)}>
                <card.icon className={cn("size-5", card.color)} />
              </div>
              {card.tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="size-4 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">{card.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <span className="text-2xl font-bold tracking-tight">
                {format.number(card.value / 100, { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            {card.details && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                {card.details.map((detail: { label: string; value: number; isTotal?: boolean }, j) => (
                  <div 
                    key={j} 
                    className={cn(
                      "flex justify-between text-[11px]",
                      detail.isTotal ? "pt-1.5 mt-1 border-t border-dashed border-border font-bold text-foreground" : ""
                    )}
                  >
                    <span className={detail.isTotal ? "" : "text-muted-foreground"}>{detail.label}</span>
                    <span className="font-medium">{format.number(detail.value / 100, { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useTranslations, useFormatter } from "next-intl";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyBreakdownItem } from "@/modules/finance/finance.types";

interface MetricsCardsProps {
  monthlyBreakdown: MonthlyBreakdownItem[];
  currentMonth: number | "all";
}

function aggregateAllMonths(monthlyBreakdown: MonthlyBreakdownItem[]): MonthlyBreakdownItem | null {
  if (monthlyBreakdown.length === 0) return null;
  return monthlyBreakdown.reduce<MonthlyBreakdownItem>((acc, item) => ({
    month: item.month,
    revenue: acc.revenue + item.revenue,
    installments: acc.installments + item.installments,
    extraRevenue: acc.extraRevenue + item.extraRevenue,
    expenses: acc.expenses + item.expenses,
    teacherPayouts: acc.teacherPayouts + item.teacherPayouts,
    extraExpenses: acc.extraExpenses + item.extraExpenses,
    aiCost: acc.aiCost + item.aiCost,
    netProfit: acc.netProfit + item.netProfit,
  }), {
    month: 0,
    revenue: 0,
    installments: 0,
    extraRevenue: 0,
    expenses: 0,
    teacherPayouts: 0,
    extraExpenses: 0,
    aiCost: 0,
    netProfit: 0,
  });
}

export function MetricsCards({ monthlyBreakdown, currentMonth }: MetricsCardsProps) {
  const t = useTranslations("AdminFinances.metrics");
  const format = useFormatter();

  const isAllMonths = currentMonth === "all";
  const currentMonthData = isAllMonths
    ? aggregateAllMonths(monthlyBreakdown)
    : (monthlyBreakdown[currentMonth] ?? null);

  const totalLabel = isAllMonths ? t("annualTotal") : t("monthlyTotal");

  const cards = [
    {
      title: isAllMonths ? t("revenueAnnual") : t("revenueMonthly"),
      value: currentMonthData?.revenue ?? 0,
      icon: ArrowUpCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      details: [
        { label: t("installments"), value: currentMonthData?.installments ?? 0 },
        { label: t("extraRevenue"), value: currentMonthData?.extraRevenue ?? 0 },
        { label: totalLabel, value: currentMonthData?.revenue ?? 0, isTotal: true },
      ],
    },
    {
      title: isAllMonths ? t("expensesAnnual") : t("expensesMonthly"),
      value: currentMonthData?.expenses ?? 0,
      icon: ArrowDownCircle,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      details: [
        { label: t("teacherPayouts"), value: currentMonthData?.teacherPayouts ?? 0 },
        { label: t("extraExpenses"), value: currentMonthData?.extraExpenses ?? 0 },
        { label: totalLabel, value: currentMonthData?.expenses ?? 0, isTotal: true },
      ],
    },
    {
      title: isAllMonths ? t("netProfitAnnual") : t("netProfit"),
      value: currentMonthData?.netProfit ?? 0,
      icon: Wallet,
      color: (currentMonthData?.netProfit ?? 0) >= 0 ? "text-blue-500" : "text-amber-500",
      bgColor: (currentMonthData?.netProfit ?? 0) >= 0 ? "bg-blue-500/10" : "bg-amber-500/10",
      details: currentMonthData ? [
        { label: isAllMonths ? t("revenueAnnual") : t("revenueMonthly"), value: currentMonthData.revenue },
        { label: isAllMonths ? t("expensesAnnual") : t("expensesMonthly"), value: currentMonthData.expenses },
        { label: totalLabel, value: currentMonthData.netProfit, isTotal: true }
      ] : [],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="card border-border overflow-hidden">
          <div className="p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded-lg", card.bgColor)}>
                <card.icon className={cn("size-5", card.color)} />
              </div>
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

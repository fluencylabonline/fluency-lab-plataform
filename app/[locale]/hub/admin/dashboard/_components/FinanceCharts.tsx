"use client";

import { useIsMounted } from "@/hooks/use-is-mounted";
import { MonthlyFinance } from "@/modules/dashboard/dashboard.types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceChartsProps {
  data: MonthlyFinance[];
  pendingIncome: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 1,
  }).format(v);

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string | number;
    value: number;
    payload: Record<string, unknown>;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  const net = income - expense;

  return (
    <div className="rounded-md border bg-card px-4 py-3 shadow-xl text-sm min-w-[190px] space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            <span className="text-xs text-muted-foreground">Receita</span>
          </div>
          <span className="font-semibold tabular-nums text-primary">{fmt(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span className="text-xs text-muted-foreground">Despesa</span>
          </div>
          <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">{fmt(expense)}</span>
        </div>
      </div>
      <div className="pt-1.5 border-t flex items-center justify-between gap-6">
        <span className="text-xs text-muted-foreground">Líquido</span>
        <span className={cn(
          "font-bold tabular-nums text-sm",
          net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        )}>
          {net >= 0 ? "+" : ""}{fmt(net)}
        </span>
      </div>
    </div>
  );
}

export function FinanceCharts({ data, pendingIncome }: FinanceChartsProps) {
  const t = useTranslations("Dashboard.finance");
  const isMounted = useIsMounted();

  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const isProfit = netProfit >= 0;

  const lastTwo = data.slice(-2);
  const prevNet = lastTwo[0] ? lastTwo[0].income - lastTwo[0].expense : 0;
  const currNet = lastTwo[1] ? lastTwo[1].income - lastTwo[1].expense : 0;
  const momNet = lastTwo.length === 2 && prevNet !== 0
    ? ((currNet - prevNet) / Math.abs(prevNet)) * 100
    : null;

  const summaries = [
    {
      label: t("totalIncome"),
      value: totalIncome,
      color: "text-primary",
      bg: "bg-primary/[0.07] dark:bg-primary/15",
      Icon: TrendingUp,
      iconColor: "text-primary",
    },
    {
      label: t("totalExpense"),
      value: totalExpense,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      Icon: TrendingDown,
      iconColor: "text-rose-500",
    },
    {
      label: t("netProfit"),
      value: netProfit,
      color: isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      bg: isProfit ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40",
      Icon: isProfit ? TrendingUp : TrendingDown,
      iconColor: isProfit ? "text-emerald-500" : "text-rose-500",
      badge: t("margin", { value: margin.toFixed(1) }),
      badgeColor: isProfit
        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
        : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
      mom: momNet,
    },
  ];

  return (
    <div className="card col-span-full">
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="subtitle">{t("cashFlow")}</h3>
            <div className="paragraph mt-0.5">{t("cashFlowDesc")}</div>
          </div>

          {pendingIncome > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 px-3 py-2 self-start">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-none">
                  {t("pendingIncome")}
                </p>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums mt-0.5">
                  {fmt(pendingIncome)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* KPI summaries */}
          <div className="flex flex-row lg:flex-col gap-3 lg:w-48 lg:shrink-0">
            {summaries.map((s) => (
              <div key={s.label} className={cn("flex-1 lg:flex-none rounded-md px-3.5 py-3 space-y-1.5", s.bg)}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 leading-none">
                    {s.label}
                  </p>
                  <s.Icon className={cn("h-3.5 w-3.5", s.iconColor)} />
                </div>

                <p className={cn("text-xl font-bold tabular-nums leading-tight", s.color)}>
                  {fmtCompact(s.value)}
                </p>

                <div className="flex flex-wrap gap-1">
                  {s.badge && (
                    <span className={cn("inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md", s.badgeColor)}>
                      {s.badge}
                    </span>
                  )}
                  {s.mom !== null && s.mom !== undefined && (
                    <span className={cn(
                      "inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                      s.mom >= 0
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
                    )}>
                      {s.mom >= 0 ? "▲" : "▼"} {Math.abs(s.mom).toFixed(1)}% {t("vsLastMonth")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="flex-1 h-[260px] min-w-0">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={data}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  barGap={3}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="month"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={6}
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)" }}
                    tickFormatter={fmtCompact}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "var(--muted)", opacity: 0.06, radius: 6 }}
                  />
                  <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
                  <Bar
                    name={t("income")}
                    dataKey="income"
                    fill="var(--primary)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    name={t("expense")}
                    dataKey="expense"
                    fill="var(--destructive)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                    opacity={0.7}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-slate-300/10 dark:bg-slate-950/20 rounded-md animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
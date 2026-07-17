"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FiscalConfigVault } from "./FiscalConfigVault";
import { ExportFinancesVault } from "./ExportFinancesVault";
import { ForecastCards } from "./ForecastCards";
import { MetricsCards } from "./MetricsCards";
import { NewTransactionVault } from "./NewTransactionVault";
import { TransactionsTable } from "./TransactionsTable";
import { FiscalConfig } from "@/modules/finance/finance.schema";
import {
  FinanceMetrics,
  FinanceForecast,
  MonthlyBreakdownItem,
  MEICapacity,
  UnifiedTransaction,
} from "@/modules/finance/finance.types";
import { MEICapacityCard } from "./MEICapacityCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GatewayBalancesCard } from "./GatewayBalancesCard";

interface FinanceDashboardProps {
  initialMetrics: FinanceMetrics;
  initialForecast: FinanceForecast;
  initialTransactions: UnifiedTransaction[];
  initialMonthlyBreakdown: MonthlyBreakdownItem[];
  initialFiscalConfig: FiscalConfig | null;
  initialMEICapacity: MEICapacity;
  initialGatewayBalances: {
    stripe: { available: number; pending: number; currency: string };
    abacate: { available: number; pending: number; blocked: number; currency: string };
  };
  currentMonth: number | "all";
  currentYear: number;
  currentStatus: string;
  currentSource: string;
}

export function FinanceDashboard({
  initialMetrics,
  initialForecast,
  initialTransactions,
  initialMonthlyBreakdown,
  initialFiscalConfig,
  initialMEICapacity,
  initialGatewayBalances,
  currentMonth,
  currentYear,
  currentStatus,
  currentSource,
}: FinanceDashboardProps) {
  const t = useTranslations("AdminFinances");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const monthLabels = useMemo(
    () => [
      t("months.january"),
      t("months.february"),
      t("months.march"),
      t("months.april"),
      t("months.may"),
      t("months.june"),
      t("months.july"),
      t("months.august"),
      t("months.september"),
      t("months.october"),
      t("months.november"),
      t("months.december"),
    ],
    [t],
  );

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => now - i);
  }, []);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-md border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={currentMonth.toString()}
            onValueChange={(v) => updateFilters("month", v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allMonths")}</SelectItem>
              {monthLabels.map((label, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentYear.toString()}
            onValueChange={(v) => updateFilters("year", v)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentStatus}
            onValueChange={(v) => updateFilters("status", v)}
          >
            <SelectTrigger className="w-[150px] sm:w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status.all")}</SelectItem>
              <SelectItem value="paid">{t("status.paid")}</SelectItem>
              <SelectItem value="pending">{t("status.pending")}</SelectItem>
              <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentSource}
            onValueChange={(v) => updateFilters("source", v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("sources.all")}</SelectItem>
              <SelectItem value="student_payments">{t("sources.student_payments")}</SelectItem>
              <SelectItem value="teacher_payouts">{t("sources.teacher_payouts")}</SelectItem>
              <SelectItem value="manual_income">{t("sources.manual_income")}</SelectItem>
              <SelectItem value="manual_expenses">{t("sources.manual_expenses")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <div className="shrink-0">
            <FiscalConfigVault
              initialConfig={initialFiscalConfig}
              year={currentYear}
            />
          </div>
          <div className="shrink-0">
            <ExportFinancesVault />
          </div>

          <Link href={"/hub/admin/finances/forecast"} className="shrink-0">
            <Button>Previsões</Button>
          </Link>
          <Link href={"/hub/admin/finances/plans"} className="shrink-0">
            <Button>Pacotes</Button>
          </Link>
          <div className="shrink-0">
            <NewTransactionVault />
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <MetricsCards
        metrics={initialMetrics}
        monthlyBreakdown={initialMonthlyBreakdown}
        currentMonth={currentMonth}
      />

      {/* Gateway Balances Section */}
      <GatewayBalancesCard balances={initialGatewayBalances} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card border-border">
            <div className="p-6 flex flex-row items-center justify-between">
              <h3 className="subtitle">{t("transactions.title")}</h3>
            </div>
            <div className="p-0">
              <TransactionsTable
                key={`${currentMonth}-${currentYear}-${currentStatus}-${currentSource}`}
                transactions={initialTransactions}
              />
            </div>
          </div>
        </div>

        {/* Forecast Section */}
        <div className="flex flex-col gap-6">
          <div className="card border-border">
            <div className="p-6">
              <h3 className="subtitle">{t("forecast.title")}</h3>
            </div>
            <div className="p-6 pt-0 flex flex-col gap-4">
              <ForecastCards
                forecast={initialForecast}
                month={currentMonth}
                year={currentYear}
              />
            </div>
          </div>

          <MEICapacityCard capacity={initialMEICapacity} />
        </div>
      </div>
    </div>
  );
}

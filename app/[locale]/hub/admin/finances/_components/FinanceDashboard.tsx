"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FiscalConfigVault } from "./FiscalConfigVault";
import { ExportFinancesVault } from "./ExportFinancesVault";
import { ForecastCards } from "./ForecastCards";
import { MetricsCards } from "./MetricsCards";
import { FiscalSummaryCard } from "./FiscalSummaryCard";
import { SectionHeader } from "./SectionHeader";
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
import { MoreHorizontal, Settings, Download, TrendingUp, Package } from "lucide-react";

interface FinanceDashboardProps {
  initialMetrics: FinanceMetrics;
  initialForecast: FinanceForecast;
  initialTransactions: UnifiedTransaction[];
  initialMonthlyBreakdown: MonthlyBreakdownItem[];
  initialFiscalConfig: FiscalConfig | null;
  initialMEICapacity: MEICapacity;
  initialGatewayBalances: {
    stripe: { available: number; pending: number; currency: string; status?: "ok" | "not_configured" | "error"; errorMessage?: string };
    abacate: { available: number; pending: number; blocked: number; currency: string; status?: "ok" | "not_configured" | "sandbox" | "error"; errorMessage?: string };
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

  const [fiscalConfigOpen, setFiscalConfigOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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

  const isAllMonths = currentMonth === "all";

  return (
    <div className="flex flex-col gap-8">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-md border border-border shadow-xs md:sticky md:top-12 md:mt-4 md:z-30">
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

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <MoreHorizontal size={18} />
                <span className="hidden md:block">{t("actionsMenu.label")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actionsMenu.label")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFiscalConfigOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                {t("fiscalConfig.trigger")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                <Download className="w-4 h-4 mr-2" />
                {t("export.trigger")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/hub/admin/finances/forecast">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t("actionsMenu.forecastLink")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/hub/admin/finances/plans">
                  <Package className="w-4 h-4 mr-2" />
                  {t("actionsMenu.plansLink")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NewTransactionVault />
        </div>
      </div>

      <FiscalConfigVault
        open={fiscalConfigOpen}
        onOpenChange={setFiscalConfigOpen}
        initialConfig={initialFiscalConfig}
        year={currentYear}
      />
      <ExportFinancesVault open={exportOpen} onOpenChange={setExportOpen} />

      {/* Desempenho (Mensal ou Anual) */}
      <section className="flex flex-col gap-4">
        <SectionHeader title={isAllMonths ? t("sections.performanceAnnual") : t("sections.performanceMonthly")} />
        <MetricsCards
          monthlyBreakdown={initialMonthlyBreakdown}
          currentMonth={currentMonth}
        />
      </section>

      {/* Fiscal (sempre anual, independente do filtro de mês) */}
      <section className="flex flex-col gap-4">
        <SectionHeader title={t("sections.fiscal")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FiscalSummaryCard irpfDue={initialMetrics.fiscal.irpfDue} year={currentYear} />
          <MEICapacityCard capacity={initialMEICapacity} />
        </div>
      </section>

      {/* Saldos em Gateway */}
      <section className="flex flex-col gap-4">
        <SectionHeader title={t("sections.gatewayBalances")} />
        <GatewayBalancesCard balances={initialGatewayBalances} />
      </section>

      {/* Previsto */}
      <section className="flex flex-col gap-4">
        <div className="card border-border">
          <div className="p-6">
            <SectionHeader title={t("forecast.title")} />
          </div>
          <div className="p-6 pt-0">
            <ForecastCards
              forecast={initialForecast}
              month={currentMonth}
              year={currentYear}
            />
          </div>
        </div>
      </section>

      {/* Histórico de Transações */}
      <section className="flex flex-col gap-4">
        <div className="card border-border">
          <div className="p-6">
            <SectionHeader title={t("transactions.title")} />
          </div>
          <div className="p-0">
            <TransactionsTable
              key={`${currentMonth}-${currentYear}-${currentStatus}-${currentSource}`}
              transactions={initialTransactions}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

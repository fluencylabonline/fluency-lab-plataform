import { financeService } from "@/modules/finance/finance.service";
import { getTranslations } from "next-intl/server";
import { FinanceHeader } from "./_components/FinanceHeader";
import { FinanceDashboard } from "./_components/FinanceDashboard";

interface FinancesPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    status?: string;
    source?: string;
  }>;
}

import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export default async function AdminFinancesPage({ searchParams }: FinancesPageProps) {

  const t = await getTranslations("AdminFinances");
  const resolvedParams = await searchParams;

  const now = new Date();
  const monthStr = resolvedParams.month;
  const year = resolvedParams.year ? parseInt(resolvedParams.year) : now.getFullYear();
  const status = (resolvedParams.status || "all") as "paid" | "pending" | "cancelled" | "all";
  const source = (resolvedParams.source || "all") as "all" | "student_payments" | "teacher_payouts" | "manual_income" | "manual_expenses";

  let startDate: Date;
  let endDate: Date;

  if (monthStr === "all") {
    startDate = startOfYear(new Date(year, 0, 1));
    endDate = endOfYear(new Date(year, 0, 1));
  } else {
    const month = monthStr ? parseInt(monthStr) : now.getMonth();
    startDate = startOfMonth(new Date(year, month, 1));
    endDate = endOfMonth(new Date(year, month, 1));
  }

  // Fetch initial data
  const [metrics, forecast, transactions, monthlyBreakdown, fiscalConfig, meiCapacity, gatewayBalances] = await Promise.all([
    financeService.getFiscalMetrics(year),
    financeService.getForecast(year, monthStr === "all" ? undefined : (monthStr ? parseInt(monthStr) : now.getMonth())),
    financeService.getTransactions({
      start: startDate,
      end: endDate,
      status: status === "all" ? undefined : status,
      source: source
    }),
    financeService.getMonthlyBreakdown(year),
    financeService.getFiscalConfig(year),
    financeService.getMEICapacity(year),
    financeService.getGatewayBalances()
  ]);

  return (
    <div className="flex flex-col gap-4">
      <FinanceHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <main className="p-4 md:p-6">
        <FinanceDashboard
          initialMetrics={metrics}
          initialForecast={forecast}
          initialTransactions={transactions}
          initialMonthlyBreakdown={monthlyBreakdown}
          initialFiscalConfig={fiscalConfig ?? null}
          initialMEICapacity={meiCapacity}
          initialGatewayBalances={gatewayBalances}
          currentMonth={monthStr === "all" ? "all" : (monthStr ? parseInt(monthStr) : now.getMonth())}
          currentYear={year}
          currentStatus={status}
          currentSource={source}
        />
      </main>
    </div>
  );
}

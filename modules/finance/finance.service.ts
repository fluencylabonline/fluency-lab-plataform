import { financeRepository } from "./finance.repository";
import { billingService } from "../billing/billing.service";
import { payoutService } from "../payout/payout.service";
import { userService } from "../user/user.service";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, addDays } from "date-fns";
import { CreateTransactionValues, UpsertFiscalConfigValues } from "./finance.schema";

export const financeService = {
  async getFiscalMetrics(year: number) {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 0, 1));

    // 1. Receitas
    const installmentRevenue = await billingService.getTotalRevenue(start, end);
    const extraRevenue = await financeRepository.getTransactionsTotal({
      type: "income",
      status: "paid",
      start,
      end,
    });
    const totalRevenue = installmentRevenue + extraRevenue;

    // 2. Despesas
    const teacherPayouts = await payoutService.getTotalPayouts(start, end);
    const extraExpenses = await financeRepository.getTransactionsTotal({
      type: "expense",
      status: "paid",
      start,
      end,
    });
    const totalExpenses = teacherPayouts + extraExpenses;

    // 3. Despesas Dedutíveis
    const extraDeductible = await financeRepository.getTransactionsTotal({
      type: "expense",
      status: "paid",
      start,
      end,
      deductible: true,
    });
    const totalDeductible = teacherPayouts + extraDeductible;

    // 4. Configuração Fiscal & IRPF
    const config = await financeRepository.getFiscalConfigByYear(year);
    const meiExemptPercentage = config?.meiExemptPercentage ?? 32;

    const exemptProfit = Math.round(totalRevenue * (meiExemptPercentage / 100));
    const taxableProfit = Math.max(0, totalRevenue - totalDeductible - exemptProfit);

    let irpfDue = 0;
    if (config?.irpfRanges) {
      // Cálculo simplificado: busca a faixa onde o lucro tributável se encaixa
      // Nota: Taxable profit aqui é anual. A tabela progressiva pode ser mensal ou anual.
      // Assumimos que as faixas no banco estão configuradas para o período correto (Anual).
      for (const range of config.irpfRanges) {
        if (taxableProfit >= range.min && (range.max === null || taxableProfit <= range.max)) {
          irpfDue = Math.round((taxableProfit * (range.rate / 100)) - range.deduction);
          break;
        }
      }
    }

    return {
      revenue: {
        total: totalRevenue,
        installments: installmentRevenue,
        extra: extraRevenue,
      },
      expenses: {
        total: totalExpenses,
        payouts: teacherPayouts,
        extra: extraExpenses,
        deductible: totalDeductible,
      },
      fiscal: {
        exemptProfit,
        taxableProfit,
        irpfDue,
        meiExemptPercentage,
      },
      netProfit: totalRevenue - totalExpenses,
    };
  },

  async getForecast(year: number, month?: number) {
    let start: Date;
    let end: Date;

    if (month !== undefined && month >= 0 && month <= 11) {
      start = startOfMonth(new Date(year, month, 1));
      end = endOfMonth(new Date(year, month, 1));
    } else {
      start = startOfYear(new Date(year, 0, 1));
      end = endOfYear(new Date(year, 0, 1));
    }

    const [installmentsForecast, pendingExpenses] = await Promise.all([
      billingService.getRevenueForecast(start, end),
      financeRepository.getTransactionsTotal({
        type: "expense",
        status: "pending",
        start,
        end,
      })
    ]);

    return {
      installments: installmentsForecast,
      pendingExpenses,
    };
  },

  async getDetailedForecast(year: number, month?: number) {
    let start: Date;
    let end: Date;

    if (month !== undefined && month >= 0 && month <= 11) {
      start = startOfMonth(new Date(year, month, 1));
      end = endOfMonth(new Date(year, month, 1));
    } else {
      start = startOfYear(new Date(year, 0, 1));
      end = endOfYear(new Date(year, 0, 1));
    }

    const [installments, pendingExpenses] = await Promise.all([
      billingService.getDetailedRevenueForecast(start, end),
      financeRepository.getTransactions({
        type: "expense",
        status: "pending",
        start,
        end,
      })
    ]);

    return {
      installments,
      pendingExpenses,
    };
  },

  async getMonthlyBreakdown(year: number) {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const breakdown = await Promise.all(months.map(async (month) => {
      const start = startOfMonth(new Date(year, month, 1));
      const end = endOfMonth(new Date(year, month, 1));

      const revenue = await billingService.getTotalRevenue(start, end) +
        await financeRepository.getTransactionsTotal({ type: "income", status: "paid", start, end });

      const expenses = await payoutService.getTotalPayouts(start, end) +
        await financeRepository.getTransactionsTotal({ type: "expense", status: "paid", start, end });

      return {
        month: month + 1,
        revenue,
        expenses,
        netProfit: revenue - expenses,
      };
    }));

    return breakdown;
  },

  async createTransaction(userId: string, data: CreateTransactionValues) {
    return financeRepository.createTransaction({
      ...data,
      date: new Date(data.date),
      createdBy: userId,
    });
  },

  async updateTransaction(id: string, data: Partial<CreateTransactionValues>) {
    return financeRepository.updateTransaction(id, {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    });
  },

  async deleteTransaction(id: string) {
    return financeRepository.deleteTransaction(id);
  },

  async getTransactions(filters: { type?: "income" | "expense"; status?: "paid" | "pending" | "cancelled"; start?: Date; end?: Date }) {
    return financeRepository.getTransactions(filters);
  },

  async upsertFiscalConfig(data: UpsertFiscalConfigValues) {
    return financeRepository.upsertFiscalConfig(data);
  },

  async getFiscalConfig(year: number) {
    return financeRepository.getFiscalConfigByYear(year);
  },

  async getCategories() {
    return financeRepository.getUniqueCategories();
  },

  async getMEICapacity(year: number) {
    const now = new Date();
    const isCurrentYear = now.getFullYear() === year;
    const monthsRemaining = isCurrentYear ? (12 - now.getMonth()) : 1;

    // 1. Get metrics, forecast and active plans
    const [metrics, forecast, studentCount, activePlans] = await Promise.all([
      this.getFiscalMetrics(year),
      this.getForecast(year),
      userService.countActiveStudents(),
      billingService.listActivePlans()
    ]);

    const currentRevenue = metrics.revenue.total;
    const pendingRevenue = forecast.installments;
    
    const MEI_LIMIT = 8100000; // R$ 81.000,00
    const committedRevenue = currentRevenue + pendingRevenue;
    const remainingBudget = Math.max(0, MEI_LIMIT - committedRevenue);

    // 2. Calculate Ticket Baseline
    // We use the average of active plans as the baseline because new students will likely 
    // subscribe to one of these. This avoids noise from small test transactions.
    const plansAverage = activePlans.length > 0 
      ? Math.round(activePlans.reduce((acc, p) => acc + (p.price || 0), 0) / activePlans.length)
      : 16500; // Fallback to R$ 165,00

    // For historical comparison, we still calculate the real average of last month
    const lastMonthStart = startOfMonth(addDays(now, -30));
    const lastMonthEnd = endOfMonth(addDays(now, -30));
    const lastMonthRevenue = await billingService.getTotalRevenue(lastMonthStart, lastMonthEnd);
    const historicalAverage = studentCount > 0 && lastMonthRevenue > 0 
      ? Math.round(lastMonthRevenue / studentCount) 
      : 0;

    // Use the HIGHER of plan average or historical average for capacity safety
    const capacityTicket = Math.max(plansAverage, historicalAverage);

    // 3. Calculate Available Slots
    const costPerNewStudent = capacityTicket * monthsRemaining;
    const availableSlots = costPerNewStudent > 0 ? Math.floor(remainingBudget / costPerNewStudent) : 0;
    
    const maxStudents = studentCount + availableSlots;

    return {
      currentStudents: studentCount,
      maxStudents,
      availableSlots,
      revenueLimit: MEI_LIMIT,
      currentRevenue,
      remainingRevenue: remainingBudget,
      averageTicket: historicalAverage || plansAverage // Show historical if available, else plans
    };
  }
};

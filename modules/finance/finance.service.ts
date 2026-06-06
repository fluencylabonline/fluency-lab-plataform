import { financeRepository } from "./finance.repository";
import { billingService } from "../billing/billing.service";
import { payoutService } from "../payout/payout.service";
import { userService } from "../user/user.service";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, addDays } from "date-fns";
import { CreateTransactionValues, UpsertFiscalConfigValues } from "./finance.schema";
import { db } from "@/lib/db";
import { installmentsTable } from "../billing/billing.schema";
import { payoutsTable } from "../payout/payout.schema";
import { transactionsTable } from "./finance.schema";
import { and, between, eq, inArray, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
import { UnifiedTransaction } from "./finance.types";



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

  async getTransactions(filters: { 
    type?: "income" | "expense"; 
    status?: "paid" | "pending" | "cancelled"; 
    start?: Date; 
    end?: Date;
    source?: "all" | "student_payments" | "teacher_payouts" | "manual_income" | "manual_expenses";
  }): Promise<UnifiedTransaction[]> {
    const source = filters.source || "all";
    
    const fetchManual = source === "all" || source === "manual_income" || source === "manual_expenses";
    const fetchInstallments = (source === "all" || source === "student_payments") && (!filters.type || filters.type === "income");
    const fetchPayouts = (source === "all" || source === "teacher_payouts") && (!filters.type || filters.type === "expense");
    
    // Determine type for manual fetch if source is specific
    let manualType = filters.type;
    if (source === "manual_income") manualType = "income";
    if (source === "manual_expenses") manualType = "expense";
    
    const promises = [];
    
    if (fetchManual) {
      let manualWhere = sql`1=1`;
      if (filters.status) {
        manualWhere = and(manualWhere, eq(transactionsTable.status, filters.status))!;
      }
      if (filters.start && filters.end) {
        manualWhere = and(manualWhere, between(transactionsTable.date, filters.start, filters.end))!;
      }
      if (manualType) {
        manualWhere = and(manualWhere, eq(transactionsTable.type, manualType))!;
      }
      promises.push(
        db.query.transactionsTable.findMany({
          where: manualWhere,
          orderBy: (t, { desc }) => [desc(t.date)],
        }).then(res => res.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          date: tx.date,
          description: tx.description || "",
          category: tx.category || "Outros",
          method: tx.method,
          deductible: tx.deductible,
          status: tx.status,
          attachmentUrl: tx.attachmentUrl,
          source: "manual" as const,
        })))
      );
    } else {
      promises.push(Promise.resolve([]));
    }
    
    if (fetchInstallments) {
      let installmentWhere = sql`1=1`;
      if (filters.status) {
        const dbStatus = filters.status === "pending" ? "pending" : (filters.status === "paid" ? "paid" : "cancelled");
        const dateField = dbStatus === "paid" ? installmentsTable.paidAt : installmentsTable.dueDate;
        
        if (filters.status === "pending") {
          installmentWhere = and(
            installmentWhere,
            inArray(installmentsTable.status, ["pending", "overdue"])
          )!;
        } else {
          installmentWhere = and(
            installmentWhere,
            eq(installmentsTable.status, dbStatus)
          )!;
        }
        
        if (filters.start && filters.end) {
          installmentWhere = and(
            installmentWhere,
            between(dateField, filters.start, filters.end)
          )!;
        }
      } else {
        if (filters.start && filters.end) {
          installmentWhere = and(
            installmentWhere,
            sql`COALESCE(${installmentsTable.paidAt}, ${installmentsTable.dueDate}) BETWEEN ${filters.start} AND ${filters.end}`
          )!;
        }
      }
      promises.push(
        db.query.installmentsTable.findMany({
          where: installmentWhere,
          with: {
            subscription: {
              with: {
                student: true,
                plan: true,
              },
            },
          },
        }).then(res => res.map(inst => {
          const studentName = inst.subscription?.student?.name || "Aluno";
          const planName = inst.subscription?.plan?.name || "Plano";
          return {
            id: inst.id,
            type: "income" as const,
            amount: inst.amount,
            currency: inst.subscription?.plan?.currency || "BRL",
            date: inst.paidAt || inst.dueDate,
            description: `Mensalidade: ${studentName} (${planName} - ${inst.orderIndex}/${inst.subscription?.plan?.durationMonths || 1})`,
            category: "Mensalidade",
            method: inst.stripePaymentIntentId ? "credit_card" : "pix",
            deductible: false,
            status: inst.status === "paid" ? "paid" as const : (inst.status === "cancelled" ? "cancelled" as const : "pending" as const),
            attachmentUrl: null,
            source: "student_payment" as const,
          };
        }))
      );
    } else {
      promises.push(Promise.resolve([]));
    }
    
    if (fetchPayouts) {
      let payoutWhere = sql`1=1`;
      if (filters.status) {
        if (filters.status === "paid") {
          payoutWhere = and(payoutWhere, eq(payoutsTable.status, "completed"))!;
        } else if (filters.status === "pending") {
          payoutWhere = and(payoutWhere, eq(payoutsTable.status, "pending"))!;
        } else if (filters.status === "cancelled") {
          payoutWhere = and(payoutWhere, eq(payoutsTable.status, "failed"))!;
        }
      }
      if (filters.start && filters.end) {
        payoutWhere = and(payoutWhere, between(payoutsTable.createdAt, filters.start, filters.end))!;
      }
      promises.push(
        db.query.payoutsTable.findMany({
          where: payoutWhere,
          with: {
            teacher: true,
          },
        }).then(res => res.map(p => {
          const teacherName = p.teacher?.name || "Professor";
          return {
            id: p.id,
            type: "expense" as const,
            amount: p.amount,
            currency: "BRL",
            date: p.createdAt,
            description: `Repasse: ${teacherName} (${p.month + 1}/${p.year})`,
            category: "Repasse Professor",
            method: "pix",
            deductible: true,
            status: p.status === "completed" ? "paid" as const : (p.status === "failed" ? "cancelled" as const : "pending" as const),
            attachmentUrl: null,
            source: "teacher_payout" as const,
          };
        }))
      );
    } else {
      promises.push(Promise.resolve([]));
    }
    
    const [manualMapped, installmentsMapped, payoutsMapped] = await Promise.all(promises);
    
    const merged = [...manualMapped, ...installmentsMapped, ...payoutsMapped];
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return merged;
  },

  async getGatewayBalances() {
    let stripeAvailable = 0;
    let stripePending = 0;
    let abacateAvailable = 0;
    let abacatePending = 0;
    let abacateBlocked = 0;

    // Fetch Stripe Balance
    if (env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY !== "mock_secret_key") {
      try {
        const balance = await stripe.balance.retrieve();
        const usdAvailable = balance.available.find((b) => b.currency === "usd")?.amount ?? 0;
        const usdPending = balance.pending.find((b) => b.currency === "usd")?.amount ?? 0;
        stripeAvailable = usdAvailable;
        stripePending = usdPending;
      } catch (error) {
        console.error("[financeService.getGatewayBalances] Stripe error:", error);
      }
    }

    // Fetch AbacatePay Balance
    if (env.ABACATEPAY_API_KEY) {
      try {
        const res = await fetch("https://api.abacatepay.com/v2/store/get", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.ABACATEPAY_API_KEY}`,
          },
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.balance) {
            abacateAvailable = result.data.balance.available ?? 0;
            abacatePending = result.data.balance.pending ?? 0;
            abacateBlocked = result.data.balance.blocked ?? 0;
          }
        } else {
          console.error(`[financeService.getGatewayBalances] AbacatePay error HTTP ${res.status}`);
        }
      } catch (error) {
        console.error("[financeService.getGatewayBalances] AbacatePay error:", error);
      }
    }

    return {
      stripe: {
        available: stripeAvailable,
        pending: stripePending,
        currency: "USD",
      },
      abacate: {
        available: abacateAvailable,
        pending: abacatePending,
        blocked: abacateBlocked,
        currency: "BRL",
      },
    };
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

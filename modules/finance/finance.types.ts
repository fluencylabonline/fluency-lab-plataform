import { Transaction } from "./finance.schema";
import { Installment, Subscription, Plan } from "../billing/billing.schema";
import { User } from "../user/user.schema";

export interface FinanceMetrics {
  revenue: {
    total: number;
    installments: number;
    extra: number;
  };
  expenses: {
    total: number;
    payouts: number;
    extra: number;
    deductible: number;
  };
  fiscal: {
    exemptProfit: number;
    taxableProfit: number;
    irpfDue: number;
    meiExemptPercentage: number;
  };
  netProfit: number;
}

export interface FinanceForecast {
  installments: number;
  pendingExpenses: number;
}

export interface MonthlyBreakdownItem {
  month: number;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export type InstallmentWithDetails = Installment & {
  subscription: (Subscription & {
    student: User | null;
    plan: Plan | null;
  }) | null;
};

export interface DetailedForecast {
  installments: InstallmentWithDetails[];
  pendingExpenses: Transaction[];
}

export interface MEICapacity {
  currentStudents: number;
  maxStudents: number;
  availableSlots: number;
  revenueLimit: number;
  currentRevenue: number;
  remainingRevenue: number;
  averageTicket: number;
}

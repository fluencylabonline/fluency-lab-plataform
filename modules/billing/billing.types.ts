import { Plan, Subscription, Installment } from "./billing.schema";

export type { Plan, Subscription, Installment };

export type SubscriptionWithPlan = Subscription & {
  plan: Plan | null;
};

export type InstallmentWithDetails = Installment;

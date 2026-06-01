import { describe, it, expect } from "vitest";
import { endOfMonth, addDays } from "date-fns";

// This is the exact pro-rata logic implemented in both billing.service.ts and StepPayment.tsx
function calculateBillingProRata(params: {
  classesStartDate: Date | null;
  now: Date;
  dueDay: number;
  price: number;
}) {
  const { classesStartDate, now, price } = params;

  // Always use classesStartDate if available
  const billingBaseDate = classesStartDate ? classesStartDate : now;

  const currentDay = billingBaseDate.getDate();

  let remainingClasses = 4;
  let isProRata = false;

  if (currentDay >= 20) {
    remainingClasses = 1;
    isProRata = true;
  } else if (currentDay >= 15) {
    remainingClasses = 2;
    isProRata = true;
  } else if (currentDay >= 6) {
    remainingClasses = 3;
    isProRata = true;
  } else {
    remainingClasses = 4;
    isProRata = false;
  }

  const firstInstallmentAmount = Math.round((price / 4) * remainingClasses);

  let firstInstallmentDueDate: Date;
  if (currentDay >= 20) {
    firstInstallmentDueDate = endOfMonth(billingBaseDate);
  } else {
    firstInstallmentDueDate = addDays(billingBaseDate, 10);
  }

  return {
    amount: firstInstallmentAmount,
    isProRata,
    billingBaseDate,
    currentDay,
    firstInstallmentDueDate,
  };
}

describe("Billing Pro-Rata and Invoicing Logic (Timezone-Safe)", () => {
  it("SHOULD charge full price when classes start date is on the 1st of the month (day 1-5 range)", () => {
    // User Scenario:
    // Today: 25/05/2026
    // Classes start: 01/06/2026
    // Plan price: R$ 420.00 (42000 cents)
    // Due Day chosen: 10
    
    // Construct local Date to be safe
    const today = new Date(2026, 4, 25, 12, 0, 0); // May 25, 2026
    const classesStart = new Date(2026, 5, 1, 12, 0, 0); // June 1, 2026
    const price = 42000;
    const dueDay = 10;

    const result = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay,
      price,
    });

    expect(result.isProRata).toBe(false);
    expect(result.amount).toBe(42000); // Full price
    expect(result.currentDay).toBe(1); // 1st of June
    expect(result.firstInstallmentDueDate.getDate()).toBe(11); // June 1 + 10 days = June 11
  });

  it("SHOULD charge 50% price when classes start date is on the 15th (day 15-19 range)", () => {
    // Pro-rata Scenario:
    // Today: 25/05/2026
    // Classes start: 15/06/2026
    // Plan price: R$ 300.00 (30000 cents)
    // Due Day chosen: 10
    const today = new Date(2026, 4, 25, 12, 0, 0); // May 25, 2026
    const classesStart = new Date(2026, 5, 15, 12, 0, 0); // June 15, 2026
    const price = 30000;
    const dueDay = 10;

    const result = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay,
      price,
    });

    expect(result.isProRata).toBe(true);
    expect(result.amount).toBe(15000); // Pro-rata price: 50% = R$ 150,00
    expect(result.currentDay).toBe(15);
    expect(result.firstInstallmentDueDate.getDate()).toBe(25); // June 15 + 10 days = June 25
  });

  it("USER SCENARIO: Classes start: 15/05/2026, Onboarding/Signature: 13/05/2026", () => {
    const today = new Date(2026, 4, 13, 12, 0, 0); // May 13, 2026
    const classesStart = new Date(2026, 4, 15, 12, 0, 0); // May 15, 2026
    const price = 31000; // R$ 310,00

    // SUB-CASE A: Student chooses dueDay = 10
    // Starts on 15 -> lost 2 classes out of 4, so pays 2/4 = 50%
    const caseA = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay: 10,
      price,
    });
    expect(caseA.isProRata).toBe(true);
    expect(caseA.amount).toBe(15500); // R$ 155,00
    expect(caseA.currentDay).toBe(15);
    expect(caseA.firstInstallmentDueDate.getDate()).toBe(25); // May 25

    // SUB-CASE B: Student chooses dueDay = 15
    // Still starts on 15, so calculations are identical! First payment is decoupled from dueDay selection.
    const caseB = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay: 15,
      price,
    });
    expect(caseB.isProRata).toBe(true);
    expect(caseB.amount).toBe(15500); // R$ 155,00
    expect(caseB.currentDay).toBe(15);
    expect(caseB.firstInstallmentDueDate.getDate()).toBe(25);
  });

  it("SHOULD charge 75% when classes start date is day 6-14 range", () => {
    // Immediate Start Scenario:
    // Today: 05/06/2026
    // Classes start: 06/06/2026
    // Plan price: R$ 500.00 (50000 cents)
    // Due Day chosen: 10
    const today = new Date(2026, 5, 5, 12, 0, 0); // June 5, 2026
    const classesStart = new Date(2026, 5, 6, 12, 0, 0); 
    const price = 50000;
    const dueDay = 10;

    const result = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay,
      price,
    });

    expect(result.isProRata).toBe(true);
    expect(result.amount).toBe(37500); // 75% of 500.00 = R$ 375.00
    expect(result.firstInstallmentDueDate.getDate()).toBe(16); // June 6 + 10 days = June 16
  });

  it("SHOULD charge 25% and vencimento be the end of the month when classes start date is day 20 or later", () => {
    // Late Month Start Scenario:
    // Today: 20/06/2026
    // Classes start: 20/06/2026
    // Plan price: R$ 300.00 (30000 cents)
    // Due Day chosen: 10
    const today = new Date(2026, 5, 20, 12, 0, 0); // June 20, 2026
    const classesStart = new Date(2026, 5, 20, 12, 0, 0); 
    const price = 30000;
    const dueDay = 10;

    const result = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay,
      price,
    });

    expect(result.isProRata).toBe(true);
    expect(result.amount).toBe(7500); // 25% of 300.00 = R$ 75.00
    expect(result.currentDay).toBe(20);
    // Since start day >= 20, firstInstallmentDueDate is last day of month (June has 30 days)
    expect(result.firstInstallmentDueDate.getDate()).toBe(30);
  });
});

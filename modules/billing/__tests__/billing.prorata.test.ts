import { describe, it, expect } from "vitest";
import { getDaysInMonth } from "date-fns";

// This is the exact pro-rata logic implemented in both billing.service.ts and StepPayment.tsx
function calculateBillingProRata(params: {
  classesStartDate: Date | null;
  now: Date;
  dueDay: number;
  price: number;
}) {
  const { classesStartDate, now, dueDay, price } = params;

  // 1. Use classesStartDate for pro-rata calculation if it's in the future
  const billingBaseDate = classesStartDate && classesStartDate > now
    ? classesStartDate
    : now;

  const currentDay = billingBaseDate.getDate();
  const totalDaysInMonth = getDaysInMonth(billingBaseDate);

  let firstInstallmentAmount: number;
  let isProRata = false;

  if (currentDay > dueDay) {
    // Pro-rata logic: charge for remaining days of the month
    const daysRemaining = totalDaysInMonth - currentDay + 1; // Including today
    firstInstallmentAmount = Math.round((price / totalDaysInMonth) * daysRemaining);
    isProRata = true;
  } else {
    // Full charge logic: due in 7 days
    firstInstallmentAmount = price;
  }

  return {
    amount: firstInstallmentAmount,
    isProRata,
    billingBaseDate,
    currentDay,
    totalDaysInMonth,
  };
}

describe("Billing Pro-Rata and Invoicing Logic (Timezone-Safe)", () => {
  it("SHOULD charge full price when classes start date is in the future on the 1st of the month", () => {
    // User Scenario:
    // Today: 25/05/2026
    // Classes start: 01/06/2026
    // Plan price: R$ 420.00 (42000 cents)
    // Due Day chosen: 10
    
    // Using 12:00:00 (midday) to prevent timezone shifts across midnight boundaries
    const today = new Date(Date.UTC(2026, 4, 25, 12, 0, 0)); // May 25, 2026
    const classesStart = new Date(Date.UTC(2026, 5, 1, 12, 0, 0)); // June 1, 2026
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
    expect(result.totalDaysInMonth).toBe(30); // June has 30 days
  });

  it("SHOULD charge pro-rata when classes start date is in the future and after the chosen due day", () => {
    // Pro-rata Scenario:
    // Today: 25/05/2026
    // Classes start: 15/06/2026
    // Plan price: R$ 300.00 (30000 cents)
    // Due Day chosen: 10
    const today = new Date(Date.UTC(2026, 4, 25, 12, 0, 0)); // May 25, 2026
    const classesStart = new Date(Date.UTC(2026, 5, 15, 12, 0, 0)); // June 15, 2026
    const price = 30000;
    const dueDay = 10;

    const result = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay,
      price,
    });

    // June has 30 days. Classes start on June 15.
    // Days remaining: 30 - 15 + 1 = 16 days.
    // Math: Math.round((30000 / 30) * 16) = 16000 cents.
    expect(result.isProRata).toBe(true);
    expect(result.amount).toBe(16000); // Pro-rata price: R$ 160,00
    expect(result.currentDay).toBe(15);
    expect(result.totalDaysInMonth).toBe(30);
  });

  // --- NEW USER SCENARIO ---
  it("USER SCENARIO: Classes start: 15/05/2026, Onboarding/Signature: 13/05/2026", () => {
    const today = new Date(Date.UTC(2026, 4, 13, 12, 0, 0)); // May 13, 2026
    const classesStart = new Date(Date.UTC(2026, 4, 15, 12, 0, 0)); // May 15, 2026
    const price = 31000; // R$ 310,00

    // SUB-CASE A: Student chooses dueDay = 10
    // Since 15 (currentDay) > 10 (dueDay), it MUST apply pro-rata!
    // May has 31 days. Remaining days starting from 15th: 31 - 15 + 1 = 17 days.
    // Math: Math.round((31000 / 31) * 17) = 17000 cents (R$ 170,00).
    const caseA = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay: 10,
      price,
    });
    expect(caseA.isProRata).toBe(true);
    expect(caseA.amount).toBe(17000); // R$ 170,00
    expect(caseA.currentDay).toBe(15);
    expect(caseA.totalDaysInMonth).toBe(31);

    // SUB-CASE B: Student chooses dueDay = 15
    // Since 15 (currentDay) > 15 (dueDay) is FALSE, it MUST charge full price (valor cheio)!
    const caseB = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay: 15,
      price,
    });
    expect(caseB.isProRata).toBe(false);
    expect(caseB.amount).toBe(31000); // Full price: R$ 310,00
    expect(caseB.currentDay).toBe(15);
  });

  it("SHOULD charge full price when classes start date is in the past or today, and today <= dueDay", () => {
    // Immediate Start Scenario:
    // Today: 05/06/2026
    // Classes start: 05/06/2026 (or null/immediate)
    // Plan price: R$ 500.00 (50000 cents)
    // Due Day chosen: 10
    const today = new Date(Date.UTC(2026, 5, 5, 12, 0, 0)); // June 5, 2026
    const classesStart = new Date(Date.UTC(2026, 5, 5, 12, 0, 0)); 
    const price = 50000;
    const dueDay = 10;

    const result = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay,
      price,
    });

    expect(result.isProRata).toBe(false);
    expect(result.amount).toBe(50000); // Full price
  });

  it("SHOULD charge pro-rata when classes start date is in the past, and today > dueDay", () => {
    // Late Month Start Scenario:
    // Today: 20/06/2026
    // Classes start: 20/06/2026
    // Plan price: R$ 300.00 (30000 cents)
    // Due Day chosen: 10
    const today = new Date(Date.UTC(2026, 5, 20, 12, 0, 0)); // June 20, 2026
    const classesStart = new Date(Date.UTC(2026, 5, 20, 12, 0, 0)); 
    const price = 30000;
    const dueDay = 10;

    const result = calculateBillingProRata({
      classesStartDate: classesStart,
      now: today,
      dueDay,
      price,
    });

    // June has 30 days. Today is June 20.
    // Days remaining: 30 - 20 + 1 = 11 days.
    // Math: Math.round((30000 / 30) * 11) = 11000 cents.
    expect(result.isProRata).toBe(true);
    expect(result.amount).toBe(11000); // R$ 110,00
  });
});

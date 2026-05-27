/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mock variables to be accessible in vi.mock
const { mockUpdate, mockInsert, mockQuery } = vi.hoisted(() => {
  const setFn = vi.fn();
  const whereFn = vi.fn();
  const returningFn = vi.fn().mockReturnValue([{}]);
  
  setFn.mockReturnValue({
    where: whereFn,
    returning: returningFn,
  });
  whereFn.mockReturnValue({
    returning: returningFn,
  });

  return {
    mockSet: setFn,
    mockWhere: whereFn,
    mockReturning: returningFn,
    mockUpdate: vi.fn().mockImplementation(() => ({
      set: setFn,
      where: whereFn,
      returning: returningFn,
    })),
    mockInsert: vi.fn().mockReturnValue({
      returning: returningFn,
    }),
    mockQuery: {
      subscriptionsTable: {
        findMany: vi.fn(),
      },
      installmentsTable: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    transaction: (cb: any) => cb({
      update: mockUpdate,
      query: mockQuery,
    }),
    update: mockUpdate,
    insert: mockInsert,
    query: mockQuery,
  },
}));

vi.mock("../billing.repository", () => ({
  billingRepository: {
    findActiveSubscriptionByStudent: vi.fn(),
    findPlanById: vi.fn(),
    updatePlan: vi.fn(),
    updateSubscription: vi.fn(),
  },
}));

vi.mock("../../user/user.service", () => ({
  userService: {
    getUser: vi.fn().mockResolvedValue({ id: "student-1", name: "Matheus", email: "matheus@test.com" }),
    updateUser: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../communication/communication.service", () => ({
  communicationService: {
    sendPlanPriceAdjustmentEmail: vi.fn().mockResolvedValue({}),
    sendPlanChangedEmail: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/lib/abacate-pay", () => ({
  abacate: {
    products: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { billingService } from "../billing.service";
import { billingRepository } from "../billing.repository";
import { userService } from "../../user/user.service";
import { communicationService } from "../../communication/communication.service";
import { installmentsTable, subscriptionsTable } from "../billing.schema";

describe("Billing Service - Plan Modification Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("changeStudentPlan", () => {
    it("SHOULD update subscription plan and future unpaid installments", async () => {
      const studentId = "student-1";
      const newPlanId = "new-plan-uuid";

      const mockActiveSub = {
        id: "sub-1",
        planId: "old-plan-uuid",
        plan: { name: "Plano Anterior" },
      };

      const mockNewPlan = {
        id: newPlanId,
        name: "Plano Novo",
        price: 50000, // R$ 500,00
        classesPerWeek: 3,
      };

      const mockFutureInstallments = [
        { id: "inst-1", status: "pending", amount: 40000 },
        { id: "inst-2", status: "overdue", amount: 40000 },
      ];

      (billingRepository.findActiveSubscriptionByStudent as any).mockResolvedValue(mockActiveSub);
      (billingRepository.findPlanById as any).mockResolvedValue(mockNewPlan);
      (mockQuery.installmentsTable.findMany as any).mockResolvedValue(mockFutureInstallments);

      await billingService.changeStudentPlan(studentId, newPlanId);

      // Verify subscription updated
      expect(mockUpdate).toHaveBeenCalledWith(subscriptionsTable);
      // Verify user's assignedPlanId updated
      expect(userService.updateUser).toHaveBeenCalledWith(studentId, { assignedPlanId: newPlanId });
      // Verify installments queried
      expect(mockQuery.installmentsTable.findMany).toHaveBeenCalled();
      // Verify email sent
      expect(communicationService.sendPlanChangedEmail).toHaveBeenCalledWith(
        "matheus@test.com",
        "Matheus",
        {
          oldPlanName: "Plano Anterior",
          newPlanName: "Plano Novo",
          newAmount: 50000,
          classesPerWeek: 3,
        }
      );
    });

    it("SHOULD throw error if student has no active subscription", async () => {
      (billingRepository.findActiveSubscriptionByStudent as any).mockResolvedValue(null);

      await expect(
        billingService.changeStudentPlan("student-1", "new-plan-uuid")
      ).rejects.toThrow("O estudante não possui uma assinatura ativa");
    });
  });

  describe("updatePlan - Global Reajuste", () => {
    it("SHOULD update all active subscriptions future installments and send notification when price changes", async () => {
      const planId = "plan-1";
      const oldPlan = {
        id: planId,
        name: "Plano Inglês",
        price: 40000, // R$ 400
        abacatePayProductId: "prod-1",
      };

      const updateData = {
        price: 45000, // R$ 450
        effectiveDate: "2026-06-01",
      };

      const mockActiveSubs = [
        { id: "sub-1", studentId: "stud-1", planId, student: { email: "stud1@test.com", name: "Aluno 1" } },
        { id: "sub-2", studentId: "stud-2", planId, student: { email: "stud2@test.com", name: "Aluno 2" } },
      ];

      const mockFutureInstallments = [
        { id: "inst-1", dueDate: new Date("2026-06-05"), amount: 40000, status: "pending" },
      ];

      (billingRepository.findPlanById as any).mockResolvedValue(oldPlan);
      (mockQuery.subscriptionsTable.findMany as any).mockResolvedValue(mockActiveSubs);
      (mockQuery.installmentsTable.findMany as any).mockResolvedValue(mockFutureInstallments);

      await billingService.updatePlan(planId, updateData);

      // Verify global update ran
      expect(mockQuery.subscriptionsTable.findMany).toHaveBeenCalled();
      expect(mockQuery.installmentsTable.findMany).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(installmentsTable);
      expect(communicationService.sendPlanPriceAdjustmentEmail).toHaveBeenCalledTimes(2);
      expect(communicationService.sendPlanPriceAdjustmentEmail).toHaveBeenCalledWith(
        "stud1@test.com",
        "Aluno 1",
        "Plano Inglês",
        45000
      );
    });
  });
});

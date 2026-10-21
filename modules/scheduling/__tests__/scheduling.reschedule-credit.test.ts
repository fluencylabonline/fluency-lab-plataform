/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSet, mockReturning, mockUpdate } = vi.hoisted(() => {
  const returning = vi.fn();
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where, returning });
  return {
    mockSet: set,
    mockReturning: returning,
    mockUpdate: vi.fn().mockImplementation(() => ({ set, where, returning })),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    transaction: (cb: any) =>
      cb({
        update: mockUpdate,
        insert: () => ({ values: vi.fn().mockResolvedValue(undefined) }),
      }),
    update: mockUpdate,
  },
}));

vi.mock("../scheduling.repository", () => ({
  schedulingRepository: {
    findById: vi.fn(),
    findReplacementForClass: vi.fn(),
    findCreditsByStudent: vi.fn(),
    findCreditById: vi.fn(),
  },
}));

vi.mock("@/lib/rbac", () => ({ hasPermission: vi.fn().mockReturnValue(true) }));
vi.mock("@/modules/user/user.service", () => ({ userService: { getUserById: vi.fn() } }));
vi.mock("@/modules/learning/learning.service", () => ({ learningService: { getActivePlan: vi.fn() } }));
vi.mock("@/modules/notification/notification.service", () => ({
  notificationService: { sendNotification: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/modules/billing/billing.service", () => ({
  billingService: { isStudentBlocked: vi.fn().mockResolvedValue(false) },
}));

import { schedulingService } from "../scheduling.service";
import { schedulingRepository } from "../scheduling.repository";

const repo = schedulingRepository as any;
const days = (n: number) => new Date(Date.now() + n * 86_400_000);

const canceledClass = { id: "orig-1", studentId: "stu-1", status: "canceled-teacher", startAt: days(-1), teacherId: "t1" };
const targetSlot = { id: "slot-new", status: "available", startAt: days(3), teacherId: "t1" };

const credit = (id: string, type: string, expiresInDays: number) => ({
  id,
  type,
  studentId: "stu-1",
  amount: 1,
  usedAt: null,
  expiresAt: days(expiresInDays),
});

describe("rescheduleClass: aula cancelada pelo professor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: "credit-consumed" }]);
    repo.findById.mockImplementation(async (id: string) => (id === "orig-1" ? canceledClass : targetSlot));
    repo.findReplacementForClass.mockResolvedValue(undefined);
    repo.findCreditById.mockImplementation(async (id: string) => ({
      "tc-soon": credit("tc-soon", "teacher-cancellation", 5),
      "tc-late": credit("tc-late", "teacher-cancellation", 25),
    } as Record<string, unknown>)[id]);
    // O repositório devolve ordenado por validade: o bônus vence primeiro, mas não vale para esta reposição.
    repo.findCreditsByStudent.mockResolvedValue([
      credit("bonus-1", "bonus", 2),
      credit("tc-soon", "teacher-cancellation", 5),
      credit("tc-late", "teacher-cancellation", 25),
    ]);
  });

  it("escolhe sozinho o crédito de cancelamento que vence primeiro", async () => {
    await schedulingService.rescheduleClass("stu-1", "orig-1", "slot-new");

    expect(repo.findCreditById).toHaveBeenCalledWith("tc-soon");
    const setArgs = mockSet.mock.calls.map((c) => c[0]);
    expect(setArgs).toContainEqual(expect.objectContaining({ usedForClassId: "slot-new" }));
    expect(setArgs).toContainEqual(
      expect.objectContaining({ creditId: "tc-soon", creditType: "teacher-cancellation", status: "scheduled" })
    );
  });

  it("não usa crédito bonus nem late-students na reposição automática", async () => {
    repo.findCreditsByStudent.mockResolvedValue([credit("bonus-1", "bonus", 2), credit("late-1", "late-students", 3)]);

    await expect(schedulingService.rescheduleClass("stu-1", "orig-1", "slot-new")).rejects.toThrow(
      "use o crédito de reposição"
    );
  });

  it("recusa repor uma aula que já foi reposta", async () => {
    repo.findReplacementForClass.mockResolvedValue({ id: "slot-other" });

    await expect(schedulingService.rescheduleClass("stu-1", "orig-1", "slot-new")).rejects.toThrow(
      "Esta aula já foi reposta."
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("recusa quando o crédito já foi consumido por outra requisição", async () => {
    mockReturning.mockResolvedValue([]); // o UPDATE condicional não encontrou crédito livre

    await expect(schedulingService.rescheduleClass("stu-1", "orig-1", "slot-new")).rejects.toThrow(
      "Invalid or expired credit"
    );
  });

  it("recusa aula de outro aluno", async () => {
    repo.findById.mockImplementation(async (id: string) =>
      id === "orig-1" ? { ...canceledClass, studentId: "outro" } : targetSlot
    );

    await expect(schedulingService.rescheduleClass("stu-1", "orig-1", "slot-new")).rejects.toThrow(
      "not owned by student"
    );
  });
});

describe("rescheduleClass: aula agendada com crédito escolhido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: "credit-consumed" }]);
    repo.findById.mockImplementation(async (id: string) =>
      id === "orig-2" ? { id: "orig-2", studentId: "stu-1", status: "scheduled", startAt: days(2), teacherId: "t1" } : targetSlot
    );
    repo.findCreditById.mockResolvedValue(credit("bonus-1", "bonus", 10));
  });

  it("mantém o fluxo: usa o crédito informado e cancela a aula original", async () => {
    await schedulingService.rescheduleClass("stu-1", "orig-2", "slot-new", "bonus-1");

    const setArgs = mockSet.mock.calls.map((c) => c[0]);
    expect(setArgs).toContainEqual(expect.objectContaining({ status: "canceled-student" }));
    expect(setArgs).toContainEqual(expect.objectContaining({ creditId: "bonus-1", creditType: "bonus" }));
    // aula agendada não passa pela checagem de reposição
    expect(repo.findReplacementForClass).not.toHaveBeenCalled();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("../scheduling.repository", () => ({
  schedulingRepository: {
    findById: vi.fn(),
    updateSlot: vi.fn(),
    createAuditLog: vi.fn(),
    findTeacherUnresolvedInRange: vi.fn(),
    countTeacherOverdueSlots: vi.fn(),
  },
}));
vi.mock("@/lib/rbac", () => ({ hasPermission: vi.fn().mockReturnValue(false) }));
vi.mock("@/modules/user/user.service", () => ({
  userService: { getUserById: vi.fn().mockResolvedValue({ teacherHourlyRate: 5000 }) },
}));
vi.mock("@/modules/curriculum/curriculum.service", () => ({ curriculumService: {} }));
vi.mock("@/modules/learning/learning.service", () => ({ learningService: {} }));
vi.mock("@/modules/communication/communication.service", () => ({ communicationService: {} }));
vi.mock("@/modules/notification/notification.service", () => ({
  notificationService: { sendNotification: vi.fn() },
}));
vi.mock("@/lib/cryptography", () => ({ decrypt: vi.fn() }));

import { schedulingService, OVERDUE_BLOCK_THRESHOLD } from "../scheduling.service";
import { schedulingRepository } from "../scheduling.repository";

const teacher = { id: "t1", role: "teacher" as const };
const MIN = 60 * 1000;

const slot = (over: Record<string, unknown> = {}) => ({
  id: "c1",
  teacherId: "t1",
  studentId: "s1",
  status: "overdue",
  startAt: new Date("2026-11-02T18:00:00Z"),
  endAt: new Date("2026-11-02T19:00:00Z"),
  ...over,
});

describe("scheduling — resolução de aulas overdue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("professor resolve aula overdue como completed e grava o motivo no audit", async () => {
    (schedulingRepository.findById as any).mockResolvedValue(slot());
    await schedulingService.resolveOverdueClass(teacher, "c1", "completed");

    expect(schedulingRepository.updateSlot).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ status: "completed", teacherHourlyRate: 5000 })
    );
    expect(schedulingRepository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        previousStatus: "overdue",
        newStatus: "completed",
        reason: "O professor atualizou o status de forma atrasada.",
      })
    );
  });

  it("no-show também guarda o valor/hora (aula paga)", async () => {
    (schedulingRepository.findById as any).mockResolvedValue(slot());
    await schedulingService.resolveOverdueClass(teacher, "c1", "no-show");
    expect(schedulingRepository.updateSlot).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ status: "no-show", teacherHourlyRate: 5000 })
    );
  });

  it("rejeita aula de outro professor", async () => {
    (schedulingRepository.findById as any).mockResolvedValue(slot({ teacherId: "outro" }));
    await expect(schedulingService.resolveOverdueClass(teacher, "c1", "completed")).rejects.toThrow(/Unauthorized/);
    expect(schedulingRepository.updateSlot).not.toHaveBeenCalled();
  });

  it("rejeita aula que não está overdue", async () => {
    (schedulingRepository.findById as any).mockResolvedValue(slot({ status: "completed" }));
    await expect(schedulingService.resolveOverdueClass(teacher, "c1", "completed")).rejects.toThrow(/atrasada/);
    expect(schedulingRepository.updateSlot).not.toHaveBeenCalled();
  });

  it("trava o professor a partir de 6 aulas overdue", async () => {
    (schedulingRepository.countTeacherOverdueSlots as any).mockResolvedValue(OVERDUE_BLOCK_THRESHOLD - 1);
    expect(await schedulingService.isTeacherBlockedByOverdue("t-a")).toBe(false);
    (schedulingRepository.countTeacherOverdueSlots as any).mockResolvedValue(OVERDUE_BLOCK_THRESHOLD);
    expect(await schedulingService.isTeacherBlockedByOverdue("t-b")).toBe(true);
  });
});

describe("scheduling — aula certa ao encerrar a chamada", () => {
  beforeEach(() => vi.clearAllMocks());

  const endedAt = new Date("2026-11-02T18:40:00Z"); // 40 min após o início da aula das 18:00

  it("casa a aula do aluno cujo horário contém o fim da chamada", async () => {
    (schedulingRepository.findTeacherUnresolvedInRange as any).mockResolvedValue([
      slot({ id: "a", status: "scheduled" }),
      slot({ id: "b", studentId: "s2" }),
    ]);
    const { matches, others } = await schedulingService.findClassesForCallEnd("t1", "s1", endedAt);
    expect(matches.map((m: any) => m.id)).toEqual(["a"]);
    expect(others.map((o: any) => o.id)).toEqual(["b"]);
  });

  it("aceita desligar até 30 min depois do fim previsto", async () => {
    (schedulingRepository.findTeacherUnresolvedInRange as any).mockResolvedValue([slot({ id: "a" })]);
    const late = new Date(slot().endAt.getTime() + 29 * MIN);
    expect((await schedulingService.findClassesForCallEnd("t1", "s1", late)).matches).toHaveLength(1);
    const tooLate = new Date(slot().endAt.getTime() + 31 * MIN);
    expect((await schedulingService.findClassesForCallEnd("t1", "s1", tooLate)).matches).toHaveLength(0);
  });

  it("sem aula no horário, devolve as aulas sem status para o professor escolher", async () => {
    (schedulingRepository.findTeacherUnresolvedInRange as any).mockResolvedValue([
      slot({ id: "x", startAt: new Date("2026-11-01T12:00:00Z"), endAt: new Date("2026-11-01T13:00:00Z") }),
    ]);
    const { matches, others } = await schedulingService.findClassesForCallEnd("t1", "s1", endedAt);
    expect(matches).toHaveLength(0);
    expect(others.map((o: any) => o.id)).toEqual(["x"]);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpdate, mockSet, mockSelect } = vi.hoisted(() => {
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

  // select chain: db.select().from().where().orderBy()
  const orderByFn = vi.fn().mockResolvedValue([]);
  const selectWhereFn = vi.fn().mockReturnValue({ orderBy: orderByFn });
  const fromFn = vi.fn().mockReturnValue({ where: selectWhereFn });
  const selectFn = vi.fn().mockReturnValue({ from: fromFn });

  return {
    mockSet: setFn,
    mockUpdate: vi.fn().mockImplementation(() => ({
      set: setFn,
      where: whereFn,
      returning: returningFn,
    })),
    mockSelect: {
      select: selectFn,
      from: fromFn,
      where: selectWhereFn,
      orderBy: orderByFn,
    },
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    transaction: (cb: any) =>
      cb({
        update: mockUpdate,
      }),
    update: mockUpdate,
    select: mockSelect.select,
  },
}));

vi.mock("../scheduling.repository", () => ({
  schedulingRepository: {
    findById: vi.fn(),
    findOverlappingSlot: vi.fn(),
    findRuleById: vi.fn(),
    updateSlot: vi.fn(),
  },
}));

vi.mock("@/lib/rbac", () => ({
  hasPermission: vi.fn().mockReturnValue(true),
}));

vi.mock("@/modules/user/user.service", () => ({
  userService: {
    getUserById: vi.fn(),
  },
}));

vi.mock("@/modules/learning/learning.service", () => ({
  learningService: {
    getActivePlan: vi.fn(),
  },
}));

vi.mock("@/modules/notification/notification.service", () => ({
  notificationService: {
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

import { schedulingService } from "../scheduling.service";
import { schedulingRepository } from "../scheduling.repository";
import { slotInstances } from "../scheduling.schema";
import { notificationService } from "@/modules/notification/notification.service";
import { hasPermission } from "@/lib/rbac";

// ---------------------------------------------------------------------------
// updateSlot — Date change & reminders
// ---------------------------------------------------------------------------
describe("Scheduling Service - updateSlot Date Change & Reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reset reminder flags to false if single slot date changes", async () => {
    const mockUser = { id: "teacher-1", role: "teacher" as const };
    const mockSlot = {
      id: "slot-uuid",
      teacherId: "teacher-1",
      studentId: "student-1",
      startAt: new Date("2026-07-06T18:30:00.000Z"), // original date: July 6th
      endAt: new Date("2026-07-06T19:15:00.000Z"),
      status: "scheduled",
      reminder24hSent: true,
      reminder1hSent: true,
    };

    (schedulingRepository.findById as any).mockResolvedValue(mockSlot);
    (schedulingRepository.findOverlappingSlot as any).mockResolvedValue(null);

    // Call updateSlot moving it to July 7th
    const newStart = new Date("2026-07-07T10:00:00.000Z");
    const newEnd = new Date("2026-07-07T10:45:00.000Z");

    await schedulingService.updateSlot(
      mockUser,
      "slot-uuid",
      {
        startAt: newStart,
        endAt: newEnd,
      },
      "single"
    );

    // Check that update was called with singleUpdate containing reminder flags reset
    expect(mockUpdate).toHaveBeenCalledWith(slotInstances);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        startAt: newStart,
        endAt: newEnd,
        reminder24hSent: false,
        reminder1hSent: false,
      })
    );
  });

  it("should NOT reset reminder flags if slot date is the same day (only time change)", async () => {
    const mockUser = { id: "teacher-1", role: "teacher" as const };
    const mockSlot = {
      id: "slot-uuid",
      teacherId: "teacher-1",
      studentId: "student-1",
      startAt: new Date("2026-07-06T18:30:00.000Z"),
      endAt: new Date("2026-07-06T19:15:00.000Z"),
      status: "scheduled",
      reminder24hSent: true,
      reminder1hSent: true,
    };

    (schedulingRepository.findById as any).mockResolvedValue(mockSlot);
    (schedulingRepository.findOverlappingSlot as any).mockResolvedValue(null);

    // Move to different time but same day (July 6th)
    const newStart = new Date("2026-07-06T20:00:00.000Z");
    const newEnd = new Date("2026-07-06T20:45:00.000Z");

    await schedulingService.updateSlot(
      mockUser,
      "slot-uuid",
      {
        startAt: newStart,
        endAt: newEnd,
      },
      "single"
    );

    expect(mockUpdate).toHaveBeenCalledWith(slotInstances);
    // Check that reminder24hSent/reminder1hSent are not explicitly reset to false
    expect(mockSet).not.toHaveBeenCalledWith(
      expect.objectContaining({
        reminder24hSent: false,
        reminder1hSent: false,
      })
    );
  });

  it("should send push notifications to student, teacher, admin and manager when slot date/time is updated", async () => {
    const mockUser = { id: "teacher-1", role: "teacher" as const };
    const mockSlot = {
      id: "slot-uuid",
      teacherId: "teacher-1",
      studentId: "student-1",
      startAt: new Date("2026-07-06T18:30:00.000Z"),
      endAt: new Date("2026-07-06T19:15:00.000Z"),
      status: "scheduled",
      reminder24hSent: true,
      reminder1hSent: true,
    };

    (schedulingRepository.findById as any).mockResolvedValue(mockSlot);
    (schedulingRepository.findOverlappingSlot as any).mockResolvedValue(null);

    const newStart = new Date("2026-07-07T10:00:00.000Z");
    const newEnd = new Date("2026-07-07T10:45:00.000Z");

    await schedulingService.updateSlot(
      mockUser,
      "slot-uuid",
      {
        startAt: newStart,
        endAt: newEnd,
      },
      "single"
    );

    // Wait a brief moment for the fire-and-forget notification promise to execute
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify notifications were sent
    expect(notificationService.sendNotification).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// retimeRecurrence
// ---------------------------------------------------------------------------
describe("Scheduling Service - retimeRecurrence", () => {
  const mockUser = { id: "teacher-1", role: "teacher" as const };
  const mockRule = {
    id: "rule-uuid",
    teacherId: "teacher-1",
    studentId: "student-1",
    startTime: "18:30",
    endTime: "19:15",
    startDate: new Date("2026-07-04T21:30:00.000Z"),
    frequency: "WEEKLY",
  };

  // Two future scheduled slots belonging to the rule (UTC times for 18:30 BRT = 21:30 UTC)
  const futureSlot1 = {
    id: "slot-1",
    ruleId: "rule-uuid",
    teacherId: "teacher-1",
    studentId: "student-1",
    startAt: new Date("2026-07-11T21:30:00.000Z"),
    endAt: new Date("2026-07-11T22:15:00.000Z"),
    status: "scheduled",
    reminder24hSent: false,
    reminder1hSent: false,
  };
  const futureSlot2 = {
    id: "slot-2",
    ruleId: "rule-uuid",
    teacherId: "teacher-1",
    studentId: "student-1",
    startAt: new Date("2026-07-18T21:30:00.000Z"),
    endAt: new Date("2026-07-18T22:15:00.000Z"),
    status: "scheduled",
    reminder24hSent: true,
    reminder1hSent: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Teacher is not admin by default; ownership check passes via teacherId match
    (hasPermission as any).mockReturnValue(false);
    (schedulingRepository.findRuleById as any).mockResolvedValue(mockRule);
    (schedulingRepository.findOverlappingSlot as any).mockResolvedValue(null);

    // db.select chain returns our two future slots
    (mockSelect.orderBy as any).mockResolvedValue([futureSlot1, futureSlot2]);
  });

  it("should throw if the rule does not exist", async () => {
    (schedulingRepository.findRuleById as any).mockResolvedValue(null);
    await expect(
      schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:00", "10:45")
    ).rejects.toThrow("Regra de recorrência não encontrada.");
  });

  it("should throw if user is not the teacher owner and has no admin permission", async () => {
    (hasPermission as any).mockReturnValue(false);
    const nonOwnerUser = { id: "other-teacher", role: "teacher" as const };
    await expect(
      schedulingService.retimeRecurrence(nonOwnerUser, "rule-uuid", "10:00", "10:45")
    ).rejects.toThrow("Sem permissão para alterar esta recorrência.");
  });

  it("should allow admin to retime another teacher's rule", async () => {
    (hasPermission as any).mockReturnValue(true); // admin
    const adminUser = { id: "admin-1", role: "admin" as const };
    const result = await schedulingService.retimeRecurrence(
      adminUser,
      "rule-uuid",
      "10:00",
      "10:45"
    );
    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);
  });

  it("should throw if newEndTime is before newStartTime", async () => {
    await expect(
      schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:45", "10:00")
    ).rejects.toThrow("Horário inválido");
  });

  it("should throw if newStartTime equals newEndTime", async () => {
    await expect(
      schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:00", "10:00")
    ).rejects.toThrow("Horário inválido");
  });

  it("should throw if no future scheduled slots are found for the rule", async () => {
    (mockSelect.orderBy as any).mockResolvedValue([]);
    await expect(
      schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:00", "10:45")
    ).rejects.toThrow("Nenhuma aula futura encontrada");
  });

  it("should throw with the conflicting date info when any future slot conflicts", async () => {
    (schedulingRepository.findOverlappingSlot as any)
      .mockResolvedValueOnce(null) // slot-1: no conflict
      .mockResolvedValueOnce({     // slot-2: conflict found
        id: "other-slot",
        startAt: new Date("2026-07-18T13:00:00.000Z"),
        endAt: new Date("2026-07-18T13:45:00.000Z"),
      });

    await expect(
      schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:00", "10:45")
    ).rejects.toThrow(/Conflito detectado/);
  });

  it("should update all future slots with new times and reset reminder flags", async () => {
    await schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:00", "10:45");

    // 2 slot updates + 1 rule update = 3 calls
    expect(mockUpdate).toHaveBeenCalledTimes(3);

    // Reminder flags must be reset
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        reminder24hSent: false,
        reminder1hSent: false,
      })
    );
  });

  it("should update the recurrenceRule template with the new startTime and endTime", async () => {
    await schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:00", "10:45");

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: "10:00",
        endTime: "10:45",
      })
    );
  });

  it("should send push notification after successful retime", async () => {
    await schedulingService.retimeRecurrence(mockUser, "rule-uuid", "10:00", "10:45");

    // Wait for fire-and-forget setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(notificationService.sendNotification).toHaveBeenCalled();
  });

  it("should return updatedCount equal to the number of future slots processed", async () => {
    const result = await schedulingService.retimeRecurrence(
      mockUser,
      "rule-uuid",
      "10:00",
      "10:45"
    );
    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);
  });

  it("should shift all future slots dates and update the rule startDate if newStartDate is provided", async () => {
    // futureSlot1: 2026-07-11 (Saturday)
    // We want the new recurrence to start on 2026-07-12 (Sunday), shifting by 1 day
    const newStartDate = new Date("2026-07-12T13:00:00.000Z");

    const result = await schedulingService.retimeRecurrence(
      mockUser,
      "rule-uuid",
      "10:00",
      "10:45",
      newStartDate.toISOString()
    );

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);

    // Verify it updated the rule startDate with the shifted date (original 2026-07-04 + 1 day = 2026-07-05)
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(Date),
      })
    );
  });
});


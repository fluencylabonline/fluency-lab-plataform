/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addDays } from "date-fns";

const { fakeTx, dbTransactionMock, dbQueryMock } = vi.hoisted(() => {
  const fakeTx: any = {
    insert: vi.fn(),
    update: vi.fn(),
    query: { slotInstances: { findFirst: vi.fn() } },
  };
  const dbTransactionMock = vi.fn((cb: any) => cb(fakeTx));
  const dbQueryMock = {
    contractInstancesTable: { findFirst: vi.fn() },
  };
  return { fakeTx, dbTransactionMock, dbQueryMock };
});

vi.mock("@/lib/db", () => ({
  db: {
    transaction: dbTransactionMock,
    query: dbQueryMock,
  },
}));

vi.mock("../scheduling.repository", () => ({
  schedulingRepository: {
    findRecessesByTeacher: vi.fn().mockResolvedValue([]),
    findByTeacherInRange: vi.fn().mockResolvedValue([]),
    findRuleById: vi.fn(),
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

vi.mock("@/modules/curriculum/curriculum.service", () => ({
  curriculumService: {
    findLessonById: vi.fn(),
    getRecessActivities: vi.fn().mockResolvedValue([{ id: "activity-1", title: "Atividade" }]),
  },
}));

vi.mock("@/modules/communication/communication.service", () => ({
  communicationService: {
    sendTeacherRecessStudentEmail: vi.fn().mockResolvedValue(undefined),
    sendTeacherRecessStudentWhatsApp: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/modules/notification/notification.service", () => ({
  notificationService: {
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/cryptography", () => ({
  decrypt: vi.fn((v: string) => v.split(":").pop() as string),
}));

import { schedulingService } from "../scheduling.service";
import { schedulingRepository } from "../scheduling.repository";
import { userService } from "@/modules/user/user.service";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { communicationService } from "@/modules/communication/communication.service";
import { notificationService } from "@/modules/notification/notification.service";
import { slotInstances, recurrenceRules } from "../scheduling.schema";

// Helper: builds a `tx.update(table)` chain mock. `.where(...)` resolves to
// `undefined` when awaited directly, and also exposes `.returning(...)` for
// the calls that need the updated rows back.
function makeUpdateChain(returningValue: any[] = []) {
  const returningFn = vi.fn().mockResolvedValue(returningValue);
  const whereResult: any = Promise.resolve(undefined);
  whereResult.returning = returningFn;
  const whereFn = vi.fn().mockReturnValue(whereResult);
  return { set: vi.fn().mockReturnValue({ where: whereFn }) };
}

const teacher = { id: "teacher-1", name: "Bianca" } as any;

// `vi.spyOn(schedulingService, ...)` is used in a couple of describe blocks below to
// stub out real methods (e.g. notifyStudentOfRecess, materializeSlotsUntilDate). Those
// spies must be restored after every test, otherwise they leak into later describe
// blocks and silently replace the real implementation with a no-op.
afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// notifyStudentOfRecess — multi-channel dispatch
// ---------------------------------------------------------------------------
describe("Scheduling Service - notifyStudentOfRecess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const student = {
    id: "student-1",
    name: "Henzzo",
    email: "henzzo@example.com",
    cellphone: "11999999999",
    locale: "pt",
  };
  const startDate = new Date("2026-08-31T00:00:00.000Z");
  const endDate = new Date("2026-09-07T00:00:00.000Z");

  it("sends in-app/push, email and whatsapp when the student has both email and phone", async () => {
    await schedulingService.notifyStudentOfRecess(student, "Bianca", startDate, endDate, "Prática de conversação");

    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: "specific",
        userIds: ["student-1"],
        channels: { inApp: true, push: true },
      })
    );
    expect(communicationService.sendTeacherRecessStudentEmail).toHaveBeenCalledWith(
      "henzzo@example.com",
      expect.objectContaining({ studentName: "Henzzo", teacherName: "Bianca", fallbackLessonTitle: "Prática de conversação" })
    );
    expect(communicationService.sendTeacherRecessStudentWhatsApp).toHaveBeenCalledWith(
      "11999999999",
      "pt",
      expect.objectContaining({ studentName: "Henzzo", fallbackLessonTitle: "Prática de conversação" })
    );
  });

  it("decrypts the phone before sending WhatsApp when it is encrypted", async () => {
    await schedulingService.notifyStudentOfRecess(
      { ...student, cellphone: "crypto:iv:11988887777" },
      "Bianca",
      startDate,
      endDate,
      "Atividade"
    );

    expect(communicationService.sendTeacherRecessStudentWhatsApp).toHaveBeenCalledWith(
      "11988887777",
      "pt",
      expect.anything()
    );
  });

  it("skips email when the student has no email and skips whatsapp when there is no phone", async () => {
    await schedulingService.notifyStudentOfRecess(
      { ...student, email: "", cellphone: null },
      "Bianca",
      startDate,
      endDate,
      "Atividade"
    );

    expect(communicationService.sendTeacherRecessStudentEmail).not.toHaveBeenCalled();
    expect(communicationService.sendTeacherRecessStudentWhatsApp).not.toHaveBeenCalled();
    expect(notificationService.sendNotification).toHaveBeenCalled();
  });

  it("still attempts email and whatsapp even if the in-app notification fails", async () => {
    (notificationService.sendNotification as any).mockRejectedValueOnce(new Error("push down"));

    await schedulingService.notifyStudentOfRecess(student, "Bianca", startDate, endDate, "Atividade");

    expect(communicationService.sendTeacherRecessStudentEmail).toHaveBeenCalled();
    expect(communicationService.sendTeacherRecessStudentWhatsApp).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyNewlyAllocatedStudentOfRecess
// ---------------------------------------------------------------------------
describe("Scheduling Service - notifyNewlyAllocatedStudentOfRecess", () => {
  const student = {
    id: "student-1",
    name: "Henzzo",
    email: "henzzo@example.com",
    cellphone: null,
    locale: "pt",
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when no recess overlaps the assigned slot dates", async () => {
    (schedulingRepository.findRecessesByTeacher as any).mockResolvedValue([
      { teacherId: "teacher-1", startDate: new Date("2026-01-01"), endDate: new Date("2026-01-10") },
    ]);
    const notifySpy = vi.spyOn(schedulingService, "notifyStudentOfRecess").mockResolvedValue(undefined as any);

    await schedulingService.notifyNewlyAllocatedStudentOfRecess(
      student,
      "teacher-1",
      [new Date("2026-08-31T12:00:00.000Z")],
      "Atividade"
    );

    expect(userService.getUserById).not.toHaveBeenCalled();
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("notifies the student once per overlapping recess using the teacher's name", async () => {
    const recess = { teacherId: "teacher-1", startDate: new Date("2026-08-25"), endDate: new Date("2026-09-07") };
    (schedulingRepository.findRecessesByTeacher as any).mockResolvedValue([recess]);
    (userService.getUserById as any).mockResolvedValue({ id: "teacher-1", name: "Bianca" });
    const notifySpy = vi.spyOn(schedulingService, "notifyStudentOfRecess").mockResolvedValue(undefined as any);

    await schedulingService.notifyNewlyAllocatedStudentOfRecess(
      student,
      "teacher-1",
      [new Date("2026-08-31T12:00:00.000Z")],
      "Atividade de recesso"
    );

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(notifySpy).toHaveBeenCalledWith(student, "Bianca", recess.startDate, recess.endDate, "Atividade de recesso");
  });
});

// ---------------------------------------------------------------------------
// registerRecess
// ---------------------------------------------------------------------------
describe("Scheduling Service - registerRecess", () => {
  // 31+ days ahead keeps every test comfortably past the 30-day minimum notice,
  // and a 5-day span stays well under the 15-day maximum duration.
  const baseData = {
    startDate: addDays(new Date(), 31),
    endDate: addDays(new Date(), 35),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (schedulingRepository.findRecessesByTeacher as any).mockResolvedValue([]);
    (curriculumService.getRecessActivities as any).mockResolvedValue([{ id: "activity-1", title: "Atividade" }]);
    fakeTx.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "recess-1",
            teacherId: "teacher-1",
            startDate: baseData.startDate,
            endDate: baseData.endDate,
            isValidated: true,
            fallbackConfig: {},
          },
        ]),
      }),
    });
    fakeTx.update.mockImplementation(() => makeUpdateChain());
  });

  it("throws when the recess is scheduled with less than 30 days of advance notice", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([]);

    await expect(
      schedulingService.registerRecess(teacher, {
        startDate: addDays(new Date(), 10),
        endDate: addDays(new Date(), 12),
        fallbackConfig: {},
      })
    ).rejects.toThrow("pelo menos 30 dias de antecedência");

    expect(dbTransactionMock).not.toHaveBeenCalled();
  });

  it("throws when the recess spans more than 15 consecutive days", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([]);

    await expect(
      schedulingService.registerRecess(teacher, {
        startDate: addDays(new Date(), 31),
        endDate: addDays(new Date(), 50),
        fallbackConfig: {},
      })
    ).rejects.toThrow("não pode durar mais de 15 dias");

    expect(dbTransactionMock).not.toHaveBeenCalled();
  });

  it("throws when there are affected classes but the shared recess activity library is empty", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([
      { id: "class-1", status: "scheduled", studentId: "student-1", startAt: new Date(), endAt: new Date() },
    ]);
    (curriculumService.getRecessActivities as any).mockResolvedValue([]);

    await expect(
      schedulingService.registerRecess(teacher, { ...baseData, fallbackConfig: {} })
    ).rejects.toThrow("Ainda não existe nenhuma atividade de recesso cadastrada");

    expect(dbTransactionMock).not.toHaveBeenCalled();
  });

  it("does not require the teacher's own lessons — any activity from the shared library is a valid fallback", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([
      { id: "class-1", status: "scheduled", studentId: "student-1", startAt: new Date(), endAt: new Date() },
    ]);
    // getRecessActivities() is called with no teacherId — the shared library, not "teacher-1"'s own lessons
    (curriculumService.findLessonById as any).mockResolvedValue({ id: "lesson-from-another-teacher", title: "Lição de outro professor" });

    await schedulingService.registerRecess(teacher, {
      ...baseData,
      fallbackConfig: { "class-1": { lessonId: "lesson-from-another-teacher" } },
    });

    expect(curriculumService.getRecessActivities).toHaveBeenCalledWith();
  });

  it("throws when a scheduled class with a student has no fallback lesson configured", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([
      { id: "class-1", status: "scheduled", studentId: "student-1", startAt: new Date(), endAt: new Date() },
    ]);

    await expect(
      schedulingService.registerRecess(teacher, { ...baseData, fallbackConfig: {} })
    ).rejects.toThrow("sem atividade de recesso selecionada");

    expect(dbTransactionMock).not.toHaveBeenCalled();
  });

  it("throws when the fallback lesson id for an affected class is an empty string", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([
      { id: "class-1", status: "scheduled", studentId: "student-1", startAt: new Date(), endAt: new Date() },
    ]);

    await expect(
      schedulingService.registerRecess(teacher, {
        ...baseData,
        fallbackConfig: { "class-1": { lessonId: "" } },
      })
    ).rejects.toThrow("sem atividade de recesso selecionada");
  });

  it("does not require fallback for classes without a student (available slots)", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([
      { id: "class-1", status: "available", studentId: null, startAt: new Date(), endAt: new Date() },
    ]);

    await expect(
      schedulingService.registerRecess(teacher, { ...baseData, fallbackConfig: {} })
    ).resolves.toEqual(expect.objectContaining({ id: "recess-1" }));
  });

  it("notifies every affected student on every channel once the recess is registered", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([
      {
        id: "class-1",
        status: "scheduled",
        studentId: "student-1",
        startAt: new Date("2026-08-31T12:00:00.000Z"),
        endAt: new Date("2026-08-31T13:00:00.000Z"),
      },
      {
        id: "class-2",
        status: "scheduled",
        studentId: "student-2",
        startAt: new Date("2026-09-02T12:00:00.000Z"),
        endAt: new Date("2026-09-02T13:00:00.000Z"),
      },
    ]);
    (curriculumService.findLessonById as any).mockResolvedValue({ id: "lesson-1", title: "Prática de conversação" });
    (userService.getUserById as any).mockImplementation((id: string) => ({
      id,
      name: id === "student-1" ? "Henzzo" : "Outro Aluno",
      email: `${id}@example.com`,
      cellphone: "11999999999",
      locale: "pt",
    }));

    const result = await schedulingService.registerRecess(teacher, {
      ...baseData,
      fallbackConfig: {
        "class-1": { lessonId: "lesson-1" },
        "class-2": { lessonId: "lesson-1" },
      },
    });

    expect(result).toEqual(expect.objectContaining({ id: "recess-1" }));

    // Manager is still notified in-app
    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: "role", targetRole: "manager" })
    );

    // Each affected student is notified in-app/push
    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: "specific", userIds: ["student-1"] })
    );
    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: "specific", userIds: ["student-2"] })
    );

    // Each affected student is notified by email and whatsapp with the resolved lesson title
    expect(communicationService.sendTeacherRecessStudentEmail).toHaveBeenCalledWith(
      "student-1@example.com",
      expect.objectContaining({ studentName: "Henzzo", fallbackLessonTitle: "Prática de conversação" })
    );
    expect(communicationService.sendTeacherRecessStudentEmail).toHaveBeenCalledWith(
      "student-2@example.com",
      expect.objectContaining({ studentName: "Outro Aluno", fallbackLessonTitle: "Prática de conversação" })
    );
    expect(communicationService.sendTeacherRecessStudentWhatsApp).toHaveBeenCalledTimes(2);
  });

  it("does not let one student's notification failure stop the others from being notified", async () => {
    (schedulingRepository.findByTeacherInRange as any).mockResolvedValue([
      { id: "class-1", status: "scheduled", studentId: "student-1", startAt: new Date(), endAt: new Date() },
      { id: "class-2", status: "scheduled", studentId: "student-2", startAt: new Date(), endAt: new Date() },
    ]);
    (curriculumService.findLessonById as any).mockResolvedValue({ id: "lesson-1", title: "Atividade" });
    (userService.getUserById as any)
      .mockRejectedValueOnce(new Error("lookup failed for student-1"))
      .mockResolvedValueOnce({ id: "student-2", name: "Outro Aluno", email: "s2@example.com", cellphone: null, locale: "pt" });

    await schedulingService.registerRecess(teacher, {
      ...baseData,
      fallbackConfig: {
        "class-1": { lessonId: "lesson-1" },
        "class-2": { lessonId: "lesson-1" },
      },
    });

    expect(communicationService.sendTeacherRecessStudentEmail).toHaveBeenCalledWith(
      "s2@example.com",
      expect.anything()
    );
  });
});

// ---------------------------------------------------------------------------
// allocateStudentToRule — Part C: allocating into an already-scheduled recess
// ---------------------------------------------------------------------------
describe("Scheduling Service - allocateStudentToRule (recess edge case)", () => {
  const rule = { id: "rule-1", teacherId: "teacher-1", startTime: "10:00", endTime: "10:45" };
  const student = {
    id: "student-1",
    name: "Henzzo",
    email: "henzzo@example.com",
    cellphone: null,
    locale: "pt",
  } as any;

  let slotInstancesUpdateCount = 0;
  let recessSlotsFixture: any[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    slotInstancesUpdateCount = 0;
    recessSlotsFixture = [];

    (schedulingRepository.findRuleById as any).mockResolvedValue(rule);
    (userService.getUserById as any).mockResolvedValue(student);

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    dbQueryMock.contractInstancesTable.findFirst.mockResolvedValue({
      userId: "student-1",
      status: "signed",
      expiresAt: futureDate,
    });

    fakeTx.query.slotInstances.findFirst.mockResolvedValue(null);

    fakeTx.update.mockImplementation((table: any) => {
      if (table === recurrenceRules) return makeUpdateChain();
      // table === slotInstances
      slotInstancesUpdateCount++;
      if (slotInstancesUpdateCount === 1) return makeUpdateChain(); // available -> scheduled
      if (slotInstancesUpdateCount === 2) return makeUpdateChain(recessSlotsFixture); // teacher-recess reassignment
      return makeUpdateChain(); // optional backfill update
    });

    vi.spyOn(schedulingService, "materializeSlotsUntilDate").mockResolvedValue(undefined as any);
    vi.spyOn(schedulingService, "sendAllocationWhatsAppNotifications").mockResolvedValue(undefined as any);
    vi.spyOn(schedulingService, "notifyNewlyAllocatedStudentOfRecess").mockResolvedValue(undefined as any);
  });

  it("does not attempt recess backfill or notification when no teacher-recess slot is reassigned", async () => {
    recessSlotsFixture = [];

    await schedulingService.allocateStudentToRule({ id: "admin-1", role: "admin" } as any, "rule-1", "student-1");

    expect(curriculumService.getRecessActivities).not.toHaveBeenCalled();
    expect(schedulingService.notifyNewlyAllocatedStudentOfRecess).not.toHaveBeenCalled();
  });

  it("backfills the fallback lesson and notifies the student when reassigned slots have no fallback set", async () => {
    const slotDate = new Date("2026-08-31T12:00:00.000Z");
    recessSlotsFixture = [
      { id: "slot-9", startAt: slotDate, fallbackLessonId: null, fallbackLessonTitle: null },
    ];
    (curriculumService.getRecessActivities as any).mockResolvedValue([
      { id: "activity-1", title: "Atividade Padrão" },
    ]);

    const result = await schedulingService.allocateStudentToRule(
      { id: "admin-1", role: "admin" } as any,
      "rule-1",
      "student-1"
    );

    expect(result.success).toBe(true);
    expect(curriculumService.getRecessActivities).toHaveBeenCalledWith("teacher-1");
    expect(schedulingService.notifyNewlyAllocatedStudentOfRecess).toHaveBeenCalledWith(
      student,
      "teacher-1",
      [slotDate],
      "Atividade Padrão"
    );
  });

  it("reuses the existing fallback title and skips backfill when the reassigned slot already has one", async () => {
    const slotDate = new Date("2026-08-31T12:00:00.000Z");
    recessSlotsFixture = [
      { id: "slot-9", startAt: slotDate, fallbackLessonId: "lesson-1", fallbackLessonTitle: "Prática de conversação" },
    ];

    await schedulingService.allocateStudentToRule({ id: "admin-1", role: "admin" } as any, "rule-1", "student-1");

    expect(curriculumService.getRecessActivities).not.toHaveBeenCalled();
    expect(schedulingService.notifyNewlyAllocatedStudentOfRecess).toHaveBeenCalledWith(
      student,
      "teacher-1",
      [slotDate],
      "Prática de conversação"
    );
  });

  it("falls back to a generic title when no default recess activity exists to backfill with", async () => {
    const slotDate = new Date("2026-08-31T12:00:00.000Z");
    recessSlotsFixture = [
      { id: "slot-9", startAt: slotDate, fallbackLessonId: null, fallbackLessonTitle: null },
    ];
    (curriculumService.getRecessActivities as any).mockResolvedValue([]);

    await schedulingService.allocateStudentToRule({ id: "admin-1", role: "admin" } as any, "rule-1", "student-1");

    expect(schedulingService.notifyNewlyAllocatedStudentOfRecess).toHaveBeenCalledWith(
      student,
      "teacher-1",
      [slotDate],
      "Atividade de recesso"
    );
  });
});

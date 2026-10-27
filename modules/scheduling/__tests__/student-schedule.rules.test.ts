import { describe, it, expect } from "vitest";
import { classActions, groupByMonth, hoursUntil, statusGroup } from "../student-schedule.rules";

const now = new Date("2026-10-26T12:00:00");
const inHours = (h: number) => new Date(now.getTime() + h * 3_600_000);
const ctx = { now, quotaExhausted: false, teacherCredits: 0 };

describe("student-schedule.rules - ações por status", () => {
  it("SHOULD allow reschedule and cancel for a scheduled class with notice", () => {
    const a = classActions({ status: "scheduled", startAt: inHours(48) }, ctx);
    expect(a).toMatchObject({ canReschedule: true, canCancel: true, cancelIsNoShow: false, quotaExhausted: false });
  });

  it("SHOULD block reschedule within 4h and warn that cancelling is a no-show", () => {
    const a = classActions({ status: "scheduled", startAt: inHours(3) }, ctx);
    expect(a).toMatchObject({ canReschedule: false, canCancel: true, cancelIsNoShow: true });
  });

  it("SHOULD treat exactly 4h as still reschedulable", () => {
    expect(classActions({ status: "scheduled", startAt: inHours(4) }, ctx).canReschedule).toBe(true);
  });

  it("SHOULD flag an exhausted monthly quota instead of offering reschedule", () => {
    const a = classActions({ status: "scheduled", startAt: inHours(48) }, { ...ctx, quotaExhausted: true });
    expect(a).toMatchObject({ canReschedule: false, quotaExhausted: true, canCancel: true });
  });

  it("SHOULD NOT report an exhausted quota when the class is within 4h (it is not reschedulable anyway)", () => {
    const a = classActions({ status: "scheduled", startAt: inHours(2) }, { ...ctx, quotaExhausted: true });
    expect(a.quotaExhausted).toBe(false);
  });

  it("SHOULD replace a teacher-canceled class with a credit, never with the quota", () => {
    const withCredit = classActions({ status: "canceled-teacher", startAt: inHours(-72) }, { ...ctx, teacherCredits: 1, quotaExhausted: true });
    expect(withCredit).toMatchObject({ canReplaceWithCredit: true, canReschedule: false, canCancel: false });

    const without = classActions({ status: "canceled-teacher", startAt: inHours(-72) }, ctx);
    expect(without).toMatchObject({ canReplaceWithCredit: false, noCredit: true });
  });

  it.each(["canceled-student", "canceled-admin", "canceled-credit", "no-show", "completed", "overdue"])(
    "SHOULD offer no action for %s",
    (status) => {
      const a = classActions({ status, startAt: inHours(48) }, { ...ctx, teacherCredits: 3 });
      expect(a).toMatchObject({ canReschedule: false, canCancel: false, canReplaceWithCredit: false, noCredit: false });
    },
  );

  it("SHOULD show the recess activity only when a fallback lesson exists", () => {
    expect(classActions({ status: "teacher-recess", startAt: inHours(24), fallbackLessonId: "l1" }, ctx).hasRecessActivity).toBe(true);
    expect(classActions({ status: "teacher-recess", startAt: inHours(24), fallbackLessonId: null }, ctx).hasRecessActivity).toBe(false);
    expect(classActions({ status: "teacher-recess", startAt: inHours(24) }, ctx).canCancel).toBe(false);
  });
});

describe("student-schedule.rules - status e agrupamento", () => {
  it("SHOULD collapse statuses into a few groups", () => {
    expect(statusGroup("scheduled")).toBe("scheduled");
    expect(statusGroup("canceled-student")).toBe("canceled");
    expect(statusGroup("canceled-teacher")).toBe("canceled");
    expect(statusGroup("canceled-admin")).toBe("canceled");
    expect(statusGroup("canceled-credit")).toBe("canceled");
    expect(statusGroup("no-show")).toBe("noShow");
    expect(statusGroup("teacher-recess")).toBe("recess");
    expect(statusGroup("completed")).toBe("completed");
    expect(statusGroup("overdue")).toBe("overdue");
  });

  it("SHOULD group by month keeping order and accept ISO strings", () => {
    const groups = groupByMonth([
      { id: 1, startAt: "2026-10-27T19:00:00" },
      { id: 2, startAt: new Date("2026-10-29T19:00:00") },
      { id: 3, startAt: new Date("2026-11-03T19:00:00") },
    ]);
    expect(groups.map((g) => [g.key, g.items.map((i) => i.id)])).toEqual([
      ["2026-10", [1, 2]],
      ["2026-11", [3]],
    ]);
    expect(groups[1].date.getMonth()).toBe(10);
  });

  it("SHOULD return no groups for an empty list", () => {
    expect(groupByMonth([])).toEqual([]);
  });

  it("SHOULD compute hours until a class", () => {
    expect(hoursUntil(inHours(5), now)).toBeCloseTo(5);
  });
});

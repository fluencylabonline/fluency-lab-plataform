import { describe, it, expect } from "vitest";
import { hasPermission, UserRoleInfo } from "../rbac";

describe("RBAC - hasPermission()", () => {
  it("should allow admin to have any permission", () => {
    const admin: UserRoleInfo = { role: "admin" };
    expect(hasPermission(admin, "payment.manage")).toBe(true);
    expect(hasPermission(admin, "user.create")).toBe(true);
    expect(hasPermission(admin, "class.view")).toBe(true);
  });

  it("should allow student to have their specific permissions", () => {
    const student: UserRoleInfo = { role: "student" };
    expect(hasPermission(student, "payment.view.self")).toBe(true);
    expect(hasPermission(student, "class.view")).toBe(true);
  });

  it("should deny student from having admin permissions", () => {
    const student: UserRoleInfo = { role: "student" };
    expect(hasPermission(student, "payment.manage")).toBe(false);
    expect(hasPermission(student, "user.create")).toBe(false);
  });

  it("should deny teacher from having financial permissions", () => {
    const teacher: UserRoleInfo = { role: "teacher" };
    expect(hasPermission(teacher, "payment.manage")).toBe(false);
    expect(hasPermission(teacher, "payment.view.self")).toBe(false);
  });

  it("should return false for null or undefined user", () => {
    expect(hasPermission(null, "class.view")).toBe(false);
    expect(hasPermission(undefined, "class.view")).toBe(false);
  });
});

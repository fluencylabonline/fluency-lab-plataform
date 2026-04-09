export type Permission =
  | "class.view"
  | "class.cancel.self"
  | "class.reschedule.self"
  | "contract.view.self"
  | "profile.update.self"
  | "feedback.create"
  | "payment.view.self"
  | "credits.view.self"
  | "class.view.assigned"
  | "class.update.status"
  | "class.reschedule.teacher"
  | "vacation.create"
  | "vacation.view"
  | "student.feedback.read"
  | "class.create.with.credits"
  | "credits.view.students"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "class.view.all"
  | "class.update.any"
  | "contract.create"
  | "contract.update"
  | "vacation.override"
  | "report.view"
  | "payment.manage"
  | "credits.manage"
  | "credits.grant"
  | "credits.view.all"
  | "student.support"
  | "teacher.support"
  | "report.view.limited"
  | "material.create"
  | "material.update"
  | "material.delete"
  | "material.view";

export type Role = "admin" | "teacher" | "student" | "manager";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "user.create",
    "user.update",
    "user.delete",
    "class.view.all",
    "class.update.any",
    "contract.create",
    "contract.update",
    "vacation.override",
    "report.view",
    "payment.manage",
    "credits.manage",
    "credits.grant",
    "credits.view.all",
    "material.view",
  ],
  manager: [
    "student.support",
    "teacher.support",
    "report.view.limited",
    "material.create",
    "material.update",
    "material.delete",
    "material.view",
  ],
  teacher: [
    "class.view.assigned",
    "class.update.status",
    "class.reschedule.teacher",
    "vacation.create",
    "vacation.view",
    "student.feedback.read",
    "class.create.with.credits",
    "credits.view.students",
    "material.view",
  ],
  student: [
    "class.view",
    "class.cancel.self",
    "class.reschedule.self",
    "contract.view.self",
    "profile.update.self",
    "feedback.create",
    "payment.view.self",
    "credits.view.self",
    "material.view",
  ],
};

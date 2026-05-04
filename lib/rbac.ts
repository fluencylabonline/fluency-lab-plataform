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
  | "material.view"
  | "course.manage"
  | "course.view"
  | "course.learn"
  | "notebook.create"
  | "notebook.view.own"
  | "notebook.view.student";

export type Role = "admin" | "teacher" | "student" | "manager";
export enum UserRoles {
  ADMIN = "admin",
  MANAGER = "manager",
  STUDENT = "student",
  TEACHER = "teacher",
}

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
    "course.manage",
    "course.view",
    "course.learn",
  ],
  manager: [
    "student.support",
    "teacher.support",
    "report.view.limited",
    "material.create",
    "material.update",
    "material.delete",
    "material.view",
    "class.view.all",
    "class.update.any",
    "credits.manage",
    "credits.grant",
    "credits.view.all",
    "course.manage",
    "course.view",
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
    "notebook.create",
    "notebook.view.student",
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
    "course.view",
    "course.learn",
    "notebook.view.own",
  ],
};

/**
 * Common interface for anything that has a role.
 * Simplifies dependency between rbac and other modules.
 */
export interface UserRoleInfo {
  role: Role;
}

/**
 * Check if a role has a specific permission.
 * Admin role bypasses all checks.
 */
export function hasPermission(
  user: UserRoleInfo | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

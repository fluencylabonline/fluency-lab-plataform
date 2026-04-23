import { createSafeActionClient } from "next-safe-action";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "./auth-server";
import { hasPermission, type Permission } from "./rbac";

/**
 * Base action client — for public actions (e.g. login, forgot-password).
 * Error Masking: never leaks internal errors to the client.
 */
export const actionClient = createSafeActionClient({
  handleServerError: async (error) => {
    // Log the real error server-side for debugging
    console.error("[ActionError]", error.message);

    // Return a safe, translated message to the client
    const t = await getTranslations("Common");
    return t("error");
  },
});

/**
 * Protected action client — requires an authenticated session.
 * Injects `ctx.user` into the action handler.
 */
export const protectedAction = actionClient.use(async ({ next }) => {
  const user = await getCurrentUser();

  if (!user) {
    const t = await getTranslations("Common");
    throw new Error(t("unauthorized"));
  }

  return next({ ctx: { user } });
});

/**
 * Admin action client — requires admin role.
 */
export const adminAction = protectedAction.use(async ({ next, ctx }) => {
  if (ctx.user.role !== "admin") {
    const t = await getTranslations("Common");
    throw new Error(t("unauthorized"));
  }

  return next({ ctx });
});

/**
 * Manager action client — requires admin or manager role.
 */
export const managerAction = protectedAction.use(async ({ next, ctx }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    const t = await getTranslations("Common");
    throw new Error(t("unauthorized"));
  }

  return next({ ctx });
});

/**
 * Permission action client — requires a specific permission.
 * Usage: permissionAction("user.create").schema(...).action(...)
 */
export const permissionAction = (permission: Permission) =>
  protectedAction.use(async ({ next, ctx }) => {
    if (!hasPermission(ctx.user, permission)) {
      const t = await getTranslations("Common");
      throw new Error(t("unauthorized"));
    }

    return next({ ctx });
  });

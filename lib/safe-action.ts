import { createSafeActionClient } from "next-safe-action";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "./auth-server";

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

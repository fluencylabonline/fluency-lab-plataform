import { createSafeActionClient } from "next-safe-action";
import { getTranslations } from "next-intl/server";

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
 *
 * NOTE: This is a PLACEHOLDER until T6 (Auth Helpers).
 * getCurrentUser() will be imported from lib/auth-server.ts
 * once it's created. For now, it throws "unauthorized".
 */
export const protectedAction = actionClient.use(async ({ next }) => {
  // TODO [T6]: Replace with real getCurrentUser() from lib/auth-server.ts
  // const user = await getCurrentUser();
  const user = null;

  if (!user) {
    const t = await getTranslations("Common");
    throw new Error(t("unauthorized"));
  }

  return next({ ctx: { user } });
});

/**
 * Admin action client — requires admin role.
 *
 * NOTE: Placeholder until T6. The role check will use ctx.user.role.
 */
export const adminAction = protectedAction.use(async ({ next, ctx }) => {
  // TODO [T6]: Uncomment when User type is available
  // if (ctx.user.role !== "admin") {
  //   const t = await getTranslations("Common");
  //   throw new Error(t("unauthorized"));
  // }

  return next({ ctx });
});

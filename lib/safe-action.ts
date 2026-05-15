import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "./auth-server";
import { hasPermission, type Permission } from "./rbac";

/**
 * Utility to mask sensitive data in logs.
 * Now recursive to handle nested objects (e.g. address, guardianData).
 */
const maskSensitiveData = (data: unknown): unknown => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const sensitiveKeys = [
    "password",
    "mfaSecret",
    "token",
    "secret",
    "taxId",
    "pixKey",
    "idToken",
    "code",
    "currentPassword",
    "newPassword",
    "confirmPassword",
    "cellphone",
    "businessTaxId",
    "guardianTaxId",
    "zipCode",
    "street",
    "number",
    "neighborhood",
    "city",
    "state",
    "birthDate",
    "guardianName",
    "cvv",
    "cardNumber",
    "expiryDate",
  ];

  const obj = data as Record<string, unknown>;
  const masked: Record<string, unknown> = {};

  for (const key in obj) {
    const value = obj[key];
    if (sensitiveKeys.includes(key)) {
      masked[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

/**
 * Base action client — for public actions (e.g. login, forgot-password).
 * Error Masking: never leaks internal errors to the client.
 */
export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
    });
  },
  handleServerError: async (error) => {
    // Log the real error server-side for debugging
    console.error("[ActionError]", error.message);

    if (error.message === "unauthorized" || error.message === "UNAUTHORIZED") {
      return "unauthorized";
    }

    // Return a safe, translated message to the client
    const t = await getTranslations("Common");
    return t("error");
  },
}).use(async ({ next, clientInput, metadata }) => {
  const startTime = Date.now();
  const result = await next();
  const duration = Date.now() - startTime;

  // Log formatado, seguro e com performance tracking para o servidor
  console.log(`[Action] ${metadata?.name || "unnamed"} (${duration}ms):`, {
    input: maskSensitiveData(clientInput),
    success: result.success,
  });

  return result;
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

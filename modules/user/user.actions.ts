"use server";

import { cookies } from "next/headers";
import { actionClient, protectedAction, permissionAction, adminAction } from "@/lib/safe-action";
import { userService } from "./user.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { adminAuth } from "@/lib/firebase-admin";
import { NewUser, createUserSchema, requestNewInviteSchema, updateUserSchema, notificationPrefsSchema } from "./user.schema";
import { env } from "@/env";
import { communicationService } from "@/modules/communication/communication.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { locales } from "@/i18n/config";
import { decrypt } from "@/lib/cryptography";
import { verifySudoMode } from "@/lib/auth-server";

// --- Funções Auxiliares Privadas ---
const generateInviteLink = async (email: string, locale: string = "pt") => {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.endsWith("/")
    ? env.NEXT_PUBLIC_APP_URL.slice(0, -1)
    : env.NEXT_PUBLIC_APP_URL;

  return adminAuth.generatePasswordResetLink(email, {
    url: `${baseUrl}/${locale}/signin`,
  });
};
// -----------------------------------

export const loginAction = actionClient
  .inputSchema(
    z.object({
      idToken: z.string().min(1),
      rememberMe: z.boolean().optional().default(false),
      name: z.string().optional().nullable(),
      photoUrl: z.string().optional().nullable(),
      googleLinked: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput: { idToken, rememberMe, ...profileData } }) => {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const { uid, email } = decodedToken;

      try {
        const sanitizedData: Partial<NewUser> = { email: email! };
        if (profileData.name) sanitizedData.name = profileData.name;
        if (profileData.photoUrl) sanitizedData.photoUrl = profileData.photoUrl;
        if (typeof profileData.googleLinked === "boolean") sanitizedData.googleLinked = profileData.googleLinked;

        await userService.syncUser(uid, sanitizedData);
      } catch (error) {
        if ((error as Error).message === "NOT_INVITED") return { success: false, error: "notInvited" };
        throw error;
      }

      const sessionCookie = await userService.createSessionCookie(idToken);
      const cookieStore = await cookies();
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

      cookieStore.set("session", sessionCookie, {
        maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });

      return { success: true };
    } catch (error) {
      console.error("[loginAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const logoutAction = protectedAction.action(async ({ ctx }) => {
  try {
    await userService.revokeSessions(ctx.user.id);
    const cookieStore = await cookies();
    cookieStore.delete("session");

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[logoutAction] Error:", error);
    throw new Error("Failed to logout");
  }
});

export const syncUserAction = protectedAction
  .inputSchema(
    z.object({
      name: z.string().optional(),
      photoUrl: z.string().url().optional(),
      googleLinked: z.boolean().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const limit = await checkRateLimit("sync_profile", ctx.user.id, 5, 3600 * 1000);
      if (!limit.success) throw new Error("RATE_LIMIT_EXCEEDED");
      await userService.syncUser(ctx.user.id, parsedInput);

      revalidatePath("/");
      return { success: true };
    } catch (error) {
      if ((error as Error).message === "RATE_LIMIT_EXCEEDED") return { success: false, error: "rateLimitExceeded" };
      console.error("[syncUserAction] Error:", error);
      throw new Error("Failed to sync profile");
    }
  });

export const createUserAction = permissionAction("user.create")
  .inputSchema(createUserSchema)
  .action(async ({ parsedInput }) => {
    try {
      const data = {
        ...parsedInput,
        classesStartDate: parsedInput.classesStartDate ? new Date(parsedInput.classesStartDate) : null,
      };

      await userService.createUserAndSendInvite(data);
      revalidatePath("/hub/admin/users");

      return { success: true };
    } catch (error) {
      console.error("[createUserAction] Error:", error);
      if ((error as Error).message === "USER_ALREADY_EXISTS") return { success: false, error: "userAlreadyExists" };
      return { success: false, error: "error" };
    }
  });

export const updateNotificationPrefsAction = protectedAction
  .schema(notificationPrefsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await userService.updateNotificationPrefs(ctx.user.id, parsedInput);
    return { success: true };
  });

export const resendInviteAction = permissionAction("user.create")
  .inputSchema(
    z.object({
      email: z.string().email(),
      locale: z.enum(locales).optional().default("pt"),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const user = await userService.getUserByEmail(parsedInput.email);
      if (!user) return { success: false, error: "userNotFound" };

      const actionLink = await generateInviteLink(user.email, parsedInput.locale);
      await communicationService.sendWelcomeAndSetPasswordEmail(user.email, user.name, actionLink);

      return { success: true };
    } catch (error) {
      console.error("[resendInviteAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const requestNewInviteAction = actionClient
  .inputSchema(requestNewInviteSchema)
  .action(async ({ parsedInput }) => {
    try {
      const limit = await checkRateLimit("resend_invite", parsedInput.email, 2, 300 * 1000);
      if (!limit.success) throw new Error("RATE_LIMIT_EXCEEDED");

      const user = await userService.getUserByEmail(parsedInput.email);
      if (!user) return { success: false, error: "userNotFound" };

      const actionLink = await generateInviteLink(user.email, parsedInput.locale);
      await communicationService.sendResendInviteEmail(user.email, user.name, actionLink);

      return { success: true };
    } catch (error) {
      if ((error as Error).message === "RATE_LIMIT_EXCEEDED") return { success: false, error: "rateLimitExceeded" };
      console.error("[requestNewInviteAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const searchStudentsAction = permissionAction("material.view")
  .inputSchema(z.object({ term: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const results = await userService.searchStudents(parsedInput.term);
    console.log(`[searchStudentsAction] term="${parsedInput.term}", found ${results.length} students:`, results.map(s => s.name));
    return results;
  });

export const searchUsersAction = protectedAction
  .inputSchema(z.object({ term: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    // Apenas admin pode buscar todos os usuários
    if (ctx.user.role !== "admin") throw new Error("UNAUTHORIZED");
    return userService.searchUsers(parsedInput.term);
  });

export const getTeachersAction = protectedAction
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      const data = await userService.getAllTeachers();
      return { success: true, data };
    } catch (error) {
      console.error("[getTeachersAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const toggleNotificationAction = protectedAction
  .inputSchema(z.object({ type: z.enum(["push", "app"]), enabled: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    await userService.toggleNotification(ctx.user.id, parsedInput.type, parsedInput.enabled);
    revalidatePath("/hub/student/settings");
    return { success: true };
  });

export const updateUserAction = adminAction
  .inputSchema(updateUserSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      await userService.updateUser(id, data);
      revalidatePath("/hub/admin/users");
      revalidatePath(`/hub/admin/users/${id}`);
      revalidatePath("/hub/manager/users");
      revalidatePath(`/hub/manager/users/${id}`);
      return { success: true };
    } catch (error) {
      console.error("[updateUserAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const revealSensitiveDataAction = adminAction
  .inputSchema(
    z.object({
      userId: z.string(),
      field: z.enum(["cellphone", "taxId", "businessTaxId", "pixKey"]),
      password: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId, field, password } = parsedInput;

      // Verify admin password (Sudo Mode)
      const isValid = await verifySudoMode(ctx.user.id, ctx.user.email!, password);
      if (!isValid) return { success: false, error: "authError" };

      const user = await userService.getUserById(userId);
      if (!user) return { success: false, error: "userNotFound" };

      const value = user[field as keyof typeof user] as string | null;
      if (!value) return { success: true, data: "" };

      // Decrypt if it has the separator
      const decryptedValue = value.includes(":") ? decrypt(value) : value;

      return { success: true, data: decryptedValue };
    } catch (error) {
      console.error("[revealSensitiveDataAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const claimWordOfTheDayXPAction = protectedAction
  .action(async ({ ctx }) => {
    await userService.addXP(ctx.user.id, 10);
    revalidatePath("/hub/student/notebook");
    return { success: true };
  });

export const requestStudentDeactivationAction = adminAction
  .inputSchema(
    z.object({
      userId: z.string(),
      password: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId, password } = parsedInput;

      // 1. Sudo Mode Verification
      const isValid = await verifySudoMode(ctx.user.id, ctx.user.email!, password);
      if (!isValid) return { success: false, error: "authError" };

      // 2. Resolve Services and Repositories (Dynamic imports)
      const { contractService } = await import("../contract/contract.service");
      const { contractRepository } = await import("../contract/contract.repository");

      // 3. Find active (signed) contract for the student
      const contracts = await contractRepository.findUserInstances(userId);
      const activeContract = contracts.find((c) => c.status === "signed");

      if (!activeContract) {
        const { schedulingService } = await import("../scheduling/scheduling.service");
        await schedulingService.cancelFutureClassesForStudent(userId);
        await userService.updateUser(userId, { isActive: false });
        revalidatePath("/hub/admin/users");
        revalidatePath("/hub/manager/users");
        return { success: true, feeRequired: false };
      }

      const result = await contractService.requestCancellation(activeContract.id);

      revalidatePath("/hub/admin/users");
      revalidatePath("/hub/manager/users");

      return result;
    } catch (error) {
      console.error("[requestStudentDeactivationAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });
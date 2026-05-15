"use server";

import { cookies } from "next/headers";
import { actionClient, protectedAction, permissionAction, adminAction } from "@/lib/safe-action";
import crypto from "node:crypto";
import { userService } from "./user.service";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { revalidatePath } from "next/cache";
import { adminAuth } from "@/lib/firebase-admin";
import { NewUser, createUserSchema, requestNewInviteSchema, updateUserSchema, notificationPrefsSchema, lgpdConsentSchema } from "./user.schema";
import { env } from "@/env";
import { communicationService } from "@/modules/communication/communication.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { decrypt } from "@/lib/cryptography";
import { verifySudoMode, getCurrentUser } from "@/lib/auth-server";

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
  .metadata({ name: "login" })
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

      // Check if MFA is enabled for this user
      const user = await userService.getUserById(uid);
      const sessionCookie = await userService.createSessionCookie(idToken, rememberMe);
      const cookieStore = await cookies();
      const maxAge = rememberMe ? 60 * 60 * 24 * 14 : 60 * 60 * 24 * 7; // 14 days or 1 week

      if (user?.mfaEnabled) {
        // Set a temporary "mfa_pending" cookie instead of "session"
        cookieStore.set("mfa_pending", sessionCookie, {
          maxAge: 300, // 5 minutes
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
        });
        
        // Also store rememberMe flag temporarily if needed, or pass it from UI
        // We'll pass it from UI for simplicity in VerifyMfaVault
        return { success: true, mfaRequired: true };
      }

      // Standard login (No MFA)
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

export const verifyMfaLoginAction = actionClient
  .metadata({ name: "verifyMfaLogin" })
  .inputSchema(z.object({ 
    token: z.string().length(6),
    rememberMe: z.boolean().optional().default(false)
  }))
  .action(async ({ parsedInput }) => {
    try {
      const cookieStore = await cookies();
      const mfaPendingCookie = cookieStore.get("mfa_pending");
      if (!mfaPendingCookie) return { success: false, error: "sessionExpired" };

      const sessionCookie = mfaPendingCookie.value;
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      
      const isValid = await userService.verifyMfaToken(decodedClaims.uid, parsedInput.token);
      if (!isValid) return { success: false, error: "invalidToken" };

      // Success! Set the real session cookie
      cookieStore.set("session", sessionCookie, {
        maxAge: parsedInput.rememberMe ? 60 * 60 * 24 * 14 : 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });
      
      cookieStore.delete("mfa_pending");
      return { success: true };
    } catch (error) {
      console.error("[verifyMfaLoginAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const logoutAction = actionClient
  .metadata({ name: "logout" })
  .action(async () => {
  try {
    const user = await getCurrentUser();
    
    // If we have a user, revoke all sessions in Firebase Admin
    if (user) {
      await userService.revokeSessions(user.id);
    }

    // Always clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("session");
    cookieStore.delete("mfa_pending");

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[logoutAction] Error:", error);
    throw new Error("Failed to logout");
  }
});

export const syncUserAction = protectedAction
  .metadata({ name: "syncUser" })
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
  .metadata({ name: "createUser" })
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
  .metadata({ name: "updateNotificationPrefs" })
  .schema(notificationPrefsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await userService.updateNotificationPrefs(ctx.user.id, parsedInput);
    return { success: true };
  });

export const resendInviteAction = permissionAction("user.create")
  .metadata({ name: "resendInvite" })
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
  .metadata({ name: "requestNewInvite" })
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
  .metadata({ name: "searchStudents" })
  .inputSchema(z.object({ term: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      // 1. Rate Limit: 10 searches per minute per user
      const rateLimit = await checkRateLimit("search_students", ctx.user.id, 10, 60 * 1000);
      if (!rateLimit.success) throw new Error("RATE_LIMIT_EXCEEDED");

      const results = await userService.searchStudents(parsedInput.term);
      
      // 2. Safe Logging (GDPR/LGPD): Redact terms, log count
      const hashedTerm = crypto.createHash("sha256").update(parsedInput.term).digest("hex").substring(0, 8);
      console.log(`[searchStudentsAction] user=${ctx.user.id} term_hash=${hashedTerm} found=${results.length}`);

      // 3. Prevent Data Leakage: Return only non-sensitive fields
      const data = results.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        photoUrl: s.photoUrl,
      }));

      return { success: true, data };
    } catch (error) {
      if ((error as Error).message === "RATE_LIMIT_EXCEEDED") return { success: false, error: "rateLimitExceeded" };
      console.error("[searchStudentsAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const searchUsersAction = protectedAction
  .metadata({ name: "searchUsers" })
  .inputSchema(z.object({ term: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      // Apenas admin pode buscar todos os usuários
      if (ctx.user.role !== "admin") return { success: false, error: "UNAUTHORIZED" };
      const data = await userService.searchUsers(parsedInput.term);
      return { success: true, data };
    } catch (error) {
      console.error("[searchUsersAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const getTeachersAction = protectedAction
  .metadata({ name: "getTeachers" })
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
  .metadata({ name: "toggleNotification" })
  .inputSchema(z.object({ type: z.enum(["push", "app"]), enabled: z.boolean() }))
  .action(async ({ parsedInput, ctx }) => {
    await userService.toggleNotification(ctx.user.id, parsedInput.type, parsedInput.enabled);
    revalidatePath("/hub/student/settings");
    return { success: true };
  });

export const updateUserAction = adminAction
  .metadata({ name: "updateUser" })
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
  .metadata({ name: "revealSensitiveData" })
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

      // Rate limit: 5 reveals per hour to prevent brute-force or abuse
      const limit = await checkRateLimit("sudo_reveal", ctx.user.id, 5, 3600 * 1000);
      if (!limit.success) return { success: false, error: "rateLimitExceeded" };

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
  .metadata({ name: "claimWordOfTheDayXP" })
  .action(async ({ ctx }) => {
    await userService.addXP(ctx.user.id, 10);
    revalidatePath("/hub/student/notebook");
    return { success: true };
  });

export const requestStudentDeactivationAction = adminAction
  .metadata({ name: "requestStudentDeactivation" })
  .inputSchema(
    z.object({
      userId: z.string(),
      password: z.string(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId, password } = parsedInput;

      // Rate limit: 3 deactivations per hour to prevent brute-force or destructive abuse
      const limit = await checkRateLimit("sudo_deactivate", ctx.user.id, 3, 3600 * 1000);
      if (!limit.success) return { success: false, error: "rateLimitExceeded" };

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

export const getStudentLanguagesAction = protectedAction
  .metadata({ name: "getStudentLanguages" })
  .action(async ({ ctx }) => {
    const user = await userService.getUserById(ctx.user.id);
    return user?.languages || [];
  });

export const generateMfaSecretAction = protectedAction
  .metadata({ name: "generateMfaSecret" })
  .action(async ({ ctx }) => {
    try {
      const result = await userService.generateMfaSecret(ctx.user.id);
      return { success: true, data: result };
    } catch (error) {
      console.error("[generateMfaSecretAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const enrollMfaAction = protectedAction
  .metadata({ name: "enrollMfa" })
  .inputSchema(z.object({
    secret: z.string().min(1),
    token: z.string().length(6),
  }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const success = await userService.verifyAndEnableMfa(ctx.user.id, parsedInput.secret, parsedInput.token);
      if (!success) return { success: false, error: "invalidToken" };
      
      revalidatePath("/hub/student/settings");
      return { success: true };
    } catch (error) {
      console.error("[enrollMfaAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const disableMfaAction = protectedAction
  .metadata({ name: "disableMfa" })
  .action(async ({ ctx }) => {
    try {
      await userService.disableMfa(ctx.user.id);
      revalidatePath("/hub/student/settings");
      return { success: true };
    } catch (error) {
      console.error("[disableMfaAction] Error:", error);
      return { success: false, error: "error" };
    }
  });

export const updateLocaleAction = protectedAction
  .metadata({ name: "updateLocale" })
  .schema(z.object({ locale: z.enum(locales) }))
  .action(async ({ parsedInput, ctx }) => {
    await userService.updateUser(ctx.user.id, { locale: parsedInput.locale });
    revalidatePath("/hub/student/settings");
    return { success: true } as { success: boolean; error?: string };
  });

export const syncUserPhotoAction = protectedAction
  .metadata({ name: "syncUserPhoto" })
  .schema(z.object({ photoUrl: z.string().url() }))
  .action(async ({ parsedInput, ctx }) => {
    await userService.updateUser(ctx.user.id, { photoUrl: parsedInput.photoUrl });
    revalidatePath("/hub/student/settings");
    return { success: true } as { success: boolean; error?: string };
  });

export const requestSelfCancellationAction = protectedAction
  .metadata({ name: "requestSelfCancellation" })
  .action(async ({ ctx }) => {
    try {
      const { contractRepository } = await import("../contract/contract.repository");
      const { contractService } = await import("../contract/contract.service");
      const { communicationService } = await import("../communication/communication.service");

      // 1. Encontra contrato assinado (ativo)
      const contracts = await contractRepository.findUserInstances(ctx.user.id);
      const activeContract = contracts.find((c) => c.status === "signed");

      if (!activeContract) {
        // Sem contrato: cancela direto
        const { schedulingService } = await import("../scheduling/scheduling.service");
        await schedulingService.cancelFutureClassesForStudent(ctx.user.id);
        await userService.updateUser(ctx.user.id, { isActive: false });
        await communicationService.sendFarewellEmail(ctx.user.email, ctx.user.name);
        return { success: true, feeRequired: false };
      }

      // 2. Verifica se há taxa de cancelamento
      const result = (await contractService.requestCancellation(activeContract.id)) as { success: boolean; feeRequired: boolean; pixCode?: string; pixImage?: string; amount?: number; error?: string };

      if (result.feeRequired) {
        // Se houver taxa, marca como pendente e armazena info do PIX
        await userService.updateUser(ctx.user.id, {
          cancellationPending: true,
          cancellationPixCode: result.pixCode,
          cancellationPixImage: result.pixImage,
          cancellationAmount: result.amount,
        });
      } else {
        // Se não houve taxa (o finalizedCancellation já foi chamado no service), envia e-mail
        await communicationService.sendFarewellEmail(ctx.user.email, ctx.user.name);
      }

      revalidatePath("/hub/student/settings");
      return result as { success: boolean; error?: string; feeRequired?: boolean; pixCode?: string; pixImage?: string; amount?: number };
    } catch (error) {
      console.error("[requestSelfCancellationAction] Error:", error);
      return { success: false, error: (error as Error).message } as { success: boolean; error?: string; feeRequired?: boolean };
    }
  });

export const getUserStatusAction = protectedAction
  .metadata({ name: "getUserStatus" })
  .action(async ({ ctx }) => {
    const user = await userService.getUser(ctx.user.id);
    return { isActive: user?.isActive, cancellationPending: user?.cancellationPending } as { isActive?: boolean; cancellationPending?: boolean; success: boolean; error?: string };
  });

export const acceptLegalTermsAction = protectedAction
  .metadata({ name: "acceptLegalTerms" })
  .inputSchema(lgpdConsentSchema)
  .action(async ({ parsedInput, ctx }) => {
    await userService.recordConsent(ctx.user.id, parsedInput.acceptedTermsVersion, parsedInput.guardianConsent);
    revalidatePath("/");
    return { success: true };
  });

export const exportMyDataAction = protectedAction
  .metadata({ name: "exportMyData" })
  .inputSchema(z.object({ password: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // 1. Verify Sudo Mode (Identity confirmation before exporting PII)
    const isValid = await verifySudoMode(ctx.user.id, ctx.user.email!, parsedInput.password);
    if (!isValid) return { success: false, error: "authError" };

    const data = await userService.exportData(ctx.user.id);
    return { success: true, data };
  });

export const requestPermanentDeletionAction = protectedAction
  .metadata({ name: "requestPermanentDeletion" })
  .inputSchema(z.object({ password: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // 1. Verify Sudo Mode (Identity confirmation before destructive action)
    const isValid = await verifySudoMode(ctx.user.id, ctx.user.email!, parsedInput.password);
    if (!isValid) return { success: false, error: "authError" };

    // 2. Perform purge
    await userService.purgeUserData(ctx.user.id);

    // 3. Clear session
    const cookieStore = await cookies();
    cookieStore.delete("session");

    return { success: true };
  });
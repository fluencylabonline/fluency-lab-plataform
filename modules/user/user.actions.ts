"use server";

import { cookies } from "next/headers";
import { actionClient, protectedAction } from "@/lib/safe-action";
import { userService } from "./user.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { adminAuth } from "@/lib/firebase-admin";
import { NewUser } from "./user.schema";

/**
 * Login action — creates a session cookie from a Firebase ID Token.
 */
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
        if ((error as Error).message === "NOT_INVITED") {
          return { success: false, error: "notInvited" };
        }
        throw error;
      }

      const sessionCookie = await userService.createSessionCookie(idToken);
      const cookieStore = await cookies();
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

      cookieStore.set("session", sessionCookie, {
        maxAge: maxAge,
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

/**
 * Logout action — clears the session cookie and revokes tokens.
 */
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

import { rateLimit } from "@/lib/rate-limit";

/**
 * Sync user profile action — updates DB with fresh data from Firebase.
 */
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
      // Rate limit: Max 5 updates per hour per user
      await rateLimit(`${ctx.user.id}:sync_profile`, 5, 3600);

      await userService.syncUser(ctx.user.id, parsedInput);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      if ((error as Error).message === "RATE_LIMIT_EXCEEDED") {
        return { success: false, error: "rateLimitExceeded" };
      }
      console.error("[syncUserAction] Error:", error);
      throw new Error("Failed to sync profile");
    }
  });

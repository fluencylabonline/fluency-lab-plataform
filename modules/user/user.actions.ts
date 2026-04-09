"use server";

import { cookies } from "next/headers";
import { actionClient, protectedAction } from "@/lib/safe-action";
import { userService } from "./user.service";
import { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * Login action — creates a session cookie from a Firebase ID Token.
 */
export const loginAction = actionClient
  .inputSchema(
    z.object({
      idToken: z.string().min(1),
    })
  )
  .action(async ({ parsedInput: { idToken } }) => {
    try {
      const sessionCookie = await userService.createSessionCookie(idToken);
      const cookieStore = await cookies();

      cookieStore.set("session", sessionCookie, {
        maxAge: 60 * 60 * 24 * 5, // 5 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });

      return { success: true };
    } catch (error) {
      console.error("[loginAction] Error:", error);
      throw new Error("Failed to create session");
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
      await userService.syncUser(ctx.user.id, parsedInput);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("[syncUserAction] Error:", error);
      throw new Error("Failed to sync profile");
    }
  });

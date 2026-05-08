import { cache } from "react";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";
import { userRepository } from "@/modules/user/user.repository";
import { type Permission, hasPermission } from "./rbac";
import type { User } from "@/modules/user/user.schema";

/**
 * Get the current authenticated user from the session cookie.
 * Uses React `cache()` for request deduplication.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) return null;

    // 1. Verify session cookie with Firebase Admin
    // checkRevoked: true ensures we catch revoked tokens
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (!decodedClaims) return null;

    // 2. Fetch user data from our database
    const user = await userRepository.findById(decodedClaims.uid);

    return user ?? null;
  } catch (error) {
    // Only log if it's not a revoked session error
    if ((error as { code?: string })?.code !== "auth/session-cookie-revoked") {
      console.error("[getCurrentUser] Error verifying session:", error);
    }
    return null;
  }
});

/**
 * Server-side check for permission.
 * Throws an error if the user doesn't have the permission.
 */
export async function checkPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!hasPermission(user, permission)) {
    throw new Error("Unauthorized: Missing required permission");
  }
}

/**
 * Checks if the user has one of the allowed roles.
 * Redirects to the hub root if not authorized.
 */
import { redirect } from "next/navigation";
import { type Role } from "./rbac";

export async function requireRole(allowedRoles: Role | Role[]) {
  const user = await getCurrentUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user || !roles.includes(user.role)) {
    redirect("/hub");
  }

  return user;
}

/**
 * Verifies the user's password using Firebase Auth REST API.
 * Useful for "sudo" mode or sensitive actions.
 */
export async function verifyPassword(email: string, password: string): Promise<boolean> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();
    return response.ok && !!data.idToken;
  } catch (error) {
    console.error("[verifyPassword] Error:", error);
    return false;
  }
}

/**
 * Checks if a user has a password set (vs just Google Auth).
 */
export async function checkUserHasPassword(uid: string): Promise<boolean> {
  try {
    const firebaseUser = await adminAuth.getUser(uid);
    return firebaseUser.providerData.some((p) => p.providerId === "password");
  } catch (error) {
    console.error("[checkUserHasPassword] Error:", error);
    return false;
  }
}

/**
 * Unified sudo-mode check.
 * If user has a password, it's mandatory.
 * If user is Google-only, it's skipped.
 */
export async function verifySudoMode(uid: string, email: string, password?: string): Promise<boolean> {
  const hasPassword = await checkUserHasPassword(uid);
  if (!hasPassword) return true;
  if (!password) return false;
  return verifyPassword(email, password);
}

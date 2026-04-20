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
    console.error("[getCurrentUser] Error verifying session:", error);
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

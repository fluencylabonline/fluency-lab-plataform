import { userRepository } from "./user.repository";
import { adminAuth } from "@/lib/firebase-admin";
import type { User, NewUser } from "./user.schema";

export const userService = {
  /**
   * Syncs a Firebase user with our local database.
   * Called during login to ensure DB is up to date with Firebase Auth.
   *
   * SECURITY: If the user is not found by ID or Email, they are rejected.
   * IDENTITY: If found by email but ID differs, we update the record to claim it.
   */
  /**
   * Syncs a Firebase user with our local database.
   * Called during login to ensure DB is up to date with Firebase Auth.
   *
   * SECURITY: If the user is not found by ID or Email, they are rejected (Invite-only).
   * IDENTITY: Repository handles claiming accounts via email conflict.
   */
  async syncUser(uid: string, data: Partial<NewUser>): Promise<User> {
    const email = data.email?.toLowerCase();
    
    // 1. Find the human (by UID or Email) to verify they are invited
    let existing = await userRepository.findById(uid);
    if (!existing && email) {
      existing = await userRepository.findByEmail(email);
    }

    // 2. Security Gate: If not found in Neon, they are not invited.
    if (!existing) {
      console.warn(`[userService.syncUser] Access Denied: User ${uid} (${email}) not found in Neon.`);
      throw new Error("NOT_INVITED");
    }

    // 3. Atomic Sync & Identity Claiming
    // The repository upsert handles switching IDs if email matches but ID differs.
    return userRepository.upsert({
      ...existing,
      ...data,
      id: uid,
      email: existing.email, // Stay with the DB email (Source of Truth)
    });
  },

  /**
   * Get user by ID.
   */
  async getUser(id: string): Promise<User | undefined> {
    return userRepository.findById(id);
  },

  /**
   * Get user by email.
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    return userRepository.findByEmail(email);
  },

  /**
   * Create a session cookie for a given ID Token.
   */
  async createSessionCookie(idToken: string): Promise<string> {
    console.log("[userService.createSessionCookie] Creating session cookie...");
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    return adminAuth.createSessionCookie(idToken, { expiresIn });
  },

  /**
   * Revoke all sessions for a user.
   */
  async revokeSessions(uid: string): Promise<void> {
    await adminAuth.revokeRefreshTokens(uid);
  },
};

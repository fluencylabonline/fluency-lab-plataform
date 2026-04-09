import { userRepository } from "./user.repository";
import { adminAuth } from "@/lib/firebase-admin";
import type { User, NewUser } from "./user.schema";

export const userService = {
  /**
   * Syncs a Firebase user with our local database.
   * Called during login to ensure DB is up to date with Firebase Auth.
   */
  async syncUser(uid: string, data: Partial<NewUser>): Promise<User> {
    const existing = await userRepository.findById(uid);

    if (!existing) {
      // This should ideally not happen in FluencyLab because users are pre-registered,
      // but we handle it for robustness or first-time setup.
      return userRepository.upsert({
        id: uid,
        email: data.email!,
        name: data.name || "User",
        role: "student", // Default role
        ...data,
      });
    }

    // Update profile data if it changed
    return userRepository.upsert({
      ...existing,
      ...data,
      id: uid,
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

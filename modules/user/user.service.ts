import { userRepository } from "./user.repository";
import { adminAuth } from "@/lib/firebase-admin";
import type { User, NewUser } from "./user.schema";
import { env } from "@/env";
import { communicationService } from "@/modules/communication/communication.service";

export const userService = {
  async syncUser(uid: string, data: Partial<NewUser>): Promise<User> {
    const email = data.email?.toLowerCase();

    let existing = await userRepository.findById(uid);
    if (!existing && email) {
      existing = await userRepository.findByEmail(email);
    }

    if (!existing) {
      throw new Error("NOT_INVITED");
    }

    return userRepository.upsert({
      ...existing,
      ...data,
      id: uid,
      email: existing.email,
    });
  },

  async getUser(id: string): Promise<User | undefined> {
    return userRepository.findById(id);
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    return userRepository.findByEmail(email);
  },

  async createSessionCookie(idToken: string): Promise<string> {
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    return adminAuth.createSessionCookie(idToken, { expiresIn });
  },

  async revokeSessions(uid: string): Promise<void> {
    await adminAuth.revokeRefreshTokens(uid);
  },

  async createUserAndSendInvite(data: Omit<NewUser, "id">): Promise<User> {
    const { ...userData } = data;
    const email = userData.email.toLowerCase();

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new Error("USER_ALREADY_EXISTS");
    }

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        displayName: userData.name,
        emailVerified: true,
      });

      await adminAuth.setCustomUserClaims(userRecord.uid, { role: userData.role });
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };

      if (firebaseError.code === "auth/email-already-exists") {
        userRecord = await adminAuth.getUserByEmail(email);
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: userData.role });
      } else {
        throw error;
      }
    }

    const user = await userRepository.upsert({
      ...userData,
      id: userRecord.uid,
      email,
      isActive: true,
      onboarded: false
    } as NewUser);

    const baseUrl = env.NEXT_PUBLIC_APP_URL.endsWith("/")
      ? env.NEXT_PUBLIC_APP_URL.slice(0, -1)
      : env.NEXT_PUBLIC_APP_URL;

    const actionLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${baseUrl}/signin`,
    });

    await communicationService.sendWelcomeAndSetPasswordEmail(
      email,
      user.name,
      actionLink
    );

    return user;
  },
};
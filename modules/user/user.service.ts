import { userRepository } from "./user.repository";
import { adminAuth } from "@/lib/firebase-admin";
import type { User, NewUser, NotificationPrefs } from "./user.schema";
import { env } from "@/env";
import { communicationService } from "@/modules/communication/communication.service";
import { abacate } from "@/lib/abacate-pay";
import { decrypt } from "@/lib/cryptography";

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

  async getUserById(id: string): Promise<User | undefined> {
    return userRepository.findById(id);
  },

  async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    return userRepository.update(id, data);
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

    // Enviar convite via WhatsApp (se houver telefone)
    if (user.cellphone) {
      await communicationService.sendWelcomeWhatsApp({
        cellphone: user.cellphone,
        name: user.name,
        actionLink
      });
    }

    return user;
  },

  async syncAbacatePayCustomer(userId: string): Promise<string> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("Usuário não encontrado");

    if (user.abacatePayCustomerId) return user.abacatePayCustomerId;

    // Decrypt PII if they are encrypted
    let taxId = user.taxId && user.taxId.includes(":") ? decrypt(user.taxId) : user.taxId;
    const cellphone = user.cellphone && user.cellphone.includes(":") ? decrypt(user.cellphone) : user.cellphone;
    let name = user.name;

    // If minor or has guardian, use guardian data for AbacatePay billing
    if (user.guardianTaxId) {
      taxId = user.guardianTaxId.includes(":") ? decrypt(user.guardianTaxId) : user.guardianTaxId;
      name = user.guardianName || user.name;
      // Cellphone usually stays the same or can be guardian's too, but we use the one provided
    }

    // Create in AbacatePay
    const customer = await abacate.customers.create({
      name,
      email: user.email,
      taxId: taxId || "00000000000", 
      cellphone: cellphone || "00000000000",
      metadata: { userId: user.id } as Record<string, string | number | boolean>,
    });

    await userRepository.update(user.id, {
      abacatePayCustomerId: customer.id,
    });

    return customer.id;
  },

  async searchStudents(term: string): Promise<User[]> {
    return userRepository.searchByTerm(term, "student");
  },

  async searchUsers(term: string): Promise<User[]> {
    return userRepository.searchByTerm(term);
  },

  async getAllUsers(): Promise<User[]> {
    return userRepository.findAll();
  },

  async getAllTeachers(): Promise<User[]> {
    return userRepository.findAllByRole("teacher");
  },

  async toggleNotification(userId: string, type: "push" | "app", enabled: boolean): Promise<User | undefined> {
    return userRepository.updateNotificationSettings(userId, {
      [type === "push" ? "pushNotificationsEnabled" : "appNotificationsEnabled"]: enabled,
    });
  },

  async updateGamification(userId: string, data: { xp?: number, streak?: number, lastPracticeDate?: Date }): Promise<User | undefined> {
    const updateData: { currentXP?: number, streakCount?: number, lastPracticeDate?: Date } = {};
    if (data.xp !== undefined) updateData.currentXP = data.xp;
    if (data.streak !== undefined) updateData.streakCount = data.streak;
    if (data.lastPracticeDate !== undefined) updateData.lastPracticeDate = data.lastPracticeDate;
    
    return userRepository.updateGamification(userId, updateData);
  },

  async updateNotificationPrefs(userId: string, prefs: NotificationPrefs): Promise<User | undefined> {
    return userRepository.updateNotificationPrefs(userId, prefs);
  },

  async countActiveStudents(): Promise<number> {
    return userRepository.countActiveStudents();
  },
};
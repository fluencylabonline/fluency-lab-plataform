import { userRepository } from "./user.repository";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";
import type { User, NewUser, NotificationPrefs, SettingsUserDTO, AdminUserDTO } from "./user.schema";
import { env } from "@/env";
import { communicationService } from "@/modules/communication/communication.service";
import { abacate } from "@/lib/abacate-pay";
import { encrypt, decrypt } from "@/lib/cryptography";
import { mapEloToCEFR } from "@/lib/adaptive-scoring";
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from "otplib";

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

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

  async createSessionCookie(idToken: string, rememberMe = false): Promise<string> {
    const expiresIn = rememberMe ? 60 * 60 * 24 * 14 * 1000 : 60 * 60 * 24 * 7 * 1000;
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
      actionLink,
      undefined,
      user.locale as "pt" | "en"
    );

    // Enviar convite via WhatsApp (se houver telefone)
    if (user.cellphone) {
      await communicationService.sendWelcomeWhatsApp(
        {
          cellphone: user.cellphone,
          name: user.name,
          actionLink
        },
        user.locale as "pt" | "en"
      );
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

  async getUsersByRole(role: "admin" | "teacher" | "student" | "manager"): Promise<User[]> {
    return userRepository.findAllByRole(role);
  },

  async getActiveAdminsAndManagers(): Promise<User[]> {
    return userRepository.findActiveAdminsAndManagers();
  },

  async toggleNotification(userId: string, type: "push" | "app", enabled: boolean): Promise<User | undefined> {
    return userRepository.updateNotificationSettings(userId, {
      [type === "push" ? "pushNotificationsEnabled" : "appNotificationsEnabled"]: enabled,
    });
  },

  async addXP(userId: string, amount: number): Promise<User | undefined> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    return userRepository.updateGamification(userId, {
      currentXP: (user.currentXP || 0) + amount,
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

  getLevelInfo(elo: number) {
    const code = mapEloToCEFR(elo);
    
    const levels: Record<string, { label: string, min: number, max: number }> = {
      "A1": { label: "Beginner", min: 0, max: 274 },
      "A2": { label: "Elementary", min: 275, max: 424 },
      "B1": { label: "Intermediate", min: 425, max: 574 },
      "B2": { label: "Upper Intermediate", min: 575, max: 724 },
      "C1": { label: "Advanced", min: 725, max: 874 },
      "C2": { label: "Proficient", min: 875, max: 1200 },
    };

    return {
      code,
      ...levels[code]
    };
  },

  async generateMfaSecret(userId: string): Promise<{ secret: string; otpAuthUrl: string }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const secret = totp.generateSecret();
    const otpAuthUrl = totp.toURI({ 
      label: user.email, 
      issuer: "FluencyLab", 
      secret 
    });

    return { secret, otpAuthUrl };
  },

  async verifyAndEnableMfa(userId: string, secret: string, token: string): Promise<boolean> {
    const result = await totp.verify(token, { secret });
    if (!result.valid) return false;

    await userRepository.update(userId, {
      mfaSecret: encrypt(secret),
      mfaEnabled: true,
    });

    return true;
  },

  async disableMfa(userId: string): Promise<void> {
    await userRepository.update(userId, {
      mfaSecret: null,
      mfaEnabled: false,
    });
  },

  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) return false;

    const decryptedSecret = decrypt(user.mfaSecret);
    const result = await totp.verify(token, { secret: decryptedSecret });
    return result.valid;
  },

  async recordConsent(userId: string, version: string, guardianConsent: boolean) {
    return userRepository.updateLgpdConsent(userId, {
      acceptedTermsVersion: version,
      guardianConsent,
    });
  },

  async exportData(userId: string) {
    const rawData = await userRepository.getComprehensiveUserData(userId);
    if (!rawData) throw new Error("USER_NOT_FOUND");

    // Decrypt sensitive data for the portability report
    return {
      ...rawData,
      taxId: rawData.taxId && rawData.taxId.includes(":") ? decrypt(rawData.taxId) : rawData.taxId,
      businessTaxId: rawData.businessTaxId && rawData.businessTaxId.includes(":") ? decrypt(rawData.businessTaxId) : rawData.businessTaxId,
      address: rawData.address && rawData.address.includes(":") ? decrypt(rawData.address) : rawData.address,
      guardianTaxId: rawData.guardianTaxId && rawData.guardianTaxId.includes(":") ? decrypt(rawData.guardianTaxId) : rawData.guardianTaxId,
      pixKey: rawData.pixKey && rawData.pixKey.includes(":") ? decrypt(rawData.pixKey) : rawData.pixKey,
      mfaSecret: undefined, // SECURITY: Never export security secrets
    };
  },

  async purgeUserData(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    // 1. Send Farewell Email before deleting access
    try {
      await communicationService.sendFarewellEmail(user.email, user.name, user.locale as "pt" | "en");
    } catch (e) {
      console.error("[LGPD] Failed to send farewell email:", e);
      // We continue even if email fails
    }

    // 2. Anonymize in Database (Keeps relations for 5 years legal retention, but severs identity)
    await userRepository.anonymize(userId);

    // 3. Revoke sessions and delete from Firebase Auth (Immediate removal of access)
    try {
      await adminAuth.revokeRefreshTokens(userId);
      await adminAuth.deleteUser(userId);
    } catch (e) {
      console.error("[LGPD] Failed to delete Firebase Auth user:", e);
      // We continue even if Firebase deletion fails, as anonymization in DB is the primary requirement
    }

    // 4. Delete files from Firebase Storage (Documents, Certificates, Avatars)
    try {
      const bucket = adminStorage.bucket();
      const storagePaths = [
        `documents/${userId}/`,
        `certificates/${userId}/`,
        `avatars/${userId}`,
      ];

      for (const path of storagePaths) {
        const [files] = await bucket.getFiles({ prefix: path });
        if (files.length > 0) {
          await Promise.all(files.map((file) => file.delete()));
          console.log(`[LGPD] Deleted ${files.length} files from ${path} for user ${userId}`);
        }
        
        // Also try to delete as a direct file (for avatars/userId which might not have a trailing slash)
        const file = bucket.file(path);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`[LGPD] Deleted direct file ${path} for user ${userId}`);
        }
      }
    } catch (e) {
      console.error("[LGPD] Failed to cleanup storage:", e);
    }

    // 5. Delete from AbacatePay
    if (user.abacatePayCustomerId) {
      try {
        await abacate.customers.delete(user.abacatePayCustomerId);
        console.log(`[LGPD] Deleted AbacatePay customer ${user.abacatePayCustomerId}`);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        // Se o cliente não existir no AbacatePay, consideramos sucesso (já está limpo)
        if (message.includes("Not found")) {
          console.warn(`[LGPD] AbacatePay customer ${user.abacatePayCustomerId} already gone or not found.`);
        } else {
          console.error("[LGPD] Failed to delete AbacatePay customer:", e);
        }
      }
    }
  },

  maskCellphone(rawPhone: string | null): string | null {
    if (!rawPhone) return null;
    const digits = rawPhone.replace(/\D/g, "");
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}****-${digits.slice(7)}`;
    } else if (digits.length === 13 && digits.startsWith("55")) {
      const local = digits.slice(2);
      return `(${local.slice(0, 2)}) ${local.slice(2, 3)}****-${local.slice(7)}`;
    } else if (digits.length >= 10) {
      return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
    }
    return `(••) •••••-${digits.slice(-4)}`;
  },

  sanitizeUserForSettings(user: User): SettingsUserDTO {
    const decryptedCellphone = user.cellphone && user.cellphone.includes(":") 
      ? decrypt(user.cellphone) 
      : user.cellphone;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "teacher" | "student" | "manager",
      photoUrl: user.photoUrl,
      mfaEnabled: user.mfaEnabled,
      cellphone: this.maskCellphone(decryptedCellphone),
      locale: (user.locale || "pt") as "pt" | "en",
    };
  },

  sanitizeUserForAdmin(user: User): AdminUserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "teacher" | "student" | "manager",
      photoUrl: user.photoUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      teacherHourlyRate: user.teacherHourlyRate || 4200,
    };
  }
};
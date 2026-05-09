import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  verifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Standard result type for all authClient operations.
 * The component NEVER needs try/catch — it just checks result.success.
 */
export type AuthResult<T = undefined> =
  | { success: true; data?: T; mfaRequired?: boolean }
  | { success: false; error: string; mfaRequired?: boolean };

/**
 * Known Firebase error codes that are "expected" and should be silenced.
 * (e.g. user closed the Google popup intentionally)
 */
const SILENT_FIREBASE_ERRORS = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

function getFirebaseErrorMessage(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: string }).code;
    if (SILENT_FIREBASE_ERRORS.has(code)) return null;
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
      return "invalidCredentials";
    }
    if (code === "auth/too-many-requests") return "tooManyRequests";
    if (code === "auth/user-disabled") return "userDisabled";
    if (code === "auth/expired-action-code") return "linkExpired";
    if (code === "auth/invalid-action-code") return "invalidLink";
    if (code === "auth/weak-password") return "weakPassword";
  }
  return "error";
}

/**
 * Client-side authentication utilities.
 *
 * PATTERN: All methods return AuthResult — never throw.
 * Components call these methods and display result.error via notify.error().
 * No try/catch in components. No inline error state.
 */
export const authClient = {
  /**
   * 0. Get current user (Client-side)
   */
  getUser() {
    return auth.currentUser;
  },

  /**
   * 1. Login with Email/Password
   */
  async signIn(email: string, password: string, rememberMe = false): Promise<AuthResult<FirebaseUser>> {
    try {
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      }
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, data: credential.user };
    } catch (error) {
      const key = getFirebaseErrorMessage(error);
      if (!key) return { success: false, error: "" }; // silent
      return { success: false, error: key };
    }
  },

  /**
   * 2. Login with Google
   */
  async signInWithGoogle(rememberMe = false): Promise<AuthResult<FirebaseUser>> {
    try {
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      }
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      return { success: true, data: credential.user };
    } catch (error) {
      const key = getFirebaseErrorMessage(error);
      if (!key) return { success: false, error: "" };
      return { success: false, error: key };
    }
  },

  /**
   * 3. Create a server-side session cookie from a Firebase ID Token
   * Uses Server Action loginAction (never fetch /api)
   */
  async createSession(user: FirebaseUser, rememberMe = false): Promise<AuthResult> {
    try {
      const idToken = await user.getIdToken();
      const { loginAction } = await import("@/modules/user/user.actions");

      const result = await loginAction({
        idToken,
        rememberMe,
        name: user.displayName || undefined,
        photoUrl: user.photoURL || undefined,
        googleLinked: user.providerData.some((p) => p.providerId === "google.com"),
      });

      if (!result?.data?.success) {
        return {
          success: false,
          error: result?.data?.error || "error"
        };
      }

      return { 
        success: true, 
        mfaRequired: !!result.data.mfaRequired 
      };
    } catch {
      return { success: false, error: "error" };
    }
  },

  /**
   * 4. Sync Firebase profile data to our PostgreSQL DB
   * Uses Server Action syncUserAction
   */
  async syncUser(user: FirebaseUser): Promise<AuthResult> {
    try {
      const { syncUserAction } = await import("@/modules/user/user.actions");
      const result = await syncUserAction({
        name: user.displayName || undefined,
        photoUrl: user.photoURL || undefined,
        googleLinked: user.providerData.some((p) => p.providerId === "google.com"),
      });
      if (!result?.data?.success) return { success: false, error: "error" };
      return { success: true };
    } catch {
      return { success: false, error: "error" };
    }
  },

  /**
   * 5. Full logout — Firebase + backend session
   * Uses Server Action logoutAction
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      const { logoutAction } = await import("@/modules/user/user.actions");
      await logoutAction();

      // Clear the persistent user store
      const { useUserStore } = await import("@/modules/user/user.store");
      useUserStore.getState().clearUser();
    } catch (error) {
      console.error("[authClient.signOut] Error:", error);
    } finally {
      window.location.href = "/signin";
    }
  },

  /**
   * 6. Verify password reset code (oobCode)
   * Returns the email address associated with the code.
   */
  async verifyPasswordReset(oobCode: string): Promise<AuthResult<string>> {
    try {
      const email = await verifyPasswordResetCode(auth, oobCode);
      return { success: true, data: email };
    } catch (error) {
      const key = getFirebaseErrorMessage(error);
      return { success: false, error: key || "error" };
    }
  },

  /**
   * 7. Confirm password reset
   */
  async confirmPasswordReset(oobCode: string, password: string): Promise<AuthResult> {
    try {
      await firebaseConfirmPasswordReset(auth, oobCode, password);
      return { success: true };
    } catch (error) {
      const key = getFirebaseErrorMessage(error);
      return { success: false, error: key || "error" };
    }
  },

  /**
   * 8. Send password reset email
   */
  async sendPasswordReset(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      const key = getFirebaseErrorMessage(error);
      return { success: false, error: key || "error" };
    }
  },

  /**
   * 9. Update current user password
   * Requires re-authentication with current password.
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
    const user = auth.currentUser;
    if (!user || !user.email) return { success: false, error: "unauthorized" };

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await firebaseUpdatePassword(user, newPassword);
      return { success: true };
    } catch (error) {
      const key = getFirebaseErrorMessage(error);
      return { success: false, error: key || "error" };
    }
  },

  /**
   * 10. Set password for a user (linking EmailAuthProvider)
   * Used for Google-only users who want to add a password.
   */
  async linkPassword(password: string): Promise<AuthResult> {
    const user = auth.currentUser;
    if (!user || !user.email) return { success: false, error: "unauthorized" };

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);
      return { success: true };
    } catch (error) {
      const key = getFirebaseErrorMessage(error);
      return { success: false, error: key || "error" };
    }
  },

  /**
   * 11. Check if MFA is enabled
   */
  async getMfaStatus(): Promise<boolean> {
    const { useUserStore } = await import("@/modules/user/user.store");
    const user = useUserStore.getState().user;
    return !!user?.mfaEnabled;
  },

  /**
   * 12. Generate TOTP secret for MFA enrollment
   */
  async getTotpSecret(): Promise<AuthResult<{ secret: string; otpAuthUrl: string }>> {
    try {
      const { generateMfaSecretAction } = await import("@/modules/user/user.actions");
      const result = await generateMfaSecretAction();
      
      if (!result?.data?.success || !result.data.data) {
        return { success: false, error: "error" };
      }

      return { success: true, data: result.data.data };
    } catch (error) {
      console.error("[getTotpSecret] Error:", error);
      return { success: false, error: "error" };
    }
  },

  /**
   * 13. Enroll TOTP factor
   */
  async enrollTotp(secret: string, code: string): Promise<AuthResult> {
    try {
      const { enrollMfaAction } = await import("@/modules/user/user.actions");
      const result = await enrollMfaAction({ secret, token: code });
      
      if (!result?.data?.success) {
        return { success: false, error: result?.data?.error || "error" };
      }

      return { success: true };
    } catch (error) {
      console.error("[enrollTotp] Error:", error);
      return { success: false, error: "error" };
    }
  },

  /**
   * 14. Disable MFA
   */
  async disableMfa(): Promise<AuthResult> {
    try {
      const { disableMfaAction } = await import("@/modules/user/user.actions");
      const result = await disableMfaAction();
      
      if (!result?.data?.success) {
        return { success: false, error: "error" };
      }

      return { success: true };
    } catch (error) {
      console.error("[disableMfa] Error:", error);
      return { success: false, error: "error" };
    }
  },
};

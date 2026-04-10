import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Standard result type for all authClient operations.
 * The component NEVER needs try/catch — it just checks result.success.
 */
export type AuthResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

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
   * 1. Login with Email/Password
   */
  async signIn(email: string, password: string): Promise<AuthResult<FirebaseUser>> {
    try {
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
  async signInWithGoogle(): Promise<AuthResult<FirebaseUser>> {
    try {
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
  async createSession(idToken: string, rememberMe = false): Promise<AuthResult> {
    try {
      const { loginAction } = await import("@/modules/user/user.actions");
      const result = await loginAction({ idToken, rememberMe });
      if (!result?.data?.success) return { success: false, error: "error" };
      return { success: true };
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
    } catch (error) {
      console.error("[authClient.signOut] Error:", error);
    } finally {
      window.location.href = "/signin";
    }
  },
};

"use client";

import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCallStore } from "@/hooks/data/use-call-store";
import { generateStreamTokenAction } from "@/modules/call/call.actions";

/**
 * useStudentCallListener — Real-time Firestore listener for students.
 *
 * Watches the student's Firestore document for changes to the `callId` field.
 * When the teacher starts a call (server-side sets callId in Firestore),
 * this hook reacts by:
 * 1. Fetching a Stream token via Server Action (token generation stays server-side)
 * 2. Populating the Zustand call store
 *
 * Scope: Mounted globally (in GlobalVideoCall) for any user with role === 'student',
 * independent of the current route — so a call can be received from anywhere in the app.
 * Cleanup: Clears the call state when the snapshot returns callId: null.
 *
 * @param userId - The authenticated student's Firebase UID
 * @param enabled - Only subscribe when true (prevents unnecessary Firestore reads)
 */
export function useStudentCallListener(userId: string, enabled: boolean) {
  const { setCallState, clearCall } = useCallStore();

  useEffect(() => {
    if (!enabled || !userId) return;

    const studentRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      studentRef,
      async (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const callId = data?.callId as string | null | undefined;
        const notebookId = data?.notebookId as string | null | undefined;

        if (callId) {
          // Same call we already know about — skip. Firestore onSnapshot fires
          // on ANY field change to the user doc, not just callId, so without
          // this guard an unrelated write would reset isPanelHidden and force
          // the panel back open after the student dismissed it.
          if (useCallStore.getState().callState?.callId === callId) return;

          // Teacher has started a (new) call — generate token and populate store
          const result = await generateStreamTokenAction({ userId });

          if (result?.data) {
            setCallState({
              callId,
              streamToken: result.data.token,
              apiKey: result.data.apiKey,
              studentId: userId,
              notebookId: notebookId ?? "",
            });
          }
        } else {
          // callId was cleared (teacher ended call or student left)
          clearCall();
        }
      },
      (error) => {
        console.error("[useStudentCallListener] Firestore error:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, enabled, setCallState, clearCall]);
}

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
 * Scope: Only mounted when role === 'student' AND on the notebook page.
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

        if (callId) {
          // Teacher has started a call — generate token and populate store
          const result = await generateStreamTokenAction({ userId });

          if (result?.data) {
            setCallState({
              callId,
              streamToken: result.data.token,
              apiKey: result.data.apiKey,
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

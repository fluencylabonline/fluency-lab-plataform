"use client";

import { useEffect } from "react";
import { doc, onSnapshot, type FirestoreError } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase-firestore";
import { auth } from "@/lib/firebase-auth";
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
 * Auth: o userId vem da sessão do servidor, mas a regra do Firestore exige
 * request.auth.uid == userId no SDK do navegador. Só assina depois que o
 * Firebase Auth do cliente confirma esse usuário; se a leitura for negada
 * (token ainda não propagado), re-tenta com backoff em vez de morrer calado.
 *
 * @param userId - The authenticated student's Firebase UID
 * @param enabled - Only subscribe when true (prevents unnecessary Firestore reads)
 */
export function useStudentCallListener(userId: string, enabled: boolean) {
  const { setCallState, clearCall } = useCallStore();

  useEffect(() => {
    if (!enabled || !userId) return;

    const MAX_RETRIES = 5;
    let unsubscribeSnapshot: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    let disposed = false;

    const stopSnapshot = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = undefined;
      unsubscribeSnapshot?.();
      unsubscribeSnapshot = undefined;
    };

    const subscribe = () => {
      if (disposed) return;
      stopSnapshot();

      unsubscribeSnapshot = onSnapshot(
        doc(db, "users", userId),
        async (docSnap) => {
          retries = 0;
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
        (error: FirestoreError) => {
          // O Firestore encerra o listener após um erro: sem re-assinar, o aluno
          // deixaria de receber chamadas até recarregar a página.
          unsubscribeSnapshot = undefined;
          if (error.code === "permission-denied" && retries < MAX_RETRIES && !disposed) {
            const delay = 3000 * 2 ** retries;
            retries += 1;
            console.warn(`[useStudentCallListener] permission-denied, retrying in ${delay}ms (${retries}/${MAX_RETRIES})`);
            retryTimer = setTimeout(subscribe, delay);
            return;
          }
          console.error("[useStudentCallListener] Firestore error:", error);
        }
      );
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser?.uid === userId) {
        retries = 0;
        subscribe();
      } else {
        // Cliente Firebase ainda não autenticou (ou é outro usuário): espera.
        stopSnapshot();
      }
    });

    return () => {
      disposed = true;
      unsubscribeAuth();
      stopSnapshot();
    };
  }, [userId, enabled, setCallState, clearCall]);
}

import { create } from "zustand";
import type { CallState } from "@/modules/call/call.types";

/**
 * useCallStore — Zustand store for video call state.
 *
 * Intentionally simple: only holds CallState (callId, token, apiKey).
 * All business logic lives in Server Actions and callService.
 *
 * Scope: This store is used only within the notebook page.
 * Clearing happens when the call ends or the component unmounts.
 */

interface CallStore {
  /** Active call state, or null if no call is in progress */
  callState: CallState | null;

  /** Set the call state (called after startCallAction or when student receives call) */
  setCallState: (state: CallState) => void;

  /** Clear the call state (called after endCall / leaveCall) */
  clearCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  callState: null,

  setCallState: (state) => set({ callState: state }),

  clearCall: () => set({ callState: null }),
}));

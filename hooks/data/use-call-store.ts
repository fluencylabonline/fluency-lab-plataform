import { create } from "zustand";
import type { CallState } from "@/modules/call/call.types";

/**
 * useCallStore — Zustand store for video call state.
 *
 * Intentionally simple: only holds CallState (callId, token, apiKey, studentId, notebookId).
 * All business logic lives in Server Actions and callService.
 *
 * Scope: global — read/written by GlobalVideoCall (mounted once in Providers),
 * so the call survives client-side navigation across the whole app.
 * Clearing happens when the call ends (handleEndCall / handleStudentLeaveCall).
 */

interface CallStore {
  /** Active call state, or null if no call is in progress */
  callState: CallState | null;

  /**
   * True when the student has dismissed the call panel (canceled the join
   * screen, or left an in-progress call) without the teacher ending the
   * call. The call stays active in `callState` so they can get back in —
   * only the intrusive panel is hidden, replaced by a small "join" affordance
   * (ActiveCallIndicator / FloatCallButton).
   */
  isPanelHidden: boolean;

  /** Set the call state (called after startCallAction or when student receives call) */
  setCallState: (state: CallState) => void;

  /** Clear the call state entirely (called when the teacher ends the call) */
  clearCall: () => void;

  /** Hide the call panel without ending the call (student cancel/leave) */
  hidePanel: () => void;

  /** Bring the call panel back after it was hidden */
  showPanel: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  callState: null,
  isPanelHidden: false,

  setCallState: (state) => set({ callState: state, isPanelHidden: false }),

  clearCall: () => set({ callState: null, isPanelHidden: false }),

  hidePanel: () => set({ isPanelHidden: true }),

  showPanel: () => set({ isPanelHidden: false }),
}));

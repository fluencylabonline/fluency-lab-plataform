/**
 * Types for the call module.
 * CallState is what the client uses to hold the active call context.
 */

export type CallState = {
  /** Stream call ID (e.g. "teacherId-studentId") */
  callId: string;
  /** Stream JWT token for the current user — generated server-side */
  streamToken: string;
  /** Stream public API key — safe to expose, returned by server action */
  apiKey: string;
};

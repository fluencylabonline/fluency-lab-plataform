/**
 * Types for the call module.
 * CallState is what the client uses to hold the active call context.
 */

/** Stream-issued credentials for joining a call — what the server actually generates. */
export type StreamCallCredentials = {
  /** Stream call ID (e.g. "teacherId-studentId") */
  callId: string;
  /** Stream JWT token for the current user — generated server-side */
  streamToken: string;
  /** Stream public API key — safe to expose, returned by server action */
  apiKey: string;
};

/**
 * Full client-side call context. Extends the Stream credentials with the
 * studentId/notebookId the caller already knows, so the global call UI can
 * operate (join/leave/end) without depending on route props.
 */
export type CallState = StreamCallCredentials & {
  /** Student who owns this call — needed for leave/end without route props */
  studentId: string;
  /** Notebook this call is attached to */
  notebookId: string;
};

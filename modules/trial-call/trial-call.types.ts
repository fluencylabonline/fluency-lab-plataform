/** Estado público de uma sala, visto pelo visitante no lobby. */
export type TrialRoomPublicState =
  | { status: "not_found" }
  | { status: "ended" }
  | { status: "active"; hostName: string; participants: string[] };

/** Credenciais para entrar na chamada da Stream. */
export type TrialCallCredentials = {
  callId: string;
  streamToken: string;
  apiKey: string;
  userId: string;
  userName: string;
};

export type TrialRequestStatus =
  | { status: "pending" }
  | { status: "denied" }
  | { status: "ended" }
  | { status: "approved"; credentials: TrialCallCredentials };

export type PendingTrialRequest = { id: string; name: string; createdAt: string };

import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { StreamClient } from "@stream-io/node-sdk";
import { env } from "@/env";
import { callService } from "@/modules/call/call.service";
import { userRepository } from "@/modules/user/user.repository";
import { trialCallRepository } from "./trial-call.repository";
import type {
  PendingTrialRequest,
  TrialCallCredentials,
  TrialRequestStatus,
  TrialRoomPublicState,
} from "./trial-call.types";

/**
 * trial-call.service.ts — Aula experimental: sala criada pelo admin, visitantes pedem para entrar
 * e o admin aprova. O token da Stream de um visitante só é emitido depois da aprovação.
 */

const LETTERS = "abcdefghijkmnopqrstuvwxyz";
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;
const GUEST_TOKEN_TTL_S = 3 * 60 * 60;

const pick = (n: number) => Array.from({ length: n }, () => LETTERS[randomInt(LETTERS.length)]).join("");

/** Código curto no formato abc-defg-hij. */
export function generateRoomCode() {
  return `${pick(3)}-${pick(4)}-${pick(3)}`;
}

function streamClient() {
  return new StreamClient(env.NEXT_PUBLIC_STREAM_API_KEY, env.STREAM_SECRET);
}

function guestToken(guestId: string) {
  const now = Math.floor(Date.now() / 1000);
  return streamClient().generateUserToken({ user_id: guestId, exp: now + GUEST_TOKEN_TTL_S, iat: now - 60 });
}

async function createRoom(host: { id: string; name: string }) {
  await trialCallRepository.endStaleRooms(new Date(Date.now() - STALE_AFTER_MS));

  const streamCallId = `trial_${randomUUID()}`;
  await streamClient()
    .video.call("default", streamCallId)
    .getOrCreate({ data: { created_by: { id: host.id, name: host.name } } });

  // Colisão de código é improvável, mas a coluna é única: tenta de novo.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const room = await trialCallRepository.createRoom({ code: generateRoomCode(), hostId: host.id, streamCallId });
      return { code: room.code };
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  throw new Error("Could not create room");
}

/** Quem está na chamada agora (nomes), segundo a Stream. Falha da Stream não derruba o lobby. */
async function currentParticipants(streamCallId: string): Promise<string[]> {
  try {
    const res = await streamClient().video.call("default", streamCallId).get();
    const names = (res.call.session?.participants ?? []).map((p) => p.user.name || p.user.id);
    return Array.from(new Set(names));
  } catch {
    return [];
  }
}

async function getPublicState(code: string): Promise<TrialRoomPublicState> {
  const room = await trialCallRepository.findRoomByCode(code);
  if (!room) return { status: "not_found" };
  if (room.status === "ended") return { status: "ended" };

  const [host, participants] = await Promise.all([
    userRepository.findById(room.hostId),
    currentParticipants(room.streamCallId),
  ]);
  return { status: "active", hostName: host?.name?.split(" ")[0] ?? "", participants };
}

async function requestToJoin(code: string, name?: string) {
  const room = await trialCallRepository.findRoomByCode(code);
  if (!room || room.status !== "active") return null;

  const guestId = `guest_${randomUUID()}`;
  const request = await trialCallRepository.createRequest({
    roomId: room.id,
    guestId,
    name: name?.trim() || "Guest",
  });
  return { requestId: request.id, guestId };
}

async function getRequestStatus(code: string, requestId: string, guestId: string): Promise<TrialRequestStatus> {
  const room = await trialCallRepository.findRoomByCode(code);
  if (!room || room.status !== "active") return { status: "ended" };

  const request = await trialCallRepository.findRequest(requestId);
  // O guestId faz papel de segredo do pedido: sem ele, o status de outro visitante não vaza.
  if (!request || request.roomId !== room.id || request.guestId !== guestId) return { status: "denied" };
  if (request.status !== "approved") return { status: request.status };

  const credentials: TrialCallCredentials = {
    callId: room.streamCallId,
    streamToken: guestToken(request.guestId),
    apiKey: env.NEXT_PUBLIC_STREAM_API_KEY,
    userId: request.guestId,
    userName: request.name,
  };
  return { status: "approved", credentials };
}

async function requireHostRoom(code: string, hostId: string) {
  const room = await trialCallRepository.findRoomByCode(code);
  if (!room || room.hostId !== hostId) throw new Error("unauthorized");
  return room;
}

async function getHostCredentials(code: string, host: { id: string; name: string }): Promise<TrialCallCredentials | null> {
  const room = await trialCallRepository.findRoomByCode(code);
  if (!room || room.hostId !== host.id || room.status !== "active") return null;
  return {
    callId: room.streamCallId,
    streamToken: await callService.generateStreamToken(host.id),
    apiKey: env.NEXT_PUBLIC_STREAM_API_KEY,
    userId: host.id,
    userName: host.name,
  };
}

async function listPending(code: string, hostId: string): Promise<PendingTrialRequest[]> {
  const room = await requireHostRoom(code, hostId);
  const rows = await trialCallRepository.listPendingRequests(room.id);
  return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.createdAt.toISOString() }));
}

async function decide(code: string, requestId: string, approve: boolean, hostId: string) {
  const room = await requireHostRoom(code, hostId);
  const request = await trialCallRepository.findRequest(requestId);
  if (!request || request.roomId !== room.id) throw new Error("unauthorized");
  await trialCallRepository.setRequestStatus(requestId, approve ? "approved" : "denied");
}

async function endRoom(code: string, hostId: string) {
  const room = await requireHostRoom(code, hostId);
  await trialCallRepository.endRoom(room.id);
  try {
    await streamClient().video.call("default", room.streamCallId).end();
  } catch (err) {
    console.error("[trialCallService] Failed to end Stream call:", err);
  }
}

export const trialCallService = {
  createRoom,
  getPublicState,
  requestToJoin,
  getRequestStatus,
  getHostCredentials,
  listPending,
  decide,
  endRoom,
};

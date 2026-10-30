import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { StreamClient } from "@stream-io/node-sdk";
import { env } from "@/env/server";
import { callService } from "@/modules/call/call.service";
import { userRepository } from "@/modules/user/user.repository";
import { aiService } from "@/modules/ai/ai.service";
import { learningRepository } from "@/modules/learning/learning.repository";
import { mergeAudioExtraction, type SurveyResponses } from "@/modules/learning/learning.extraction";
import { parseStreamTranscript } from "@/modules/call/call.transcript";
import { trialCallRepository } from "./trial-call.repository";
import { emptyTrialNotes, type TrialNotes } from "./trial-call.schema";
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
    .getOrCreate({
      data: {
        created_by: { id: host.id, name: host.name },
        // A transcrição fica salva e alimenta o perfil do aluno (ver handleTranscriptionWebhook).
        settings_override: { transcription: { mode: "auto-on", closed_caption_mode: "available", language: "auto" } },
      },
    });

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

/** Leitura/reprocessamento no hub: qualquer admin (a action já exige o papel), não só o anfitrião. */
async function requireRoom(code: string) {
  const room = await trialCallRepository.findRoomByCode(code);
  if (!room) throw new Error("not_found");
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

async function getNotes(code: string, hostId: string): Promise<TrialNotes> {
  const room = await requireHostRoom(code, hostId);
  return room.notes ?? emptyTrialNotes();
}

async function saveNotes(code: string, hostId: string, notes: TrialNotes) {
  const room = await requireHostRoom(code, hostId);
  await trialCallRepository.saveNotes(room.id, notes);
}

/** Rótulos da transcrição: o anfitrião é "Professor"; cada visitante, o nome que informou. */
async function speakerLabels(room: { id: string; hostId: string }) {
  const approved = await trialCallRepository.listApprovedRequests(room.id);
  const guests = new Map(approved.map((r) => [r.guestId, r.name]));
  return (id: string) => (id === room.hostId ? "Professor" : guests.get(id) ?? (id.startsWith("guest_") ? "Visitante" : undefined));
}

async function storeTranscription(roomId: string, hostId: string, rawJsonl: string, labelFor: (id: string) => string | undefined) {
  const text = parseStreamTranscript(rawJsonl, labelFor);
  await trialCallRepository.saveTranscription(roomId, { transcription: text, status: "available" });
  // O perfil é só um rascunho; falha da IA não pode perder a transcrição já salva.
  try {
    await buildProfile(roomId, hostId);
  } catch (err) {
    console.error("[trialCallService] Failed to build profile draft:", err);
  }
}

/** Chamado pelo webhook da Stream quando a transcrição da sala fica pronta. Idempotente. */
async function handleTranscriptionWebhook(streamCallId: string, transcriptionUrl: string) {
  const room = await trialCallRepository.findRoomByStreamCallId(streamCallId);
  if (!room) return;
  try {
    const response = await fetch(transcriptionUrl);
    if (!response.ok) throw new Error(`Failed to download transcription: ${response.statusText}`);
    await storeTranscription(room.id, room.hostId, await response.text(), await speakerLabels(room));
  } catch (err) {
    console.error("[trialCallService] Error fetching transcription:", err);
    await trialCallRepository.saveTranscription(room.id, { status: "failed" });
  }
}

/** Busca a transcrição direto na Stream (quando o webhook não chegou). Retorna false se ainda não existe. */
async function syncTranscription(code: string): Promise<boolean> {
  const room = await requireRoom(code);
  const res = await streamClient().video.call("default", room.streamCallId).listTranscriptions();
  const url = res.transcriptions?.[0]?.url;
  if (!url) return false;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download transcription: ${response.statusText}`);
  await storeTranscription(room.id, room.hostId, await response.text(), await speakerLabels(room));
  return true;
}

/**
 * Cria (ou atualiza) o perfil rascunho do aluno com a IA, a partir da transcrição + anotações.
 * Só preenche campos ainda vazios; o admin revisa e ativa depois.
 */
async function buildProfile(roomId: string, userId: string) {
  const room = await trialCallRepository.findRoomById(roomId);
  if (!room) throw new Error("Room not found");
  if (!room.transcription && !room.notes) throw new Error("Nothing to analyze yet");

  const existing = room.profileId ? await learningRepository.findProfileById(room.profileId) : null;
  const extraction = await aiService.extractStudentProfileFromTranscript({
    transcript: room.transcription ?? "",
    notes: (room.notes as Record<string, unknown> | null) ?? null,
    userId,
  });
  const merged = mergeAudioExtraction(existing?.responses as SurveyResponses | undefined, extraction);

  const profile = await learningRepository.upsertProfile(
    { id: existing?.id, responses: merged.responses, status: "draft" },
    userId
  );
  await trialCallRepository.setProfile(room.id, profile.id);
  return { profileId: profile.id, filled: merged.filled, evidence: merged.evidence };
}

async function buildProfileForAdmin(code: string, adminId: string) {
  const room = await requireRoom(code);
  return buildProfile(room.id, adminId);
}

/** O visitante deixa o e-mail ao fim da chamada. O guestId (uuid) é o segredo do pedido. */
async function saveGuestEmail(code: string, requestId: string, guestId: string, email: string) {
  const room = await trialCallRepository.findRoomByCode(code);
  if (!room) return false;
  const request = await trialCallRepository.findRequest(requestId);
  if (!request || request.roomId !== room.id || request.guestId !== guestId || request.status !== "approved") return false;
  await trialCallRepository.setRequestEmail(requestId, email.toLowerCase());
  return true;
}

/** Ao criar um aluno: se o e-mail bate com o de uma aula experimental, liga o perfil rascunho a ele. */
async function linkProfileByEmail(email: string, studentId: string) {
  const profileId = await trialCallRepository.findUnlinkedProfileByEmail(email);
  if (!profileId) return null;
  try {
    await learningRepository.associateProfileToStudent(profileId, studentId);
    return profileId;
  } catch (err) {
    // O aluno já tem um perfil (índice único): mantém o existente.
    console.error("[trialCallService] Could not link trial profile:", err);
    return null;
  }
}

async function listForAdmin() {
  const rooms = await trialCallRepository.listRoomsWithGuests();
  return rooms.map((room) => {
    const approved = room.requests.filter((r) => r.status === "approved");
    const guest = approved[0] ?? room.requests[0];
    return {
      id: room.id,
      code: room.code,
      status: room.status,
      createdAt: room.createdAt,
      guestName: guest?.name ?? null,
      guestEmail: approved.find((r) => r.email)?.email ?? null,
      transcriptionStatus: room.transcriptionStatus,
      hasNotes: !!room.notes,
      profileId: room.profileId,
      profileStatus: room.profile?.status ?? null,
      studentId: room.profile?.studentId ?? null,
    };
  });
}

async function getTranscript(code: string) {
  const room = await requireRoom(code);
  return { transcription: room.transcription, status: room.transcriptionStatus, notes: room.notes ?? emptyTrialNotes() };
}

export const trialCallService = {
  getNotes,
  saveNotes,
  handleTranscriptionWebhook,
  syncTranscription,
  buildProfile: buildProfileForAdmin,
  saveGuestEmail,
  linkProfileByEmail,
  listForAdmin,
  getTranscript,
  createRoom,
  getPublicState,
  requestToJoin,
  getRequestStatus,
  getHostCredentials,
  listPending,
  decide,
  endRoom,
};

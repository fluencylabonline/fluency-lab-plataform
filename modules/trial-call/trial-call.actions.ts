"use server";

import { headers } from "next/headers";
import { actionClient, adminAction } from "@/lib/safe-action";
import { checkRateLimit } from "@/lib/rate-limit";
import { trialCallService } from "./trial-call.service";
import {
  decideRequestSchema,
  guestEmailSchema,
  requestStatusSchema,
  saveNotesSchema,
  requestToJoinSchema,
  roomCodeInputSchema,
} from "./trial-call.schema";

/**
 * Ações da aula experimental. As públicas devolvem estados como dados (nunca lançam erro
 * esperado) para a tela do visitante mostrar "aguardando", "recusado" ou "encerrada".
 */

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Admin cria a sala e recebe o código do link. */
export const createTrialRoomAction = adminAction
  .metadata({ name: "createTrialRoom" })
  .action(async ({ ctx }) => trialCallService.createRoom({ id: ctx.user.id, name: ctx.user.name }));

export const endTrialRoomAction = adminAction
  .metadata({ name: "endTrialRoom" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    await trialCallService.endRoom(parsedInput.code, ctx.user.id);
    return { ok: true };
  });

/** Admin (anfitrião) pega as credenciais para entrar na própria sala. */
export const getTrialHostCredentialsAction = adminAction
  .metadata({ name: "getTrialHostCredentials" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput, ctx }) => ({
    credentials: await trialCallService.getHostCredentials(parsedInput.code, { id: ctx.user.id, name: ctx.user.name }),
  }));

export const listTrialRequestsAction = adminAction
  .metadata({ name: "listTrialRequests" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput, ctx }) => ({
    requests: await trialCallService.listPending(parsedInput.code, ctx.user.id),
  }));

export const decideTrialRequestAction = adminAction
  .metadata({ name: "decideTrialRequest" })
  .schema(decideRequestSchema)
  .action(async ({ parsedInput, ctx }) => {
    await trialCallService.decide(parsedInput.code, parsedInput.requestId, parsedInput.approve, ctx.user.id);
    return { ok: true };
  });

/** Público: estado da sala para o lobby (quem já está na chamada). */
export const getTrialRoomStateAction = actionClient
  .metadata({ name: "getTrialRoomState" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput }) => {
    const rate = await checkRateLimit("trial-room-state", await clientIp(), 120, 60 * 1000);
    if (!rate.success) return { state: { status: "not_found" as const } };
    return { state: await trialCallService.getPublicState(parsedInput.code) };
  });

/** Público: visitante pede para entrar. */
export const requestTrialJoinAction = actionClient
  .metadata({ name: "requestTrialJoin" })
  .schema(requestToJoinSchema)
  .action(async ({ parsedInput }) => {
    const rate = await checkRateLimit("trial-join-request", await clientIp(), 8, 10 * 60 * 1000);
    if (!rate.success) return { result: null, limited: true };
    const result = await trialCallService.requestToJoin(parsedInput.code, parsedInput.name);
    return { result, limited: false };
  });

/** Público (polling): estado do pedido; o token só vem aqui, depois de aprovado. O guestId (uuid) é o segredo do pedido. */
export const getTrialRequestStatusAction = actionClient
  .metadata({ name: "getTrialRequestStatus" })
  .schema(requestStatusSchema)
  .action(async ({ parsedInput }) => {
    return { request: await trialCallService.getRequestStatus(parsedInput.code, parsedInput.requestId, parsedInput.guestId) };
  });

/** Anfitrião: salva as anotações (autosave). */
export const saveTrialNotesAction = adminAction
  .metadata({ name: "saveTrialNotes" })
  .schema(saveNotesSchema)
  .action(async ({ parsedInput, ctx }) => {
    await trialCallService.saveNotes(parsedInput.code, ctx.user.id, parsedInput.notes);
    return { ok: true };
  });

export const getTrialNotesAction = adminAction
  .metadata({ name: "getTrialNotes" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput, ctx }) => ({
    notes: await trialCallService.getNotes(parsedInput.code, ctx.user.id),
  }));

/** Admin: transcrição + anotações de uma aula. */
export const getTrialTranscriptAction = adminAction
  .metadata({ name: "getTrialTranscript" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput }) => trialCallService.getTranscript(parsedInput.code));

/** Admin: busca a transcrição na Stream quando o webhook não chegou. */
export const syncTrialTranscriptionAction = adminAction
  .metadata({ name: "syncTrialTranscription" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput }) => ({
    found: await trialCallService.syncTranscription(parsedInput.code),
  }));

/** Admin: (re)gera o perfil rascunho com a IA a partir da transcrição + anotações. */
export const buildTrialProfileAction = adminAction
  .metadata({ name: "buildTrialProfile" })
  .schema(roomCodeInputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await trialCallService.buildProfile(parsedInput.code, ctx.user.id);
    return { profileId: result.profileId, filled: result.filled.length };
  });

/** Público: o visitante deixa o e-mail ao fim da chamada. */
export const saveTrialGuestEmailAction = actionClient
  .metadata({ name: "saveTrialGuestEmail" })
  .schema(guestEmailSchema)
  .action(async ({ parsedInput }) => {
    const rate = await checkRateLimit("trial-guest-email", await clientIp(), 10, 10 * 60 * 1000);
    if (!rate.success) return { saved: false };
    const saved = await trialCallService.saveGuestEmail(parsedInput.code, parsedInput.requestId, parsedInput.guestId, parsedInput.email);
    return { saved };
  });

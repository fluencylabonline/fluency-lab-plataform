"use server";

import { headers } from "next/headers";
import { actionClient, adminAction } from "@/lib/safe-action";
import { checkRateLimit } from "@/lib/rate-limit";
import { trialCallService } from "./trial-call.service";
import {
  decideRequestSchema,
  requestStatusSchema,
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

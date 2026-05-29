"use server";

import { protectedAction } from "@/lib/safe-action";
import { createAudioSchema } from "./audio.schema";
import { audioService } from "./audio.service";
import { z } from "zod";

/**
 * Salva os metadados de um novo áudio enviado pelo professor.
 * Valida a entrada com o createAudioSchema.
 */
export const createAudioAction = protectedAction
  .schema(createAudioSchema)
  .metadata({ name: "createAudioAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const audio = await audioService.createAudio(user.id, user.role, parsedInput);
    return { success: true, audio };
  });

/**
 * Recupera todos os áudios disponíveis na biblioteca global.
 */
export const listAudiosAction = protectedAction
  .schema(z.any().optional())
  .metadata({ name: "listAudiosAction" })
  .action(async ({ ctx }) => {
    const { user } = ctx;
    const audios = await audioService.listAll(user.role);
    return { success: true, audios };
  });

/**
 * Remove um áudio cadastrado da biblioteca do professor.
 */
export const deleteAudioAction = protectedAction
  .schema(z.object({ id: z.string().uuid() }))
  .metadata({ name: "deleteAudioAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    await audioService.deleteAudio(user.id, user.role, parsedInput.id);
    return { success: true };
  });

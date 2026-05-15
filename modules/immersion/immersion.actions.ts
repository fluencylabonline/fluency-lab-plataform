"use server";

import { protectedAction } from "@/lib/safe-action";
import { saveImmersionProgressSchema, recordImmersionResultSchema } from "./immersion.schema";
import { immersionService } from "./immersion.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";


export const saveImmersionProgressAction = protectedAction
  .schema(saveImmersionProgressSchema)
  .metadata({ name: "saveImmersionProgressAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { gameId, state, lang } = parsedInput;
    await immersionService.saveProgress(ctx.user.id, gameId, state, lang);
    return { success: true };
  });

export const recordImmersionResultAction = protectedAction
  .schema(recordImmersionResultSchema)
  .metadata({ name: "recordImmersionResultAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { gameId, entry } = parsedInput;
    await immersionService.recordResult(ctx.user.id, gameId, entry);
    revalidatePath(`/hub/student/immersion/${gameId}`);
    return { success: true };
  });

export const deleteImmersionProgressAction = protectedAction
  .schema(z.object({ gameId: z.enum(["wordle", "word-ladder", "lyrics-training"]) }))
  .metadata({ name: "deleteImmersionProgressAction" })
  .action(async ({ parsedInput, ctx }) => {
    await immersionService.deleteProgress(ctx.user.id, parsedInput.gameId);
    return { success: true };
  });

export const getAvailableWordsAction = protectedAction
  .schema(z.object({ lang: z.string() }))
  .metadata({ name: "getAvailableWordsAction" })
  .action(async ({ parsedInput, ctx }) => {
    return immersionService.getAvailableWords(ctx.user.id, parsedInput.lang);
  });


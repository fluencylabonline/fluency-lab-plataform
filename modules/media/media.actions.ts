"use server";

import { z } from "zod";
import { protectedAction } from "@/lib/safe-action";
import { checkRateLimit } from "@/lib/rate-limit";
import { mediaService } from "./media.service";

/**
 * Dispara o evento de "download" do Unsplash quando um aluno vê uma foto na prática
 * (exigência das diretrizes da API). O evento não conta no limite de requisições.
 */
export const trackImageDownloadAction = protectedAction
  .metadata({ name: "trackImageDownload" })
  .inputSchema(z.object({ downloadLocation: z.string().url().max(512) }))
  .action(async ({ parsedInput, ctx }) => {
    const limit = await checkRateLimit("unsplash_download", ctx.user.id, 600, 60 * 60 * 1000);
    if (!limit.success) return { success: false };
    const ok = await mediaService.trackImageDownload(parsedInput.downloadLocation);
    return { success: ok };
  });

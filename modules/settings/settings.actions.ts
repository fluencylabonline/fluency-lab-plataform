"use server";

import { protectedAction } from "@/lib/safe-action";
import { updateSystemSettingsSchema, updateDelinquencyPolicySchema, SETTINGS_CACHE_TAG } from "./settings.schema";
import { settingsService } from "./settings.service";
import { revalidatePath, updateTag } from "next/cache";

export const updateSystemSettingsAction = protectedAction
  .metadata({ name: "updateSystemSettings" })
  .schema(updateSystemSettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const updated = await settingsService.updateSettings(
        ctx.user.id,
        ctx.user.role,
        parsedInput
      );

      // Expira o cache das configurações (a próxima leitura já vê a mudança)
      updateTag(SETTINGS_CACHE_TAG);
      revalidatePath("/");
      revalidatePath("/hub/admin/settings");

      return { success: true, data: updated };
    } catch (error) {
      console.error("[updateSystemSettingsAction] Error:", error);
      return {
        success: false,
        error: (error as Error).message || "Falha ao atualizar configurações do sistema",
      };
    }
  });

export const updateDelinquencyPolicyAction = protectedAction
  .metadata({ name: "updateDelinquencyPolicy" })
  .schema(updateDelinquencyPolicySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await settingsService.updateDelinquencyPolicy(ctx.user.role, parsedInput);
      updateTag(SETTINGS_CACHE_TAG);
      revalidatePath("/hub/admin/settings");
      return { success: true as const };
    } catch (error) {
      console.error("[updateDelinquencyPolicyAction] Error:", error);
      return {
        success: false as const,
        error: (error as Error).message || "Falha ao salvar a política de inadimplência",
      };
    }
  });

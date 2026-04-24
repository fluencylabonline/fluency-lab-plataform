"use server";

import { adminAction } from "@/lib/safe-action";
import { z } from "zod";
import { communicationService } from "./communication.service";
import { createWhatsAppTemplateSchema } from "./communication.schema";
import { revalidatePath } from "next/cache";

export const getWhatsAppTemplatesAction = adminAction
  .action(async () => {
    return await communicationService.getWhatsAppTemplates();
  });

export const createWhatsAppTemplateAction = adminAction
  .schema(createWhatsAppTemplateSchema)
  .action(async ({ parsedInput }) => {
    await communicationService.createWhatsAppTemplate(parsedInput);
    revalidatePath("/hub/admin/communication");
    return { success: true };
  });

export const deleteWhatsAppTemplateAction = adminAction
  .schema(z.object({ name: z.string() }))
  .action(async ({ parsedInput }) => {
    await communicationService.deleteWhatsAppTemplate(parsedInput.name);
    revalidatePath("/hub/admin/communication");
    return { success: true };
  });

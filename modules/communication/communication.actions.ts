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

export const getWhatsAppConversationsAction = adminAction
  .action(async () => {
    return await communicationService.getConversations();
  });

export const getWhatsAppMessagesAction = adminAction
  .schema(z.object({ conversationId: z.string() }))
  .action(async ({ parsedInput }) => {
    return await communicationService.getMessages(parsedInput.conversationId);
  });

export const sendWhatsAppTextMessageAction = adminAction
  .schema(z.object({ to: z.string(), text: z.string() }))
  .action(async ({ parsedInput }) => {
    return await communicationService.sendWhatsAppTextMessage(parsedInput.to, parsedInput.text);
  });

export const markWhatsAppConversationAsReadAction = adminAction
  .schema(z.object({ conversationId: z.string() }))
  .action(async ({ parsedInput }) => {
    await communicationService.markAsRead(parsedInput.conversationId);
    return { success: true };
  });

export const sendWhatsAppTemplateAction = adminAction
  .schema(z.object({
    to: z.string(),
    templateName: z.string(),
    languageCode: z.string().optional(),
    components: z.array(z.any()).optional(),
  }))
  .action(async ({ parsedInput }) => {
    return await communicationService.sendWhatsAppTemplate(parsedInput);
  });



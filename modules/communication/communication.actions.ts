"use server";

import { managerAction } from "@/lib/safe-action";
import { z } from "zod";
import { communicationService } from "./communication.service";
import { createWhatsAppTemplateSchema, createWhatsAppQuickReplySchema } from "./communication.schema";
import { revalidatePath } from "next/cache";

export const getWhatsAppTemplatesAction = managerAction
  .metadata({ name: "getWhatsAppTemplates" })
  .action(async () => {
    return await communicationService.getWhatsAppTemplates();
  });

export const createWhatsAppTemplateAction = managerAction
  .metadata({ name: "createWhatsAppTemplate" })
  .schema(createWhatsAppTemplateSchema)
  .action(async ({ parsedInput }) => {
    await communicationService.createWhatsAppTemplate(parsedInput);
    revalidatePath("/hub/admin/communication");
    return { success: true };
  });

export const deleteWhatsAppTemplateAction = managerAction
  .metadata({ name: "deleteWhatsAppTemplate" })
  .schema(z.object({ name: z.string() }))
  .action(async ({ parsedInput }) => {
    await communicationService.deleteWhatsAppTemplate(parsedInput.name);
    revalidatePath("/hub/admin/communication");
    return { success: true };
  });

export const getWhatsAppConversationsAction = managerAction
  .metadata({ name: "getWhatsAppConversations" })
  .schema(z.object({ includeArchived: z.boolean().optional().default(false) }).optional())
  .action(async ({ parsedInput }) => {
    return await communicationService.getConversations(parsedInput?.includeArchived ?? false);
  });

export const archiveWhatsAppConversationAction = managerAction
  .metadata({ name: "archiveWhatsAppConversation" })
  .schema(z.object({ conversationId: z.string(), isArchived: z.boolean() }))
  .action(async ({ parsedInput }) => {
    await communicationService.archiveConversation(parsedInput.conversationId, parsedInput.isArchived);
    return { success: true };
  });

export const getWhatsAppMessagesAction = managerAction
  .metadata({ name: "getWhatsAppMessages" })
  .schema(z.object({ conversationId: z.string() }))
  .action(async ({ parsedInput }) => {
    return await communicationService.getMessages(parsedInput.conversationId);
  });

export const sendWhatsAppTextMessageAction = managerAction
  .metadata({ name: "sendWhatsAppTextMessage" })
  .schema(z.object({ to: z.string(), text: z.string() }))
  .action(async ({ parsedInput }) => {
    return await communicationService.sendWhatsAppTextMessage(parsedInput.to, parsedInput.text);
  });

export const markWhatsAppConversationAsReadAction = managerAction
  .metadata({ name: "markWhatsAppConversationAsRead" })
  .schema(z.object({ conversationId: z.string() }))
  .action(async ({ parsedInput }) => {
    await communicationService.markAsRead(parsedInput.conversationId);
    return { success: true };
  });

export const updateWhatsAppContactNameAction = managerAction
  .metadata({ name: "updateWhatsAppContactName" })
  .schema(z.object({ conversationId: z.string(), name: z.string().min(1, "Nome não pode ser vazio") }))
  .action(async ({ parsedInput }) => {
    await communicationService.updateContactName(parsedInput.conversationId, parsedInput.name);
    return { success: true };
  });

export const updateWhatsAppConversationLabelsAction = managerAction
  .metadata({ name: "updateWhatsAppConversationLabels" })
  .schema(z.object({ conversationId: z.string(), labels: z.array(z.any()) }))
  .action(async ({ parsedInput }) => {
    await communicationService.updateLabels(parsedInput.conversationId, parsedInput.labels);
    return { success: true };
  });

export const sendWhatsAppTemplateAction = managerAction
  .metadata({ name: "sendWhatsAppTemplate" })
  .schema(z.object({
    to: z.string(),
    templateName: z.string(),
    languageCode: z.string().optional(),
    components: z.array(z.any()).optional(),
  }))
  .action(async ({ parsedInput }) => {
    return await communicationService.sendWhatsAppTemplate(parsedInput);
  });

export const associateWhatsAppStudentAction = managerAction
  .metadata({ name: "associateWhatsAppStudent" })
  .schema(z.object({
    conversationId: z.string(),
    studentId: z.string().nullable(),
  }))
  .action(async ({ parsedInput }) => {
    await communicationService.updateConversation(parsedInput.conversationId, {
      studentId: parsedInput.studentId,
    });
    return { success: true };
  });

export const getWhatsAppQuickRepliesAction = managerAction
  .metadata({ name: "getWhatsAppQuickReplies" })
  .action(async () => {
    return await communicationService.getQuickReplies();
  });

export const createWhatsAppQuickReplyAction = managerAction
  .metadata({ name: "createWhatsAppQuickReply" })
  .schema(createWhatsAppQuickReplySchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await communicationService.createQuickReply(parsedInput);
      return { success: true, data: result, error: null as string | null };
    } catch (err: any) {
      return { success: false, data: null, error: err.message as string | null };
    }
  });

export const deleteWhatsAppQuickReplyAction = managerAction
  .metadata({ name: "deleteWhatsAppQuickReply" })
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await communicationService.deleteQuickReply(parsedInput.id);
    return { success: true };
  });



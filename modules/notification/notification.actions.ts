"use server";

import { adminAction, protectedAction } from "@/lib/safe-action";
import { z } from "zod";
import { notificationService } from "./notification.service";
import { sendNotificationSchema } from "./notification.schema";
import { refresh } from "next/cache";

export const saveSubscriptionAction = protectedAction
  .schema(z.object({
    subscription: z.any()
  }))
  .metadata({ name: "saveSubscriptionAction" })
  .action(async ({ parsedInput, ctx }) => {
    await notificationService.subscribeUser(ctx.user.id, parsedInput.subscription);
    return { success: true };
  });

export const sendNotificationAction = adminAction
  .schema(sendNotificationSchema)
  .metadata({ name: "sendNotificationAction" })
  .action(async ({ parsedInput }) => {
    await notificationService.sendNotification(parsedInput);
    refresh();
    return { success: true };
  });

export const sendPwaSuggestionAction = adminAction
  .schema(z.object({ studentId: z.string() }))
  .metadata({ name: "sendPwaSuggestionAction" })
  .action(async ({ parsedInput }) => {
    await notificationService.sendPwaSuggestion(parsedInput.studentId);
    refresh();
    return { success: true };
  });

export const markNotificationAsReadAction = protectedAction
  .schema(z.object({
    id: z.string()
  }))
  .metadata({ name: "markNotificationAsReadAction" })
  .action(async ({ parsedInput, ctx }) => {
    // Sem refresh(): o sino e a lista são SWR e se atualizam via mutate.
    await notificationService.markAsRead(parsedInput.id, ctx.user.id);
    return { success: true };
  });

export const getMyNotificationsAction = protectedAction
  .metadata({ name: "getMyNotificationsAction" })
  .action(async ({ ctx }) => {
    return await notificationService.getUserNotifications(ctx.user.id);
  });

export const getGlobalHistoryAction = adminAction
  .metadata({ name: "getGlobalHistoryAction" })
  .action(async () => {
    return await notificationService.getGlobalHistory();
  });

export const markAllNotificationsAsReadAction = protectedAction
  .metadata({ name: "markAllNotificationsAsReadAction" })
  .action(async ({ ctx }) => {
    // Sem refresh(): o sino e a lista são SWR e se atualizam via mutate.
    await notificationService.markAllAsRead(ctx.user.id);
    return { success: true };
  });

export const clearNotificationsAction = protectedAction
  .metadata({ name: "clearNotificationsAction" })
  .action(async ({ ctx }) => {
    // Sem refresh(): o sino e a lista são SWR e se atualizam via mutate.
    await notificationService.clearAll(ctx.user.id);
    return { success: true };
  });

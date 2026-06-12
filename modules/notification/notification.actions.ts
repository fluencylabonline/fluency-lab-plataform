"use server";

import { adminAction, protectedAction } from "@/lib/safe-action";
import { z } from "zod";
import { notificationService } from "./notification.service";
import { sendNotificationSchema } from "./notification.schema";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/hub/admin/notifications");
    return { success: true };
  });

export const markNotificationAsReadAction = protectedAction
  .schema(z.object({
    id: z.string()
  }))
  .metadata({ name: "markNotificationAsReadAction" })
  .action(async ({ parsedInput, ctx }) => {
    await notificationService.markAsRead(parsedInput.id, ctx.user.id);
    revalidatePath("/hub");
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
    await notificationService.markAllAsRead(ctx.user.id);
    revalidatePath("/hub");
    return { success: true };
  });

export const clearNotificationsAction = protectedAction
  .metadata({ name: "clearNotificationsAction" })
  .action(async ({ ctx }) => {
    await notificationService.clearAll(ctx.user.id);
    revalidatePath("/hub");
    return { success: true };
  });

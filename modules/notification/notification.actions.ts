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
  .action(async ({ parsedInput, ctx }) => {
    await notificationService.subscribeUser(ctx.user.id, parsedInput.subscription);
    return { success: true };
  });

export const sendNotificationAction = adminAction
  .schema(sendNotificationSchema)
  .action(async ({ parsedInput }) => {
    await notificationService.sendNotification(parsedInput);
    revalidatePath("/hub/admin/notifications");
    return { success: true };
  });

export const markNotificationAsReadAction = protectedAction
  .schema(z.object({
    id: z.string()
  }))
  .action(async ({ parsedInput, ctx }) => {
    await notificationService.markAsRead(parsedInput.id, ctx.user.id);
    revalidatePath("/hub");
    return { success: true };
  });

export const getMyNotificationsAction = protectedAction
  .action(async ({ ctx }) => {
    return await notificationService.getUserNotifications(ctx.user.id);
  });

export const getGlobalHistoryAction = adminAction
  .action(async () => {
    return await notificationService.getGlobalHistory();
  });

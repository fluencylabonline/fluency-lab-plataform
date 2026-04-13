"use server";

import { protectedAction } from "@/lib/safe-action";
import { notificationService } from "./notification.service";
import { subscribePushSchema } from "./communication.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Fetch notifications for the currently logged-in user.
 * Thin Client pattern: Component calls this to get data.
 */
export const getMyNotificationsAction = protectedAction
  .action(async ({ ctx }) => {
    const notifications = await notificationService.getForUser(ctx.user.id, ctx.user.role);
    const unreadCount = await notificationService.getUnreadCount(ctx.user.id, ctx.user.role);
    return { success: true, data: { notifications, unreadCount } };
  });

/**
 * Mark a specific notification as read by the user.
 */
export const markNotificationAsReadAction = protectedAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    await notificationService.markAsRead(parsedInput.id, ctx.user.id);
    revalidatePath("/", "layout");
    return { success: true };
  });

/**
 * Register or update a Web Push subscription for the current user.
 */
export const subscribeToPushAction = protectedAction
  .schema(subscribePushSchema)
  .action(async ({ parsedInput, ctx }) => {
    await notificationService.subscribe(ctx.user.id, parsedInput);
    return { success: true };
  });

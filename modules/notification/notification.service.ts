import webpush from "web-push";
import { env } from "@/env";
import { notificationRepository } from "./notification.repository";
import { SendNotificationValues } from "./notification.schema";

// Initialize web-push
webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

export const notificationService = {
  async sendNotification(params: SendNotificationValues) {
    const { title, body, actionUrl, targetType, targetRole, userIds, channels } = params;

    let targetUserIds: string[] = [];

    // 1. Resolve target users
    if (targetType === "all") {
      targetUserIds = await notificationRepository.findAllUserIds();
    } else if (targetType === "role" && targetRole) {
      targetUserIds = await notificationRepository.findUserIdsByRole(targetRole);
    } else if (targetType === "specific" && userIds) {
      targetUserIds = userIds;
    }

    if (targetUserIds.length === 0) return;

    // 2. Send In-App Notifications
    if (channels.inApp) {
      const inAppNotifications = targetUserIds.map((userId) => ({
        userId,
        title,
        body,
        actionUrl,
      }));
      await notificationRepository.createMany(inAppNotifications);
    }

    // 3. Send Push Notifications
    if (channels.push) {
      const subscriptions = await notificationRepository.findSubscriptionsByUserIds(targetUserIds);
      
      const pushPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            sub.subscription as webpush.PushSubscription,
            JSON.stringify({
              title,
              body,
              url: actionUrl || "/",
            })
          );
        } catch (error: unknown) {
          const webPushError = error as { statusCode?: number };
          console.error(`Error sending push to user ${sub.userId}:`, error);
          // If error is 410 (Gone) or 404 (Not Found), we should probably delete the subscription
          if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            // TODO: Delete invalid subscription
          }
        }
      });
      
      // We don't necessarily want to wait for all push notifications if there are many,
      // but for a small system we can.
      await Promise.allSettled(pushPromises);
    }
  },

  async subscribeUser(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return notificationRepository.saveSubscription(userId, subscription);
  },

  async getUserNotifications(userId: string) {
    return notificationRepository.findByUserId(userId);
  },

  async markAsRead(id: string, userId: string) {
    return notificationRepository.markAsRead(id, userId);
  },

  async getGlobalHistory() {
    return notificationRepository.findGlobalHistory();
  },
};

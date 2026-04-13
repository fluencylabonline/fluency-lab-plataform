import webpush from "web-push";
import { communicationRepository } from "./communication.repository";
import { Announcement, PushSubscription, subscribePushSchema } from "./communication.schema";
import { roleEnum } from "../user/user.schema";
import { z } from "zod";

// --- Send Options ---
export interface SendNotificationOptions {
  title: string;
  message: string;
  type?: Announcement["type"]; 
  recipients: 
    | { type: "all" }
    | { type: "role"; roles: (typeof roleEnum.enumValues)[number][] }
    | { type: "specific"; userIds: string[] };
  link?: string;
  createdBy?: string;
  channels?: {
    inApp?: boolean; // default: true
    push?: boolean;  // default: true
  };
}

export class NotificationService {
  constructor() {
    this.configureWebPush();
  }

  private configureWebPush() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:push@fluencylab.me";

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    }
  }

  // Main method to send notifications
  async send(options: SendNotificationOptions): Promise<Announcement | null> {
    const {
      title,
      message,
      type = "info",
      recipients,
      link,
      createdBy = "SYSTEM",
      channels = { inApp: true, push: true },
    } = options;

    let announcement: Announcement | null = null;

    // 1. In-App Channel (Database)
    if (channels.inApp) {
      announcement = await communicationRepository.createAnnouncement({
        title,
        message,
        type,
        link,
        recipientsType: recipients.type,
        recipientsRoles: recipients.type === "role" ? recipients.roles : null,
        recipientsUserIds: recipients.type === "specific" ? recipients.userIds : null,
        createdBy,
      });
    }

    // 2. Push Channel (Web Push)
    if (channels.push) {
      // Execute in background
      this.executePushStrategy(options).catch((err) => {
        console.error("[NotificationService] Push delivery failed:", err);
      });
    }

    return announcement;
  }

  private async executePushStrategy(options: SendNotificationOptions): Promise<void> {
    let subscriptions: PushSubscription[] = [];

    if (options.recipients.type === "all") {
      subscriptions = await communicationRepository.getAllSubscriptions();
    } else if (options.recipients.type === "role") {
      subscriptions = await communicationRepository.getSubscriptionsForRoles(options.recipients.roles);
    } else if (options.recipients.type === "specific") {
      subscriptions = await communicationRepository.getSubscriptionsForUsers(options.recipients.userIds);
    }

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title: options.title,
      body: options.message,
      icon: "/icons/icon-192x192.png",
      data: {
        url: options.link || "/",
      },
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
        } catch (error) {
          if (error && typeof error === "object" && "statusCode" in error) {
            const statusCode = (error as { statusCode: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              // Subscription expired or gone
              await communicationRepository.removeSubscription(sub.endpoint);
            }
          }
        }
      })
    );
  }

  // --- Read Methods (Thin Client interaction) ---
  async getForUser(userId: string, role: string) {
    return communicationRepository.findForUser(userId, role);
  }

  async getUnreadCount(userId: string, role: string) {
    return communicationRepository.getUnreadCount(userId, role);
  }

  async markAsRead(announcementId: string, userId: string) {
    return communicationRepository.markAsRead(announcementId, userId);
  }

  async subscribe(userId: string, subscription: z.infer<typeof subscribePushSchema>) {
    return communicationRepository.upsertSubscription({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
  }
}

export const notificationService = new NotificationService();
import { db } from "@/lib/db";
import { notificationsTable, pushSubscriptionsTable } from "./notification.schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { usersTable } from "../user/user.schema";

export const notificationRepository = {
  // In-App Notifications
  async create(data: typeof notificationsTable.$inferInsert) {
    return db.insert(notificationsTable).values(data).returning();
  },

  async createMany(data: (typeof notificationsTable.$inferInsert)[]) {
    if (data.length === 0) return [];
    return db.insert(notificationsTable).values(data).returning();
  },

  async findByUserId(userId: string) {
    return db.query.notificationsTable.findMany({
      where: eq(notificationsTable.userId, userId),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    });
  },

  async markAsRead(id: string, userId: string) {
    return db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
  },

  // Push Subscriptions
  async saveSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    const endpoint = subscription.endpoint;
    
    return db.insert(pushSubscriptionsTable)
      .values({
        userId,
        endpoint,
        subscription,
      })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: {
          userId, // Update userId in case a different user logs in on same browser
          subscription,
        },
      });
  },

  async findSubscriptionsByUserIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    return db.query.pushSubscriptionsTable.findMany({
      where: inArray(pushSubscriptionsTable.userId, userIds),
    });
  },

  async deleteSubscription(endpoint: string) {
    return db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  },

  async findAllSubscriptions() {
    return db.query.pushSubscriptionsTable.findMany();
  },

  async findSubscriptionsByRole(role: "admin" | "teacher" | "student" | "manager") {
    return db
      .select({
        subscription: pushSubscriptionsTable.subscription,
        userId: pushSubscriptionsTable.userId,
      })
      .from(pushSubscriptionsTable)
      .innerJoin(usersTable, eq(pushSubscriptionsTable.userId, usersTable.id))
      .where(eq(usersTable.role, role));
  },

  // User Targeting
  async findUserIdsByRole(role: "admin" | "teacher" | "student" | "manager") {
    const result = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, role));
    return result.map((r) => r.id);
  },

  async findAllUserIds() {
    const result = await db.select({ id: usersTable.id }).from(usersTable);
    return result.map((r) => r.id);
  },

  async findGlobalHistory(limit = 100) {
    return db
      .select({
        id: notificationsTable.id,
        title: notificationsTable.title,
        body: notificationsTable.body,
        createdAt: notificationsTable.createdAt,
        userId: notificationsTable.userId,
        userName: usersTable.name,
      })
      .from(notificationsTable)
      .leftJoin(usersTable, eq(notificationsTable.userId, usersTable.id))
      .orderBy((notifications) => [desc(notifications.createdAt)])
      .limit(limit);
  },

  async markAllAsRead(userId: string) {
    return db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
  },

  async clearAll(userId: string) {
    return db
      .delete(notificationsTable)
      .where(eq(notificationsTable.userId, userId));
  },
};

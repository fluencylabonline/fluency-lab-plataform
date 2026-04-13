import { db } from "@/lib/db";
import { announcementsTable, announcementReadsTable, pushSubscriptionsTable, NewAnnouncement, NewPushSubscription } from "./communication.schema";
import { usersTable } from "../user/user.schema";
import { eq, and, or, sql, desc, inArray } from "drizzle-orm";

export const communicationRepository = {
  // --- Announcements ---
  async createAnnouncement(data: NewAnnouncement) {
    const [result] = await db.insert(announcementsTable).values(data).returning();
    return result;
  },

  async findForUser(userId: string, role: string) {
    const announcements = await db.query.announcementsTable.findMany({
      where: and(
        eq(announcementsTable.isActive, true),
        or(
          eq(announcementsTable.recipientsType, "all"),
          and(
            eq(announcementsTable.recipientsType, "role"),
            sql`${announcementsTable.recipientsRoles} @> ARRAY[${role}]::role[]`
          ),
          and(
            eq(announcementsTable.recipientsType, "specific"),
            sql`${announcementsTable.recipientsUserIds} @> ARRAY[${userId}]::text[]`
          )
        )
      ),
      orderBy: [desc(announcementsTable.createdAt)],
    });

    const reads = await db
      .select({ id: announcementReadsTable.announcementId })
      .from(announcementReadsTable)
      .where(eq(announcementReadsTable.userId, userId));

    const readSet = new Set(reads.map(r => r.id));

    return announcements.map(a => ({
      ...a,
      isRead: readSet.has(a.id),
    }));
  },

  async getUnreadCount(userId: string, role: string) {
    const announcements = await this.findForUser(userId, role);
    if (announcements.length === 0) return 0;

    const readIds = await db
      .select({ id: announcementReadsTable.announcementId })
      .from(announcementReadsTable)
      .where(eq(announcementReadsTable.userId, userId));

    const readSet = new Set(readIds.map(r => r.id));
    return announcements.filter(a => !readSet.has(a.id)).length;
  },

  async markAsRead(announcementId: string, userId: string) {
    await db.insert(announcementReadsTable).values({
      announcementId,
      userId,
    }).onConflictDoNothing();
  },

  // --- Push Subscriptions ---
  async upsertSubscription(data: NewPushSubscription) {
    await db.insert(pushSubscriptionsTable)
      .values(data)
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: {
          userId: data.userId,
          p256dh: data.p256dh,
          auth: data.auth,
        },
      });
  },

  async getSubscriptionsForUsers(userIds: string[]) {
    if (userIds.length === 0) return [];
    return db.query.pushSubscriptionsTable.findMany({
      where: inArray(pushSubscriptionsTable.userId, userIds),
    });
  },

  async getSubscriptionsForRoles(roles: string[]) {
    // Need to join with users table
    const users = await db.query.usersTable.findMany({
      where: inArray(sql`${usersTable.role}`, roles),
      columns: { id: true },
    });
    const ids = users.map(u => u.id);
    return this.getSubscriptionsForUsers(ids);
  },

  async getAllSubscriptions() {
    return db.query.pushSubscriptionsTable.findMany();
  },

  async removeSubscription(endpoint: string) {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  }
};

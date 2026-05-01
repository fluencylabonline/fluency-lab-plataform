import { db } from "@/lib/db";
import { usersTable, type User, type NewUser, type NotificationPrefs } from "./user.schema";
import { eq } from "drizzle-orm";

export const userRepository = {
  /**
   * Find user by Firebase UID.
   */
  async findById(id: string): Promise<User | undefined> {
    return db.query.usersTable.findFirst({
      where: eq(usersTable.id, id),
    });
  },

  /**
   * Find user by email.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });
  },

  /**
   * Create or update user (Upsert).
   * Useful for syncing Firebase Auth data on login.
   */
  async upsert(user: NewUser): Promise<User> {
    const [inserted] = await db
      .insert(usersTable)
      .values(user)
      .onConflictDoUpdate({
        target: usersTable.email,
        set: {
          id: user.id, // This allows claiming/swapping UIDs
          name: user.name,
          photoUrl: user.photoUrl,
          googleLinked: user.googleLinked,
          updatedAt: new Date(),
        },
      })
      .returning();
    return inserted;
  },

  /**
   * Update specific user fields.
   */
  async update(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  },

  /**
   * Search users by name, email or ID.
   */
  async searchByTerm(term: string, role?: User["role"]): Promise<User[]> {
    const searchPattern = `%${term}%`;
    
    return db.query.usersTable.findMany({
      where: (table, { or, ilike, eq, and }) => {
        const searchFilters = or(
          ilike(table.name, searchPattern),
          ilike(table.email, searchPattern),
          eq(table.id, term)
        );
        
        return role ? and(eq(table.role, role), searchFilters) : searchFilters;
      },
      limit: 10,
    });
  },

  /**
   * Get all users.
   */
  async findAll(): Promise<User[]> {
    return db.query.usersTable.findMany({
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  },

  /**
   * Find all users with a specific role.
   */
  async findAllByRole(role: User["role"]): Promise<User[]> {
    return db.query.usersTable.findMany({
      where: eq(usersTable.role, role),
      orderBy: (table, { asc }) => [asc(table.name)],
    });
  },
  /**
   * Find student with gamification data.
   */
  async findStudentWithGamification(id: string): Promise<User | undefined> {
    return db.query.usersTable.findFirst({
      where: eq(usersTable.id, id),
    });
  },

  /**
   * Update XP, Streak and Notifications.
   */
  async updateGamification(id: string, data: { currentXP?: number, streakCount?: number, lastPracticeDate?: Date }) {
    const [updated] = await db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  },

  async updateNotificationSettings(id: string, data: { pushNotificationsEnabled?: boolean, appNotificationsEnabled?: boolean }) {
    const [updated] = await db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  },

  async updateNotificationPrefs(id: string, prefs: NotificationPrefs) {
    const [updated] = await db
      .update(usersTable)
      .set({ notificationPrefs: prefs, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  },

  async findStudentsForReminders(): Promise<User[]> {
    return db.query.usersTable.findMany({
      where: (table, { eq, or, and }) => and(
        eq(table.role, "student"),
        eq(table.isActive, true),
        or(
          eq(table.pushNotificationsEnabled, true),
          eq(table.appNotificationsEnabled, true)
        )
      )
    });
  },

  async countActiveStudents(): Promise<number> {
    const result = await db.query.usersTable.findMany({
      where: (table, { eq, and }) => and(
        eq(table.role, "student"),
        eq(table.isActive, true)
      ),
      columns: { id: true }
    });
    return result.length;
  }
};

import { db } from "@/lib/db";
import { usersTable, type User, type NewUser } from "./user.schema";
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
};


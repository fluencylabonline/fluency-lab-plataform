import { db } from "@/lib/db";
import { systemSettingsTable } from "./settings.schema";
import { eq } from "drizzle-orm";

export const settingsRepository = {
  async getSettings() {
    return db.query.systemSettingsTable.findFirst({
      where: eq(systemSettingsTable.id, "default"),
    });
  },

  async createDefaultSettings() {
    const results = await db
      .insert(systemSettingsTable)
      .values({
        id: "default",
      })
      .returning();
    return results[0];
  },

  async updateSettings(data: Partial<typeof systemSettingsTable.$inferInsert>) {
    const results = await db
      .update(systemSettingsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(systemSettingsTable.id, "default"))
      .returning();
    return results[0];
  },
};

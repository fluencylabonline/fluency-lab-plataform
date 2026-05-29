import { db } from "@/lib/db";
import { audiosTable } from "./audio.schema";
import { eq } from "drizzle-orm";

export const audioRepository = {
  async findById(id: string) {
    return db.query.audiosTable.findFirst({
      where: eq(audiosTable.id, id),
    });
  },

  async listAll() {
    return db.query.audiosTable.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async create(data: typeof audiosTable.$inferInsert) {
    const [audio] = await db
      .insert(audiosTable)
      .values(data)
      .returning();
    return audio;
  },

  async delete(id: string) {
    await db.delete(audiosTable).where(eq(audiosTable.id, id));
  },
};

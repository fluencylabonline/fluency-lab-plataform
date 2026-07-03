import { db } from "@/lib/db";
import { proceduresTable } from "./procedure.schema";
import { eq, desc } from "drizzle-orm";
import type { JSONContent } from "@tiptap/core";

export const procedureRepository = {
  async findAll() {
    return db.query.proceduresTable.findMany({
      orderBy: [desc(proceduresTable.createdAt)],
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            photoUrl: true,
          }
        }
      }
    });
  },

  async findById(id: string) {
    return db.query.proceduresTable.findFirst({
      where: eq(proceduresTable.id, id),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            photoUrl: true,
          }
        }
      }
    });
  },

  async create(data: { title: string; content?: JSONContent; createdBy: string }) {
    const [procedure] = await db.insert(proceduresTable).values({
      title: data.title,
      content: data.content || { type: "doc", content: [] },
      createdBy: data.createdBy,
    }).returning();
    return procedure;
  },

  async update(id: string, data: { title?: string; content?: JSONContent }) {
    const [procedure] = await db.update(proceduresTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(proceduresTable.id, id))
      .returning();
    return procedure;
  },

  async delete(id: string) {
    await db.delete(proceduresTable).where(eq(proceduresTable.id, id));
  }
};

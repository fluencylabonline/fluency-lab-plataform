import { db } from "@/lib/db";
import {
  languages, media, learningItems, lessons, lessonLearningItems
} from "./curriculum.schema";
import { eq, and, isNull } from "drizzle-orm";

export const curriculumRepository = {
  // Languages
  async findAllLanguages() {
    return db.query.languages.findMany();
  },

  async findLanguageByCode(code: string) {
    return db.query.languages.findFirst({
      where: eq(languages.code, code),
    });
  },

  // Media
  async findMediaById(id: string) {
    return db.query.media.findFirst({
      where: eq(media.id, id),
    });
  },

  async createMedia(data: typeof media.$inferInsert) {
    const [result] = await db.insert(media).values(data).returning();
    return result;
  },

  async updateMedia(id: string, data: Partial<typeof media.$inferInsert>) {
    const [result] = await db.update(media)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(media.id, id))
      .returning();
    return result;
  },

  // Learning Items
  async findItemById(id: string) {
    return db.query.learningItems.findFirst({
      where: eq(learningItems.id, id),
    });
  },

  async upsertLearningItem(data: typeof learningItems.$inferInsert) {
    return db.insert(learningItems)
      .values(data)
      .onConflictDoUpdate({
        target: learningItems.id,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
  },

  // Lessons
  async findLessonById(id: string) {
    return db.query.lessons.findFirst({
      where: and(eq(lessons.id, id), isNull(lessons.deletedAt)),
      with: {
        items: {
          with: {
            item: true
          }
        },
        media: true,
        language: true
      }
    });
  },

  async createLesson(data: typeof lessons.$inferInsert) {
    const [result] = await db.insert(lessons).values(data).returning();
    return result;
  },

  async updateLesson(id: string, data: Partial<typeof lessons.$inferInsert>) {
    const [result] = await db.update(lessons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return result;
  },

  async deleteLesson(id: string) {
    const [result] = await db.update(lessons)
      .set({ deletedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return result;
  },

  // Junctions
  async linkItemToLesson(lessonId: string, itemId: string, priority: "CORE" | "SECONDARY") {
    return db.insert(lessonLearningItems)
      .values({ lessonId, itemId, priority })
      .onConflictDoUpdate({
        target: [lessonLearningItems.lessonId, lessonLearningItems.itemId],
        set: { priority },
      });
  },

  async unlinkItemsFromLesson(lessonId: string) {
    return db.delete(lessonLearningItems).where(eq(lessonLearningItems.lessonId, lessonId));
  }
};

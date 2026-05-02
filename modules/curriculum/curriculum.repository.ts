import { db } from "@/lib/db";
import {
  languages, media, learningItems, lessons, lessonLearningItems
} from "./curriculum.schema";
import { LessonWithDetails, LessonSummary } from "./curriculum.types";
import { eq, and, isNull, sql, desc } from "drizzle-orm";

export const curriculumRepository = {
  // Languages
  async findAllLanguages() {
    return db.query.languages.findMany({
      with: {
        lessons: {
          where: isNull(lessons.deletedAt),
          columns: {
            id: true,
          }
        }
      }
    });
  },

  async findLanguageByCode(code: string) {
    return db.query.languages.findFirst({
      where: eq(languages.code, code),
    });
  },

  async findLanguageById(id: string) {
    return db.query.languages.findFirst({
      where: eq(languages.id, id),
    });
  },

  async createLanguage(data: typeof languages.$inferInsert) {
    const [result] = await db.insert(languages).values(data).returning();
    return result;
  },

  async deleteLanguage(id: string) {
    const [result] = await db.delete(languages).where(eq(languages.id, id)).returning();
    return result;
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

  async findAllMedia() {
    return db.query.media.findMany({
      orderBy: [sql`${media.createdAt} DESC`],
      with: {
        lessons: {
          where: isNull(lessons.deletedAt),
          columns: {
            id: true,
            title: true,
          }
        }
      }
    });
  },

  async deleteMedia(id: string) {
    const [result] = await db.delete(media).where(eq(media.id, id)).returning();
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

  async getRandomItemsByLevel(languageId: string, cefrLevel: string, limit: number) {
    return db.select()
      .from(learningItems)
      .where(and(
        eq(learningItems.languageId, languageId),
        sql`${learningItems.metadata}->>'level' = ${cefrLevel}`
      ))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  },
  
  async findLearningItems(params: { languageId: string, type?: "VOCABULARY" | "STRUCTURE", search?: string, limit: number }) {
    const { languageId, type, search, limit } = params;
    const filters = [eq(learningItems.languageId, languageId)];

    if (type) filters.push(eq(learningItems.type, type));
    if (search) {
      filters.push(sql`${learningItems.lemma} ILIKE ${`%${search}%`}`);
    }

    return db.query.learningItems.findMany({
      where: and(...filters),
      limit: limit,
      orderBy: [sql`${learningItems.createdAt} DESC`]
    });
  },

  // Lessons
  async findLessonById(id: string): Promise<LessonWithDetails | null> {
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
    }) as Promise<LessonWithDetails | null>;
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

  async unlinkItemFromLesson(lessonId: string, itemId: string) {
    return db.delete(lessonLearningItems).where(
      and(
        eq(lessonLearningItems.lessonId, lessonId),
        eq(lessonLearningItems.itemId, itemId)
      )
    );
  },

  async unlinkItemsFromLesson(lessonId: string) {
    return db.delete(lessonLearningItems).where(eq(lessonLearningItems.lessonId, lessonId));
  },

  async findAllReady(languageId: string) {
    return db.query.lessons.findMany({
      where: and(
        eq(lessons.languageId, languageId),
        eq(lessons.status, "ready"),
        isNull(lessons.deletedAt)
      ),
      orderBy: [sql`${lessons.createdAt} DESC`]
    });
  },

  async findAllLessons(): Promise<LessonSummary[]> {
    return db.query.lessons.findMany({
      where: isNull(lessons.deletedAt),
      orderBy: [sql`${lessons.createdAt} DESC`],
      with: {
        language: true,
        media: true
      }
    }) as unknown as Promise<LessonSummary[]>;
  },
  async findLessons(params: { search?: string, limit?: number }): Promise<LessonSummary[]> {
    const { search, limit = 50 } = params;
    const filters = [isNull(lessons.deletedAt)];
    if (search) {
      filters.push(sql`${lessons.title} ILIKE ${`%${search}%`}`);
    }
    return db.query.lessons.findMany({
      where: and(...filters),
      limit: limit,
      orderBy: [sql`${lessons.createdAt} DESC`],
      with: {
        language: true,
        media: true
      }
    }) as unknown as Promise<LessonSummary[]>;
  },

  async findLessonItems(lessonId: string) {
    return db.query.lessonLearningItems.findMany({
      where: eq(lessonLearningItems.lessonId, lessonId),
      with: {
        item: true
      }
    });
  },
  async findRecessActivities(teacherId?: string): Promise<LessonSummary[]> {
    return await db.query.lessons.findMany({
      where: and(
        eq(lessons.isRecessActivity, true),
        eq(lessons.status, "ready"),
        teacherId ? eq(lessons.teacherId, teacherId) : isNull(lessons.teacherId)
      ),
      with: {
        language: true,
        media: true
      },
      orderBy: [desc(lessons.createdAt)]
    }) as unknown as Promise<LessonSummary[]>;
  },
};

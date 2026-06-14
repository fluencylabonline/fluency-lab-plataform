import { db } from "@/lib/db";
import {
  languages, media, learningItems, lessons, lessonLearningItems, cefrLevelEnum, lessonStatusEnum
} from "./curriculum.schema";
import { LessonWithDetails, LessonSummary } from "./curriculum.types";
import { eq, and, isNull, sql, desc, inArray } from "drizzle-orm";

export const curriculumRepository = {
  // Languages
  async findAllLanguages() {
    return db.query.languages.findMany({
      with: {
        targetLessons: {
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
  
  async findLearningItems(params: { languageId?: string, type?: "VOCABULARY" | "STRUCTURE", level?: string, search?: string, limit: number, offset?: number }) {
    const { languageId, type, level, search, limit, offset = 0 } = params;
    const filters = [];

    if (languageId) filters.push(eq(learningItems.languageId, languageId));
    if (type) filters.push(eq(learningItems.type, type));
    if (level) {
      filters.push(sql`${learningItems.metadata}->>'level' = ${level}`);
    }
    if (search) {
      filters.push(sql`${learningItems.lemma} ILIKE ${`%${search}%`}`);
    }

    return db.query.learningItems.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      limit: limit,
      offset: offset,
      orderBy: [sql`${learningItems.createdAt} DESC`],
      with: {
        language: true
      }
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
        language: true,
        nativeLanguage: true
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
        nativeLanguage: true,
        media: true
      }
    }) as unknown as Promise<LessonSummary[]>;
  },
  async findLessons(params: { search?: string, limit?: number, offset?: number, languageId?: string, difficulty?: string, status?: string }): Promise<LessonSummary[]> {
    const { search, limit = 50, offset = 0, languageId, difficulty, status } = params;
    const filters = [isNull(lessons.deletedAt)];
    if (search) {
      filters.push(sql`${lessons.title} ILIKE ${`%${search}%`}`);
    }
    if (languageId) {
      filters.push(eq(lessons.languageId, languageId));
    }
    if (difficulty) {
      filters.push(eq(lessons.difficulty, difficulty as typeof cefrLevelEnum.enumValues[number]));
    }
    if (status) {
      filters.push(eq(lessons.status, status as typeof lessonStatusEnum.enumValues[number]));
    }
    return db.query.lessons.findMany({
      where: and(...filters),
      limit: limit,
      offset: offset,
      orderBy: [sql`${lessons.createdAt} DESC`],
      with: {
        language: true,
        nativeLanguage: true,
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
        nativeLanguage: true,
        media: true
      },
      orderBy: [desc(lessons.createdAt)]
    }) as unknown as Promise<LessonSummary[]>;
  },

  async getRandomVocabularyItem(languageCodes: string[]) {
    const filters = [eq(learningItems.type, "VOCABULARY")];

    if (languageCodes.length > 0) {
      filters.push(inArray(languages.code, languageCodes));
    }

    const results = await db.select({
      item: learningItems,
      languageCode: languages.code
    })
      .from(learningItems)
      .innerJoin(languages, eq(learningItems.languageId, languages.id))
      .where(and(...filters))
      .orderBy(sql`MD5(concat(${learningItems.id}, CURRENT_DATE::text))`)
      .limit(1);
    
    if (!results[0]) return null;
    
    return {
      ...results[0].item,
      languageCode: results[0].languageCode
    };
  },
};

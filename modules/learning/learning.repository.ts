import { db } from "@/lib/db";
import {
  studentProfiles, studentItemProgress, learningPlans, planLessons, studentProfileHistory,
  learningPracticeSessions, learningXpTransactions, learningEngagementLogs
} from "./learning.schema";
import { eq, and, asc, sql, isNull, desc } from "drizzle-orm";

export const learningRepository = {
  // Profiles
  async findProfileByStudentId(studentId: string) {
    return db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.studentId, studentId),
      with: {
        student: true,
      },
    });
  },

  async findProfileById(id: string) {
    return db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.id, id),
      with: {
        student: true,
      },
    });
  },

  async findAllProfiles() {
    return db.query.studentProfiles.findMany({
      with: {
        student: true,
      },
      orderBy: [desc(studentProfiles.updatedAt)],
    });
  },

  async upsertProfile(data: typeof studentProfiles.$inferInsert, changedBy?: string) {
    return db.transaction(async (tx) => {
      const existing = data.id ? await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.id, data.id),
      }) : null;

      let profile;
      if (existing) {
        [profile] = await tx.update(studentProfiles)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(studentProfiles.id, existing.id))
          .returning();
      } else {
        [profile] = await tx.insert(studentProfiles)
          .values(data)
          .returning();
      }

      // Add to history
      await tx.insert(studentProfileHistory).values({
        profileId: profile.id,
        studentId: profile.studentId,
        responses: profile.responses,
        qualitativeNotes: profile.qualitativeNotes,
        changedBy,
      });

      return profile;
    });
  },

  async associateProfileToStudent(profileId: string, studentId: string) {
    return db.update(studentProfiles)
      .set({ studentId, updatedAt: new Date() })
      .where(eq(studentProfiles.id, profileId))
      .returning();
  },

  async archiveProfile(id: string) {
    return db.update(studentProfiles)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(studentProfiles.id, id))
      .returning();
  },

  // Progress
  async findProgressByItem(studentId: string, itemId: string) {
    return db.query.studentItemProgress.findFirst({
      where: and(
        eq(studentItemProgress.studentId, studentId),
        eq(studentItemProgress.itemId, itemId)
      ),
    });
  },

  async createProgress(data: typeof studentItemProgress.$inferInsert) {
    const [result] = await db.insert(studentItemProgress).values(data).returning();
    return result;
  },

  async updateProgress(id: string, data: Partial<typeof studentItemProgress.$inferInsert>) {
    const [result] = await db.update(studentItemProgress)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studentItemProgress.id, id))
      .returning();
    return result;
  },

  // Plans
  async findPlanWithLessons(planId: string) {
    return db.query.learningPlans.findFirst({
      where: eq(learningPlans.id, planId),
      with: {
        lessons: {
          orderBy: [asc(planLessons.order)],
          with: {
            lesson: true
          }
        }
      }
    });
  },

  async findActivePlanWithLessons(studentId: string) {
    return db.query.learningPlans.findFirst({
      where: and(
        eq(learningPlans.studentId, studentId),
        eq(learningPlans.status, "active")
      ),
      with: {
        lessons: {
          orderBy: [asc(planLessons.order)],
          with: {
            lesson: true
          }
        }
      }
    });
  },

  async findArchivedPlansByStudentId(studentId: string) {
    return db.query.learningPlans.findMany({
      where: and(
        eq(learningPlans.studentId, studentId),
        sql`${learningPlans.status} IN ('completed', 'paused')`
      ),
      with: {
        lessons: {
          orderBy: [asc(planLessons.order)],
          with: {
            lesson: true
          }
        }
      },
      orderBy: [desc(learningPlans.updatedAt)]
    });
  },

  async findAllTemplates() {
    return db.query.learningPlans.findMany({
      where: isNull(learningPlans.studentId),
      with: {
        language: true,
        lessons: true
      },
      orderBy: [asc(learningPlans.createdAt)]
    });
  },

  async createPlan(data: typeof learningPlans.$inferInsert) {
    const [result] = await db.insert(learningPlans).values(data).returning();
    return result;
  },

  async updatePlan(id: string, data: Partial<typeof learningPlans.$inferInsert>) {
    const [result] = await db.update(learningPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(learningPlans.id, id))
      .returning();
    return result;
  },

  async clonePlanWithLessons(templateId: string, targetStudentId: string) {
    return db.transaction(async (tx) => {
      // 1. Fetch template
      const template = await tx.query.learningPlans.findFirst({
        where: eq(learningPlans.id, templateId),
        with: { lessons: true }
      });

      if (!template) throw new Error("Template not found");

      // 2. Insert new plan
      const [newPlan] = await tx.insert(learningPlans).values({
        name: template.name,
        description: template.description,
        languageId: template.languageId,
        studentId: targetStudentId,
        status: "active",
      }).returning();

      // 3. Clone lessons
      if (template.lessons.length > 0) {
        await tx.insert(planLessons).values(
          template.lessons.map(l => ({
            planId: newPlan.id,
            lessonId: l.lessonId,
            order: l.order,
          }))
        );
      }

      return newPlan;
    });
  },


  async addLessonToPlan(planId: string, lessonId: string, order: number) {
    return db.insert(planLessons).values({ planId, lessonId, order });
  },

  async findSimilarLessons(vector: number[], languageId: string, limit: number = 10) {
    // pgvector similarity search: <=> is cosine distance
    return db.execute<{ id: string, title: string, difficulty: string, distance: number }>(sql`
      SELECT id, title, difficulty, (embedding <=> ${JSON.stringify(vector)}::vector) as distance
      FROM curriculum_lessons 
      WHERE status = 'ready' 
      AND language_id = ${languageId}
      ORDER BY distance ASC
      LIMIT ${limit}
    `);
  },

  async getLessonFailureRate(lessonId: string): Promise<{ total: number, failures: number }> {
    const result = await db.execute<{ total: number, failures: number }>(sql`
      SELECT 
        COUNT(p.id)::int as total,
        SUM(CASE WHEN p.consecutive_correct = 0 THEN 1 ELSE 0 END)::int as failures
      FROM learning_student_item_progress p
      JOIN curriculum_lesson_learning_items lli ON lli.item_id = p.item_id
      WHERE lli.lesson_id = ${lessonId}
    `);

    return result.rows[0] || { total: 0, failures: 0 };
  },

  async removeLessonFromPlan(planId: string, lessonId: string) {
    return db.delete(planLessons)
      .where(and(eq(planLessons.planId, planId), eq(planLessons.lessonId, lessonId)));
  },

  async reorderPlanLessons(planId: string, lessonIds: string[]) {
    return db.transaction(async (tx) => {
      for (let i = 0; i < lessonIds.length; i++) {
        await tx.update(planLessons)
          .set({ order: i })
          .where(and(eq(planLessons.planId, planId), eq(planLessons.lessonId, lessonIds[i])));
      }
    });
  },

  async getMaxLessonOrder(planId: string) {
    const result = await db.select({ max: sql<number>`max(${planLessons.order})` })
      .from(planLessons)
      .where(eq(planLessons.planId, planId));
    return result[0]?.max ?? -1;
  },

  async findPlansByStudentId(studentId: string) {
    return db.query.learningPlans.findMany({
      where: eq(learningPlans.studentId, studentId),
      with: {
        language: true,
        lessons: true
      },
      orderBy: [desc(learningPlans.createdAt)]
    });
  },

  async updateLessonProgress(planId: string, lessonId: string, completedPracticeDays: number) {
    const isCompleted = completedPracticeDays >= 6;
    return db.update(planLessons)
      .set({
        completedPracticeDays,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      })
      .where(and(eq(planLessons.planId, planId), eq(planLessons.lessonId, lessonId)));
  },

  // Sessions
  async findSessionState(planId: string) {
    return db.query.learningPracticeSessions.findFirst({
      where: eq(learningPracticeSessions.planId, planId),
    });
  },

  async upsertSessionState(data: typeof learningPracticeSessions.$inferInsert) {
    const existing = await this.findSessionState(data.planId);

    if (existing) {
      const [result] = await db.update(learningPracticeSessions)
        .set({ state: data.state, updatedAt: new Date() })
        .where(eq(learningPracticeSessions.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(learningPracticeSessions).values(data).returning();
      return result;
    }
  },

  async deleteSessionState(planId: string) {
    return db.delete(learningPracticeSessions).where(eq(learningPracticeSessions.planId, planId));
  },

  // XP
  async createXpTransaction(data: typeof learningXpTransactions.$inferInsert) {
    const [result] = await db.insert(learningXpTransactions).values(data).returning();
    return result;
  },

  async createEngagementLog(data: typeof learningEngagementLogs.$inferInsert) {
    const [result] = await db.insert(learningEngagementLogs).values(data).returning();
    return result;
  }
};

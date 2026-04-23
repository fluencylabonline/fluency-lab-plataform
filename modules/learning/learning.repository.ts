import { db } from "@/lib/db";
import { 
  studentProfiles, studentItemProgress, learningPlans, planLessons 
} from "./learning.schema";
import { eq, and, asc, sql, isNull } from "drizzle-orm";

export const learningRepository = {
  // Profiles
  async findProfileByStudentId(studentId: string) {
    return db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.studentId, studentId),
    });
  },

  async upsertProfile(data: typeof studentProfiles.$inferInsert) {
    return db.insert(studentProfiles)
      .values(data)
      .onConflictDoUpdate({
        target: studentProfiles.studentId,
        set: { ...data, updatedAt: new Date() },
      })
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
    return db.execute<{id: string, distance: number}>(sql`
      SELECT id, (embedding <=> ${JSON.stringify(vector)}::vector) as distance
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
  }
};

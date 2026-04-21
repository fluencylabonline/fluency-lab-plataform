import { db } from "@/lib/db";
import { 
  studentProfiles, studentItemProgress, learningPlans, planLessons 
} from "./learning.schema";
import { eq, and, asc, sql } from "drizzle-orm";

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
  async findActivePlan(studentId: string) {
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

  async createPlan(data: typeof learningPlans.$inferInsert) {
    const [result] = await db.insert(learningPlans).values(data).returning();
    return result;
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
  }
};

import { db } from "@/lib/db";
import { 
  coursesTable, 
  courseSectionsTable, 
  courseLessonsTable, 
  courseEnrollmentsTable,
  courseQuizzesTable,
  courseQuizSubmissionsTable,
  type CourseProgress,
} from "./course.schema";
import { eq, and, asc, desc, sql, arrayContains } from "drizzle-orm";

export const courseRepository = {
  // Courses
  async findAll() {
    return db.query.coursesTable.findMany({
      orderBy: [desc(coursesTable.createdAt)],
    });
  },

  async findById(id: string) {
    return db.query.coursesTable.findFirst({
      where: eq(coursesTable.id, id),
      with: {
        sections: {
          orderBy: [asc(courseSectionsTable.order)],
          with: {
            lessons: {
              orderBy: [asc(courseLessonsTable.order)],
              with: {
                quiz: true,
              }
            },
          },
        },
      },
    });
  },

  async findUserCourses(userId: string, role: string) {
    // We can use relational query to fetch courses and their enrollment for this user
    return db.query.coursesTable.findMany({
      where: arrayContains(coursesTable.roles, [role]),
      with: {
        enrollments: {
          where: eq(courseEnrollmentsTable.userId, userId),
        },
        sections: {
          with: {
            lessons: true,
          }
        }
      },
      orderBy: [desc(coursesTable.createdAt)],
    });
  },

  async create(data: typeof coursesTable.$inferInsert) {
    const [result] = await db.insert(coursesTable).values(data).returning();
    return result;
  },

  async update(id: string, data: Partial<typeof coursesTable.$inferInsert>) {
    const [result] = await db.update(coursesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(coursesTable.id, id))
      .returning();
    return result;
  },

  async delete(id: string) {
    await db.delete(coursesTable).where(eq(coursesTable.id, id));
  },

  // Sections
  async findSectionsByCourseId(courseId: string) {
    return db.query.courseSectionsTable.findMany({
      where: eq(courseSectionsTable.courseId, courseId),
      orderBy: [asc(courseSectionsTable.order)],
    });
  },

  async createSection(data: typeof courseSectionsTable.$inferInsert) {
    const [result] = await db.insert(courseSectionsTable).values(data).returning();
    return result;
  },

  async deleteSection(id: string) {
    await db.delete(courseSectionsTable).where(eq(courseSectionsTable.id, id));
  },

  async updateSectionsOrder(sectionIds: string[]) {
    return db.transaction(async (tx) => {
      for (let i = 0; i < sectionIds.length; i++) {
        await tx.update(courseSectionsTable)
          .set({ order: i })
          .where(eq(courseSectionsTable.id, sectionIds[i]));
      }
    });
  },

  // Lessons
  async findLessonById(id: string) {
    return db.query.courseLessonsTable.findFirst({
      where: eq(courseLessonsTable.id, id),
    });
  },

  async createLesson(data: typeof courseLessonsTable.$inferInsert) {
    const [result] = await db.insert(courseLessonsTable).values(data).returning();
    return result;
  },

  async deleteLesson(id: string) {
    await db.delete(courseLessonsTable).where(eq(courseLessonsTable.id, id));
  },

  async updateLesson(id: string, data: Partial<typeof courseLessonsTable.$inferInsert>) {
    const [result] = await db.update(courseLessonsTable)
      .set(data)
      .where(eq(courseLessonsTable.id, id))
      .returning();
    return result;
  },

  async updateLessonsOrder(lessonIds: string[]) {
    return db.transaction(async (tx) => {
      for (let i = 0; i < lessonIds.length; i++) {
        await tx.update(courseLessonsTable)
          .set({ order: i })
          .where(eq(courseLessonsTable.id, lessonIds[i]));
      }
    });
  },

  // Enrollments
  async findEnrollment(userId: string, courseId: string) {
    return db.query.courseEnrollmentsTable.findFirst({
      where: and(
        eq(courseEnrollmentsTable.userId, userId),
        eq(courseEnrollmentsTable.courseId, courseId)
      ),
    });
  },

  async countEnrollments(courseId: string) {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(courseEnrollmentsTable)
      .where(eq(courseEnrollmentsTable.courseId, courseId));
    return result?.count || 0;
  },

  async findEnrolledUserIds(courseId: string) {
    const enrollments = await db.select({ userId: courseEnrollmentsTable.userId })
      .from(courseEnrollmentsTable)
      .where(eq(courseEnrollmentsTable.courseId, courseId));
    return enrollments.map(e => e.userId);
  },

  async upsertEnrollment(data: typeof courseEnrollmentsTable.$inferInsert) {
    return db.insert(courseEnrollmentsTable)
      .values(data)
      .onConflictDoUpdate({
        target: [courseEnrollmentsTable.userId, courseEnrollmentsTable.courseId],
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
  },

  async updateProgress(userId: string, courseId: string, progress: CourseProgress) {
    return db.update(courseEnrollmentsTable)
      .set({ progress, updatedAt: new Date() })
      .where(and(
        eq(courseEnrollmentsTable.userId, userId),
        eq(courseEnrollmentsTable.courseId, courseId)
      ))
      .returning();
  },

  // Quizzes
  async createQuiz(data: typeof courseQuizzesTable.$inferInsert) {
    const [result] = await db.insert(courseQuizzesTable).values(data).returning();
    return result;
  },

  async findQuizById(id: string) {
    return db.query.courseQuizzesTable.findFirst({
      where: eq(courseQuizzesTable.id, id),
    });
  },

  async findQuizzesByCourse(courseId: string) {
    return db.query.courseQuizzesTable.findMany({
      where: eq(courseQuizzesTable.courseId, courseId),
    });
  },

  async createQuizSubmission(data: typeof courseQuizSubmissionsTable.$inferInsert) {
    const [result] = await db.insert(courseQuizSubmissionsTable).values(data).returning();
    return result;
  },

  async findUserSubmissions(userId: string, quizId: string) {
    return db.query.courseQuizSubmissionsTable.findMany({
      where: and(
        eq(courseQuizSubmissionsTable.userId, userId),
        eq(courseQuizSubmissionsTable.quizId, quizId)
      ),
      orderBy: [desc(courseQuizSubmissionsTable.createdAt)],
    });
  },

  async findLastSubmission(userId: string, quizId: string) {
    return db.query.courseQuizSubmissionsTable.findFirst({
      where: and(
        eq(courseQuizSubmissionsTable.userId, userId),
        eq(courseQuizSubmissionsTable.quizId, quizId)
      ),
      orderBy: [desc(courseQuizSubmissionsTable.createdAt)],
    });
  }
};

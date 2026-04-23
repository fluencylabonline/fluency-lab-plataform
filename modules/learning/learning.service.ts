import { learningRepository } from "./learning.repository";
import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { slotInstances } from "@/modules/scheduling/scheduling.schema";
import { eq, and, gte, asc } from "drizzle-orm";

export const learningService = {
  /**'
   * Updates student progress for a specific item using the SM-2 algorithm.
   * @param q Quality of response (0-5). 0-2 = Fail, 3-5 = Pass.
   * @param lessonId The lesson where this practice happened (for cross-context mastery).
   * @param practicedAt Optional date when the practice actually happened (for offline sync).
   */
  async recordPracticeResult(studentId: string, itemId: string, q: number, lessonId: string, practicedAt?: Date) {
    const referenceDate = practicedAt || new Date();

    // Sanity check: Don't accept practices older than 7 days to preserve SRS integrity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (referenceDate < sevenDaysAgo) {
      console.warn(`[OFFLINE SYNC] Ignoring practice for item ${itemId} because it is older than 7 days.`);
      return null;
    }

    let progress = await learningRepository.findProgressByItem(studentId, itemId);

    if (!progress) {
      progress = await learningRepository.createProgress({
        studentId,
        itemId,
        status: "ACTIVE",
        interval: 0,
        easeFactor: 2.5,
        consecutiveCorrect: 0,
        nextReviewDate: referenceDate,
        passedContextsIds: [],
      });
    }

    let { interval, easeFactor, consecutiveCorrect, status, passedContextsIds } = progress;

    // Ensure passedContextsIds is always an array
    if (!Array.isArray(passedContextsIds)) passedContextsIds = [];

    if (q >= 3) {
      // Success
      if (consecutiveCorrect === 0) {
        interval = 1;
      } else if (consecutiveCorrect === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      consecutiveCorrect += 1;

      // Update EF
      easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3;

      // Cross-Context Mastery: add lessonId if not already tracked
      if (!passedContextsIds.includes(lessonId)) {
        passedContextsIds = [...passedContextsIds, lessonId];
      }

      // Rule of 3 Contexts: MASTERED only if passed in 3+ DISTINCT lessons
      if (status === "ACTIVE" || status === "RECEPTIVE") {
        if (passedContextsIds.length >= 3) {
          status = "MASTERED";
        } else if (passedContextsIds.length >= 1) {
          status = "RECEPTIVE";
        }
      }
    } else {
      // Failure
      consecutiveCorrect = 0;
      interval = 1;
    }

    const nextReviewDate = addDays(referenceDate, interval);

    await learningRepository.updateProgress(progress.id, {
      interval,
      easeFactor,
      consecutiveCorrect,
      status,
      contextsPassed: passedContextsIds.length,
      passedContextsIds,
      nextReviewDate,
      lastReviewedAt: referenceDate,
    });

    return { interval, nextReviewDate, status, distinctContexts: passedContextsIds.length };
  },

  /**
   * Generates a learning plan based on student level and RAG using pgvector.
   */
  async generatePersonalizedPlan(studentId: string, languageId: string) {
    // 1. Get student profile and vector
    const profile = await learningRepository.findProfileByStudentId(studentId);
    if (!profile || !profile.profileVector) {
      throw new Error("Student profile vector not found. Please complete assessment.");
    }

    // 2. Query for similar lessons using pgvector
    const similarRows = await learningRepository.findSimilarLessons(
      profile.profileVector as number[],
      languageId,
      10
    );

    // 3. Create Plan
    const plan = await learningRepository.createPlan({
      studentId,
      name: "",
      languageId: ""
    });

    // 4. Link lessons in order
    for (let i = 0; i < similarRows.rows.length; i++) {
      const lessonId = similarRows.rows[i].id as string;
      await learningRepository.addLessonToPlan(plan.id, lessonId, i);
    }

    return plan;
  },

  /**
   * Starts a lesson, moving its core items to ACTIVE status (Drip-feed).
   */
  async startLesson(studentId: string, lessonId: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    for (const lessonItem of lesson.items) {
      if (lessonItem.priority === "CORE") {
        const progress = await learningRepository.findProgressByItem(studentId, lessonItem.item.id);
        if (!progress) {
          await learningRepository.createProgress({
            studentId,
            itemId: lessonItem.item.id,
            status: "ACTIVE",
            nextReviewDate: new Date(),
          });
        }
      }
    }

    return { success: true };
  },

  /**
   * Monitor Difficulty Drift
   * Flags a lesson if its failure rate exceeds a threshold (e.g. 40%) with sufficient data points.
   */
  async checkDifficultyDrift(lessonId: string) {
    const stats = await learningRepository.getLessonFailureRate(lessonId);

    // Require at least 50 item progress records to make a statistical decision
    if (stats.total >= 50) {
      const failureRate = stats.failures / stats.total;
      if (failureRate >= 0.4) {
        console.warn(`[DIFFICULTY DRIFT] Lesson ${lessonId} has a ${Math.round(failureRate * 100)}% failure rate. Consider increasing its CEFR level.`);
        // In a real scenario, could trigger an event or update a 'flagged' column
      }
    }

    return stats;
  },

  /**
   * Processes a batch of practice results, usually from an offline queue.
   */
  async recordBatchResult(studentId: string, items: Array<{ itemId: string, q: number, lessonId: string, practicedAt: Date }>) {
    const results = [];

    // Sort by practicedAt to ensure chronological processing
    const sortedItems = [...items].sort((a, b) => a.practicedAt.getTime() - b.practicedAt.getTime());

    for (const item of sortedItems) {
      const result = await this.recordPracticeResult(
        studentId,
        item.itemId,
        item.q,
        item.lessonId,
        item.practicedAt
      );
      if (result) results.push(result);
    }

    return { count: results.length, totalAttempted: items.length };
  },

  /**
   * Creates a new generic plan template (Manager Hub).
   */
  async createPlanTemplate(params: { name: string, languageId: string, description?: string }) {
    return learningRepository.createPlan({
      ...params,
      status: "draft",
    });
  },

  /**
   * Lists only generic plan templates.
   */
  async getTemplatesForHub() {
    return learningRepository.findAllTemplates();
  },

  /**
   * Assigns a plan to a student by cloning it and linking to upcoming classes.
   */
  async assignPlanToStudent(templateId: string, studentId: string) {
    // 1. Clone the template for the student
    const personalizedPlan = await learningRepository.clonePlanWithLessons(templateId, studentId);

    // 2. Link lessons to upcoming classes
    await this.linkPlanToUpcomingClasses(studentId, personalizedPlan.id);

    return personalizedPlan;
  },

  /**
   * Links a plan's lessons to upcoming scheduled classes in order.
   */
  async linkPlanToUpcomingClasses(studentId: string, planId: string) {
    const plan = await learningRepository.findPlanWithLessons(planId);
    if (!plan || plan.lessons.length === 0) return;

    const now = new Date();

    // Fetch upcoming scheduled classes (NOT COMPLETED/CANCELED)
    const classes = await db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.studentId, studentId),
        eq(slotInstances.status, "scheduled"),
        gte(slotInstances.startAt, now)
      ),
      orderBy: [asc(slotInstances.startAt)]
    });

    if (classes.length === 0) return;

    // Distribute lessons across classes
    return db.transaction(async (tx) => {
      for (let i = 0; i < classes.length; i++) {
        // If we have a lesson for this class index, link it
        if (plan.lessons[i]) {
          const lessonRecord = plan.lessons[i];
          await tx.update(slotInstances)
            .set({
              planId: plan.id,
              planName: plan.name,
              lessonId: lessonRecord.lessonId,
              lessonTitle: lessonRecord.lesson?.title || "Lesson",
              updatedAt: new Date()
            })
            .where(eq(slotInstances.id, classes[i].id));
        } else {
          // If classes exceed plan length, ensure they at least link to the plan
          await tx.update(slotInstances)
            .set({
              planId: plan.id,
              planName: plan.name,
              lessonId: null,
              lessonTitle: null,
              updatedAt: new Date()
            })
            .where(eq(slotInstances.id, classes[i].id));
        }
      }
    });
  },

  /**
   * Calculates the gap between assigned plan lessons and upcoming classes.
   */
  async getStudentCurriculumGap(studentId: string) {
    const now = new Date();

    // 1. Count future scheduled classes
    const classesCount = await db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.studentId, studentId),
        eq(slotInstances.status, "scheduled"),
        gte(slotInstances.startAt, now)
      ),
    });

    // 2. Get active plan
    // Find the latest active plan for this student
    const activePlan = await db.query.learningPlans.findFirst({
      where: and(
        eq(learningPlans.studentId, studentId),
        eq(learningPlans.status, "active")
      ),
      with: { lessons: true }
    });

    const lessonCount = activePlan?.lessons.length || 0;
    const gap = classesCount.length - lessonCount;

    return {
      upcomingClasses: classesCount.length,
      planLessons: lessonCount,
      gap: gap > 0 ? gap : 0,
      hasGap: gap > 0,
      activePlanName: activePlan?.name
    };
  },

  /**
   * Fetches a specific plan with its lessons.
   */
  async getPlanById(planId: string) {
    return learningRepository.findPlanWithLessons(planId);
  },

  /**
   * Adds a lesson to the end of a plan.
   */
  async addLessonToPlan(planId: string, lessonId: string) {
    const maxOrder = await learningRepository.getMaxLessonOrder(planId);
    return learningRepository.addLessonToPlan(planId, lessonId, maxOrder + 1);
  },

  /**
   * Removes a lesson from a plan's sequence.
   */
  async removeLessonFromPlan(planId: string, lessonId: string) {
    return learningRepository.removeLessonFromPlan(planId, lessonId);
  },

  /**
   * Reorders the lessons in a plan.
   */
  async reorderLessons(planId: string, lessonIds: string[]) {
    return learningRepository.reorderPlanLessons(planId, lessonIds);
  }
};

import { learningPlans } from "./learning.schema";


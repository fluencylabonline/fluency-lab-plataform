import { learningRepository } from "./learning.repository";
import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { 
  studentProfiles, 
  learningPlans, 
  planLessons,
} from "./learning.schema";
import { lessons, languages } from "@/modules/curriculum/curriculum.schema";
import { usersTable } from "@/modules/user/user.schema";
import { slotInstances } from "@/modules/scheduling/scheduling.schema";
import { eq, and, asc, gte } from "drizzle-orm";
import { aiService } from "@/modules/ai/ai.service";

export const learningService = {
  // Profiles
  async saveProfileSurvey(data: { id?: string, studentId?: string, responses: Record<string, unknown> }, userId?: string) {
    return learningRepository.upsertProfile({
      id: data.id,
      studentId: data.studentId,
      responses: data.responses,
      status: "draft",
    }, userId);
  },

  async finalizeProfile(profileId: string, userId?: string) {
    const profile = await learningRepository.findProfileById(profileId);
    if (!profile) throw new Error("Profile not found");

    // 1. Generate Pedagogical Summary using Gemini 2.0 Flash
    const summary = await aiService.generateStudentProfileSummary(profile.responses as Record<string, unknown>, userId);

    // 2. Generate Embedding Vector
    const vector = await aiService.getEmbeddings(summary, userId);

    // 3. Update Profile
    return learningRepository.upsertProfile({
      id: profileId,
      qualitativeNotes: summary,
      profileVector: vector,
      status: "active",
    }, userId);
  },

  async findProfileById(id: string) {
    return learningRepository.findProfileById(id);
  },

  async getAllProfiles() {
    return learningRepository.findAllProfiles();
  },

  async findProfileByStudentId(studentId: string) {
    return learningRepository.findProfileByStudentId(studentId);
  },

  async associateStudentProfile(profileId: string, studentId: string) {
    return learningRepository.associateProfileToStudent(profileId, studentId);
  },

  async archiveProfile(profileId: string) {
    return learningRepository.archiveProfile(profileId);
  },

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
   * Generates a learning plan based on student level, profile vector, and AI orchestration.
   * Supports AI suggestions for missing content if allowSuggestions is true.
   */
  async generatePersonalizedPlan(studentId: string, profileId: string, options: { allowSuggestions: boolean }, userId?: string) {
    // 1. Get student and profile
    const student = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, studentId),
    });
    if (!student) throw new Error("Student not found");

    const profile = await learningRepository.findProfileById(profileId);
    if (!profile || !profile.profileVector || !profile.qualitativeNotes) {
      throw new Error("Student profile or AI summary not found. Please complete assessment.");
    }

    // 2. Determine target language (default to English if not specified)
    // We'll use the first language from the student's languages array or a default
    let languageId = student.languages?.[0];
    if (!languageId) {
      const enLang = await db.query.languages.findFirst({
        where: eq(languages.code, "en")
      });
      if (enLang) languageId = enLang.id;
    }
    if (!languageId) throw new Error("Target language not found for plan generation");

    // 3. Find top 40 similar lessons to give as candidates to the AI
    const similarRows = await learningRepository.findSimilarLessons(
      profile.profileVector as number[],
      languageId,
      40
    );

    const availableLessons = similarRows.rows.map(r => ({
      id: r.id as string,
      title: r.title as string,
      difficulty: r.difficulty as string
    }));

    // 4. Call AI to generate the plan structure
    const planStructure = await aiService.generatePersonalizedPlanStructure({
      profileSummary: profile.qualitativeNotes,
      currentLevel: `Elo Score: ${student.currentEloScore} (CEFR approx target mapping)`,
      availableLessons,
      allowSuggestions: options.allowSuggestions
    }, userId);

    // 5. Create the Plan in DB
    return db.transaction(async (tx) => {
      const [plan] = await tx.insert(learningPlans).values({
        studentId,
        languageId,
        name: planStructure.planName || `Plano Personalizado - ${student.name}`,
        status: "draft",
      }).returning();

      // 6. Process slots (max 12 as per AI prompt)
      for (let i = 0; i < planStructure.slots.length; i++) {
        const slot = planStructure.slots[i];
        let lessonId = slot.lessonId;

        // If it's a suggestion, create a placeholder lesson
        if (slot.type === "suggestion" && slot.suggestion) {
          const [suggestedLesson] = await tx.insert(lessons).values({
            languageId,
            title: `[SUGESTÃO] ${slot.suggestion.title}`,
            difficulty: "A1", // Default, AI should specify in future
            status: "draft",
            contentText: `Objetivo: ${slot.suggestion.objective}\n\nDescrição: ${slot.suggestion.description}`,
            creationStep: 1, // Start at step 1 for manager to complete
          }).returning();
          lessonId = suggestedLesson.id;
        }

        // Link to plan if we have a lessonId
        if (lessonId) {
          await tx.insert(planLessons).values({
            planId: plan.id,
            lessonId,
            order: i,
          });
        }
      }

      return plan;
    });
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
  async assignPlanToStudent(templateId: string, studentId: string, startClassId?: string) {
    // 1. Deactivate current active plan
    await db.update(learningPlans)
      .set({ status: "completed", updatedAt: new Date() })
      .where(and(
        eq(learningPlans.studentId, studentId),
        eq(learningPlans.status, "active")
      ));

    // 2. Clone the template for the student
    const personalizedPlan = await learningRepository.clonePlanWithLessons(templateId, studentId);

    // 3. Link lessons to upcoming classes
    await this.linkPlanToUpcomingClasses(studentId, personalizedPlan.id, startClassId);

    return personalizedPlan;
  },

  /**
   * Links a plan's lessons to upcoming scheduled classes in order.
   */
  async linkPlanToUpcomingClasses(studentId: string, planId: string, startClassId?: string) {
    const plan = await learningRepository.findPlanWithLessons(planId);
    if (!plan || plan.lessons.length === 0) return;

    const now = new Date();

    // Fetch upcoming scheduled classes (NOT COMPLETED/CANCELED)
    let classes = await db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.studentId, studentId),
        eq(slotInstances.status, "scheduled"),
        gte(slotInstances.startAt, now)
      ),
      orderBy: [asc(slotInstances.startAt)]
    });

    if (classes.length === 0) return;

    // If a starting class is specified, slice the array
    if (startClassId) {
      const startIndex = classes.findIndex(c => c.id === startClassId);
      if (startIndex !== -1) {
        classes = classes.slice(startIndex);
      }
    }

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

    // 3. Overall stats for progress bar
    const allStudentClasses = await db.query.slotInstances.findMany({
      where: eq(slotInstances.studentId, studentId),
    });

    const completed = allStudentClasses.filter(s => s.status === "completed").length;
    const withLesson = allStudentClasses.filter(s => !!s.lessonId).length;

    // 4. Check for pedagogical profile
    const profile = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.studentId, studentId),
    });

    return {
      upcomingClassesCount: classesCount.length,
      planLessonsCount: lessonCount,
      gap: gap > 0 ? gap : 0,
      hasGap: gap > 0,
      activePlanName: activePlan?.name,
      activePlanId: activePlan?.id,
      totalClasses: allStudentClasses.length,
      completedClasses: completed,
      classesWithLesson: withLesson,
      profileId: profile?.id
    };
  },

  /**
   * Lists all plans assigned to a specific student.
   */
  async getStudentPlans(studentId: string) {
    return learningRepository.findPlansByStudentId(studentId);
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



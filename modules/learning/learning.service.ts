import { learningRepository } from "./learning.repository";
import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { VocabMetadata } from "@/modules/curriculum/curriculum.types";
import type { JSONContent } from "@tiptap/core";
import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { 
  studentProfiles, 
  learningPlans, 
  planLessons,
  learningXpTransactions,
  studentItemProgress,
} from "./learning.schema";
import { lessons, languages } from "@/modules/curriculum/curriculum.schema";
import { usersTable, type NotificationPrefs } from "@/modules/user/user.schema";
import { slotInstances } from "@/modules/scheduling/scheduling.schema";
import { eq, and, asc, gte, desc, sql, inArray, isNotNull } from "drizzle-orm";
import { aiService } from "@/modules/ai/ai.service";
import { notificationService } from "@/modules/notification/notification.service";
import { userRepository } from "@/modules/user/user.repository";
import { differenceInDays } from "date-fns";
import { StudentLearningStats, LearningItemDetail, StudentRoadmap } from "./learning.types";
import { REMINDER_TEMPLATES } from "./reminder-templates";

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

    let nativeLanguage = "Portuguese";
    if (profile.studentId) {
      const student = await db.query.usersTable.findFirst({ where: eq(usersTable.id, profile.studentId) });
      if (student?.locale === "en") nativeLanguage = "English";
    }

    // 1. Generate Pedagogical Summary using Gemini 2.0 Flash
    const summary = await aiService.generateStudentProfileSummary(profile.responses as Record<string, unknown>, nativeLanguage, userId);

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
    let targetLanguageName = "English";
    if (!languageId) {
      const enLang = await db.query.languages.findFirst({
        where: eq(languages.code, "en")
      });
      if (enLang) {
        languageId = enLang.id;
        targetLanguageName = enLang.name;
      }
    } else {
      const lang = await db.query.languages.findFirst({ where: eq(languages.id, languageId) });
      if (lang) targetLanguageName = lang.name;
    }
    if (!languageId) throw new Error("Target language not found for plan generation");

    let nativeLanguage = "Portuguese";
    const nativeLanguageCode = student.locale || "pt";
    if (student.locale === "en") nativeLanguage = "English";
    
    const nativeLangObj = await db.query.languages.findFirst({
      where: eq(languages.code, nativeLanguageCode)
    });
    const fallbackLang = nativeLangObj || await db.query.languages.findFirst();
    const nativeLanguageId = fallbackLang?.id || languageId;

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
      allowSuggestions: options.allowSuggestions,
      targetLanguage: targetLanguageName,
      nativeLanguage
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
            nativeLanguageId,
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
  },

  async getActivePlan(studentId: string) {
    return learningRepository.findActivePlanWithLessons(studentId);
  },

  async getStudentRoadmap(studentId: string): Promise<StudentRoadmap | null> {
    const activePlan = await learningRepository.findActivePlanWithLessons(studentId);
    if (!activePlan) return null;

    const lessonsWithStatus = activePlan.lessons.map((pl, index) => {
      let status: "completed" | "current" | "future" = "future";
      
      if (pl.isCompleted) {
        status = "completed";
      } else if (index === 0 || activePlan.lessons[index - 1].isCompleted) {
        status = "current";
      }

      // Extract goal from contentText if it exists (Format: "Objetivo: ...")
      let goal = undefined;
      if (pl.lesson?.contentText) {
        const goalMatch = pl.lesson.contentText.match(/Objetivo:\s*(.*)/i);
        if (goalMatch) goal = goalMatch[1].split("\n")[0].trim();
      }

      return {
        id: pl.lessonId,
        title: pl.lesson?.title || "Lesson",
        isCompleted: pl.isCompleted,
        status,
        order: pl.order,
        scheduledDate: pl.scheduledDate,
        completedPracticeDays: pl.completedPracticeDays,
        isDraft: pl.lesson?.status !== "ready",
        goal,
      };
    });

    const completedCount = lessonsWithStatus.filter(l => l.isCompleted).length;
    const progress = lessonsWithStatus.length > 0 
      ? Math.round((completedCount / lessonsWithStatus.length) * 100) 
      : 0;

    return {
      id: activePlan.id,
      name: activePlan.name,
      progress,
      lessons: lessonsWithStatus,
    };
  },

  async getArchivedPlans(studentId: string) {
    return learningRepository.findArchivedPlansByStudentId(studentId);
  },

  // ===================== PRACTICE SESSION METHODS =====================

  /**
   * Returns the daily practice session for a given plan and day.
   * Extracts real content from the active lesson's LearningItems & quizData.
   *
   * Logic:
   *   1. Find the active lesson in the plan
   *   2. Fetch its CORE LearningItems + quizData
   *   3. Map to PracticeItems based on the day:
   *      - Day 1: vocab items → flashcard_visual (with image_url + useTTS)
   *      - Day 2: vocab example sentences → gap_fill_listening (TTS reads full sentence)
   *      - Day 3: structure items w/ word_order → sentence_unscramble
   *      - Day 4: vocab items → flashcard_recall (no imageUrl)
   *      - Day 5: quizData sections 1-4 → quiz_comprehensive
   *      - Day 6: quizData section 5 (comprehension) → listening_choice
   */
  async getPracticeCycle(planId: string, dayOverride?: number): Promise<import("./learning.types").DailyPracticeSession> {
    const plan = await learningRepository.findPlanWithLessons(planId);
    if (!plan) throw new Error("Plan not found");

    // Find current lesson: first not completed, or last completed if all done
    const activeLessonRecord = plan.lessons.find(l => !l.isCompleted) || plan.lessons[plan.lessons.length - 1];
    if (!activeLessonRecord) throw new Error("No lessons in plan");

    const day = dayOverride ?? activeLessonRecord.completedPracticeDays + 1;
    
    // Safety check: day should be 1-6
    const clampedDay = Math.max(1, Math.min(6, day));

    // Fetch lesson details (items, quiz, media)
    const lesson = await curriculumRepository.findLessonById(activeLessonRecord.lessonId);
    if (!lesson) throw new Error("Lesson details not found");

    const coreItems = lesson.items.filter(i => i.priority === "CORE");
    const practiceItems: import("./learning.types").PracticeItem[] = [];

    const modeMap: Record<number, import("./learning.types").PracticeMode> = {
      1: "flashcard_visual",
      2: "gap_fill_listening",
      3: "sentence_unscramble",
      4: "flashcard_recall",
      5: "quiz_comprehensive",
      6: "listening_choice"
    };

    const mode = modeMap[clampedDay];

    switch (clampedDay) {
      case 1: // Visual Flashcard (Vocab + Structure)
      case 4: // Recall Flashcard (Vocab + Structure)
        coreItems.forEach(({ item }) => {
          const isStructure = item.type?.toUpperCase() === "STRUCTURE";
          const meta = item.metadata;
          const vocabMeta = !isStructure ? (meta as VocabMetadata) : null;
          const examples = meta.examples || [];
          const example = examples.length > 0 ? examples[0] : null;

          practiceItems.push({
            id: item.id,
            lessonId: activeLessonRecord.lessonId,
            type: isStructure ? "structure" : "item",
            renderMode: mode,
            mainText: isStructure && example ? example.text : item.lemma,
            flashcard: {
              front: isStructure && example ? example.text : item.lemma,
              back: isStructure && example ? example.translation : (meta.translation || vocabMeta?.meanings?.[0]?.translation || "..."),
              imageUrl: clampedDay === 1 ? vocabMeta?.image_url : null,
              useTTS: true
            }
          });
        });
        break;

      case 2: // Gap Fill (Vocab)
        coreItems.filter(i => i.item.type === "VOCABULARY").forEach(({ item }) => {
          const meta = item.metadata as { examples?: Array<{ text: string }> };
          const example = meta.examples?.[0];
          if (!example) return;

          // Simple gap replacement: replace lemma in example text with ____
          const regex = new RegExp(item.lemma, "gi");
          const gapText = example.text.replace(regex, "____");

          practiceItems.push({
            id: item.id,
            lessonId: activeLessonRecord.lessonId,
            type: "item",
            renderMode: "gap_fill_listening",
            mainText: gapText,
            gapFill: {
              sentenceWithGap: gapText,
              correctAnswer: item.lemma,
              fullSentenceForTTS: example.text,
              useTTS: true
            }
          });
        });
        break;

      case 3: // Unscramble (Structure)
        coreItems.filter(i => i.item.type === "STRUCTURE").forEach(({ item }) => {
          const meta = item.metadata as { examples?: Array<{ text: string; word_order: Array<{ word: string }> }> };
          const example = meta.examples?.[0];
          if (!example || !example.word_order) return;

          practiceItems.push({
            id: item.id,
            lessonId: activeLessonRecord.lessonId,
            type: "structure",
            renderMode: "sentence_unscramble",
            mainText: example.text,
            unscramble: {
              scrambledWords: [...example.word_order].sort(() => Math.random() - 0.5).map((w) => w.word),
              correctOrder: example.word_order.map((w) => w.word)
            }
          });
        });
        break;

      case 5: // Quiz Comprehensive (Sections 1-4)
      case 6: // Listening Choice (Section 5)
        if (lesson.quizData?.quiz_sections) {
          const sections = clampedDay === 5 
            ? lesson.quizData.quiz_sections.filter(s => s.type !== "comprehension")
            : lesson.quizData.quiz_sections.filter(s => s.type === "comprehension");

          sections.forEach(section => {
            section.questions.forEach((q, idx) => {
              practiceItems.push({
                id: `quiz-${section.type}-${idx}`,
                lessonId: activeLessonRecord.lessonId,
                type: "item",
                renderMode: mode,
                mainText: q.text,
                quiz: {
                  question: q.text,
                  options: q.options,
                  correctIndex: q.correctIndex ?? 0,
                  explanation: q.explanation,
                  sectionType: section.type,
                  audioSegment: q.audioRange && lesson.media?.url ? {
                    start: q.audioRange.start,
                    end: q.audioRange.end,
                    url: lesson.media.url
                  } : undefined
                }
              });
            });
          });
        }
        break;
    }

    return {
      dayIndex: clampedDay,
      mode,
      items: practiceItems,
      language: lesson.language?.code || "en-US"
    };
  },

  /**
   * Saves the ongoing session state to the database.
   * Used for resuming an interrupted session.
   */
  async saveSessionState(studentId: string, planId: string, state: import("./learning.types").SessionState) {
    await learningRepository.upsertSessionState({
      studentId,
      planId,
      state,
    });
    return { success: true };
  },

  /**
   * Retrieves a previously saved session state.
   */
  async getSessionState(planId: string): Promise<import("./learning.types").SessionState | null> {
    const session = await learningRepository.findSessionState(planId);
    return (session?.state as unknown as import("./learning.types").SessionState) || null;
  },

  /**
   * Clears the session state after a session is completed.
   */
  async clearSessionState(planId: string) {
    await learningRepository.deleteSessionState(planId);
    return { success: true };
  },

  /**
   * Processes the results of a completed practice session.
   * Calculates XP, calls recordPracticeResult for each item, and returns the summary.
   */
  async processSessionResults(
    studentId: string,
    planId: string,
    results: import("./learning.types").PracticeResult[],
    isReplay: boolean,
    streak: number
  ) {
    let xpGained = 0;
    const correctCount = results.filter((r) => r.grade >= 3).length;

    if (!isReplay) {
      // 1. Calculate XP: (correct_items * 10) + (streak * 2)
      xpGained = correctCount * 10 + streak * 2;

      await db.transaction(async (tx) => {
        // 2. Update SRS Progress for each item
        for (const result of results) {
          await this.recordPracticeResult(
            studentId,
            result.itemId,
            result.grade,
            result.lessonId,
            result.timestamp
          );
        }

        // 3. Update Lesson Completion Progress
        const plan = await this.getPlanById(planId);
        if (plan) {
          const activeLesson = plan.lessons.find(l => !l.isCompleted) || plan.lessons[plan.lessons.length - 1];
          if (activeLesson) {
            const newDay = Math.min(6, activeLesson.completedPracticeDays + 1);
            await learningRepository.updateLessonProgress(planId, activeLesson.lessonId, newDay);
          }
        }

        // 4. Update User XP & Streak
        const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, studentId) });
        if (user) {
          const now = new Date();
          const lastPractice = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null;
          let newStreak = user.streakCount || 0;

          // Streak logic
          if (lastPractice) {
            const { differenceInCalendarDays } = await import("date-fns");
            const diffDays = differenceInCalendarDays(now, lastPractice);

            if (diffDays === 1) {
              newStreak += 1;
            } else if (diffDays > 1) {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          await tx.update(usersTable)
            .set({ 
              currentXP: (user.currentXP || 0) + xpGained,
              streakCount: newStreak,
              lastPracticeDate: now,
              updatedAt: now
            })
            .where(eq(usersTable.id, studentId));

          // 5. Record XP Transaction
          if (xpGained > 0) {
            await tx.insert(learningXpTransactions).values({
              studentId,
              amount: xpGained,
              type: "practice_completion",
              description: `Prática concluída (Acertos: ${correctCount})`,
              metadata: { planId, streakBonus: streak * 2 }
            });
          }
        }
      });
    }

    return { xpGained, totalItems: results.length, correctCount };
  },

  /**
   * Allows a student to replay a completed practice day by spending XP.
   * Cost formula: 50 + (daysDiff * 10)
   */
  async purchaseReplaySession(
    studentId: string,
    planId: string,
    targetDay: number,
    currentDay: number
  ) {
    const daysDiff = Math.max(0, currentDay - targetDay);
    const cost = 50 + daysDiff * 10;

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, studentId) });
    if (!user || (user.currentXP || 0) < cost) {
      throw new Error("XP_INSUFFICIENT");
    }

    await db.transaction(async (tx) => {
      await tx.update(usersTable)
        .set({ currentXP: (user.currentXP || 0) - cost, updatedAt: new Date() })
        .where(eq(usersTable.id, studentId));

      // Record transaction
      await tx.insert(learningXpTransactions).values({
        studentId,
        amount: -cost,
        type: "replay_purchase",
        description: `Replay de Prática - Dia ${targetDay}`,
        metadata: { planId, targetDay, currentDay }
      });
    });

    return { success: true, cost };
  },

  /**
   * Calculates real-time learning statistics for a student.
   */
  async getStudentLearningStats(studentId: string): Promise<StudentLearningStats> {
    const activePlan = await learningRepository.findActivePlanWithLessons(studentId);
    
    const now = new Date();
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

    // 1. Items due today (nextReviewDate <= now)
    const dueItems = await db.select({ count: sql<number>`count(*)` })
      .from(studentItemProgress)
      .where(and(
        eq(studentItemProgress.studentId, studentId),
        sql`${studentItemProgress.nextReviewDate} <= ${now}`,
        sql`${studentItemProgress.status} IN ('ACTIVE', 'RECEPTIVE', 'MASTERED')`
      ));

    // 2. Items reviewed today
    const reviewedToday = await db.select({ count: sql<number>`count(*)` })
      .from(studentItemProgress)
      .where(and(
        eq(studentItemProgress.studentId, studentId),
        gte(studentItemProgress.lastReviewedAt, startOfToday)
      ));

    // 3. Total learned
    const learnedCount = await db.select({ count: sql<number>`count(*)` })
      .from(studentItemProgress)
      .where(and(
        eq(studentItemProgress.studentId, studentId),
        sql`${studentItemProgress.status} IN ('RECEPTIVE', 'MASTERED')`
      ));

    // 4. Progress and classes
    const activeLesson = activePlan?.lessons.find(l => !l.isCompleted) || activePlan?.lessons[activePlan?.lessons.length - 1];
    
    const lastClass = await db.query.slotInstances.findFirst({
        where: and(
            eq(slotInstances.studentId, studentId),
            eq(slotInstances.status, "completed")
        ),
        orderBy: [desc(slotInstances.startAt)]
    });

    return {
      reviewedToday: reviewedToday[0]?.count || 0,
      dueToday: dueItems[0]?.count || 0,
      totalLearned: learnedCount[0]?.count || 0,
      currentDay: activeLesson ? activeLesson.completedPracticeDays + 1 : 1,
      daysSinceClass: lastClass ? differenceInDays(new Date(), new Date(lastClass.startAt)) : 0,
      hasActiveLesson: !!activeLesson
    };
  },

  /**
   * Fetches detailed information about items already learned by the student.
   */
  async getLearnedItemsDetails(studentId: string): Promise<LearningItemDetail[]> {
    const items = await db.query.studentItemProgress.findMany({
      where: and(
        eq(studentItemProgress.studentId, studentId),
        sql`${studentItemProgress.status} IN ('RECEPTIVE', 'MASTERED')`
      ),
      with: {
        item: true
      },
      orderBy: [desc(studentItemProgress.updatedAt)]
    });

    return items.map(i => ({
      id: i.id,
      title: i.item?.lemma || "Unknown",
      type: i.item?.type === "STRUCTURE" ? "structure" : "item",
      learnedAt: i.createdAt
    }));
  },

  /**
   * Fetches detailed information about items reviewed today.
   */
  async getReviewedItemsDetails(studentId: string): Promise<LearningItemDetail[]> {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    
    const items = await db.query.studentItemProgress.findMany({
      where: and(
        eq(studentItemProgress.studentId, studentId),
        gte(studentItemProgress.lastReviewedAt, startOfToday)
      ),
      with: {
        item: true
      },
      orderBy: [desc(studentItemProgress.lastReviewedAt)]
    });

    return items.map(i => ({
      id: i.id,
      title: i.item?.lemma || "Unknown",
      type: i.item?.type === "STRUCTURE" ? "structure" : "item",
      reviewedAt: i.lastReviewedAt as Date
    }));
  },

  /**
   * CRON TASK: Scans students and sends appropriate reminders (Daily, Streak, Roadmap).
   */
  async sendPracticeReminders() {
    const students = await userRepository.findStudentsForReminders();
    const now = new Date();
    const localDetails = getLocalTimeDetails(now);
    const isLateDay = localDetails.hour >= 20; // After 8 PM

    let processedCount = 0;

    for (const student of students) {
      // 0. Resolve Notification Prefs
      const prefs = (student.notificationPrefs as NotificationPrefs) || { streak: true, roadmap: true, classes: true };

      // 1. Check if practiced today
      const alreadyPracticed = student.lastPracticeDate && 
        isSameDayInTimeZone(student.lastPracticeDate, now);

      if (alreadyPracticed) continue;

      // 2. Determine Trigger
      let triggerType: "daily" | "streak" | "roadmap" = "daily";
      
      // Streak Trigger (High Urgency)
      if (student.streakCount > 0 && isLateDay) {
        if (!prefs.streak) continue; // User disabled streak reminders
        triggerType = "streak";
      } 
      // Roadmap Trigger (Content accumulation)
      else {
        if (!prefs.roadmap) continue; // User disabled roadmap reminders
        const roadmap = await this.getStudentRoadmap(student.id);
        const hasPendingLessons = roadmap?.lessons.some(l => 
          l.scheduledDate && l.scheduledDate <= now && (l.completedPracticeDays || 0) < 1
        );

        if (hasPendingLessons) {
          triggerType = "roadmap";
        } else {
          triggerType = "daily";
        }
      }

      // 3. Resolve Random Template
      const templates = REMINDER_TEMPLATES[triggerType];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      const firstName = student.name ? student.name.split(" ")[0] : "estudante";

      const title = template.title
        .replace(/{name}/g, firstName)
        .replace(/{streak}/g, String(student.streakCount || 0));
      const body = template.body
        .replace(/{name}/g, firstName)
        .replace(/{streak}/g, String(student.streakCount || 0));

      // 4. Send via Notification Service with Click Tracker
      const baseUrl = "/hub/student/practice";
      const trackerUrl = `/api/notifications/click?url=${encodeURIComponent(baseUrl)}&type=${triggerType}&id=${now.getTime()}`;

      await notificationService.sendNotification({
        title,
        body,
        actionUrl: trackerUrl,
        targetType: "specific",
        userIds: [student.id],
        channels: {
          push: student.pushNotificationsEnabled,
          inApp: false
        }
      });

      processedCount++;
    }

    return processedCount;
  },

  async logEngagement(studentId: string, eventType: string, metadata?: Record<string, unknown>) {
    return learningRepository.createEngagementLog({
      studentId,
      eventType,
      metadata,
    });
  },

  async getStudentEnrichedLessons(studentId: string) {
    // 1. Buscar o plano ativo do aluno e suas lições
    const activePlan = await learningRepository.findActivePlanWithLessons(studentId);

    // 2. Buscar todas as aulas (slotInstances) agendadas ou completadas do aluno que possuam lições associadas
    const classes = await db.query.slotInstances.findMany({
      where: and(
        eq(slotInstances.studentId, studentId),
        isNotNull(slotInstances.lessonId)
      ),
      orderBy: [desc(slotInstances.startAt)]
    });

    // 3. Extrair os lessonIds únicos do plano ativo para evitar duplicidade
    const activePlanLessonIds = new Set(
      activePlan?.lessons.map((pl) => pl.lessonId) || []
    );

    // 4. Filtrar as lições das aulas que não fazem parte do plano ativo
    const classLessonsToFetch = classes
      .filter((c) => c.lessonId && !activePlanLessonIds.has(c.lessonId))
      .map((c) => c.lessonId as string);

    const uniqueClassLessonIds = Array.from(new Set(classLessonsToFetch));

    // 5. Buscar o conteúdo/detalhes dessas lições extras
    let extraLessons: Array<{ id: string; title: string; contentJson: JSONContent | null; scheduledDate?: Date }> = [];
    if (uniqueClassLessonIds.length > 0) {
      const dbLessons = await db.query.lessons.findMany({
        where: inArray(lessons.id, uniqueClassLessonIds)
      });

      extraLessons = dbLessons.map((l) => {
        const relatedClass = classes.find((c) => c.lessonId === l.id);
        return {
          id: l.id,
          title: l.title,
          contentJson: l.contentJson,
          scheduledDate: relatedClass ? new Date(relatedClass.startAt) : undefined,
        };
      });
    }

    const activeLessons = activePlan?.lessons.map((pl) => ({
      id: pl.lessonId,
      title: pl.lesson?.title || "Lição Sem Título",
      contentJson: pl.lesson?.contentJson || null,
      scheduledDate: pl.scheduledDate ? new Date(pl.scheduledDate) : undefined,
    })) || [];

    return {
      activePlan: activePlan
        ? {
            id: activePlan.id,
            name: activePlan.name,
            lessons: activeLessons,
          }
        : null,
      classLessons: extraLessons,
    };
  }
};

export function getLocalTimeDetails(date: Date, timeZone: string = "America/Sao_Paulo") {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)!.value;
  return {
    year: parseInt(getPart("year")),
    month: parseInt(getPart("month")), // 1-12
    day: parseInt(getPart("day")),
    hour: parseInt(getPart("hour")),
  };
}

export function isSameDayInTimeZone(date1: Date, date2: Date, timeZone: string = "America/Sao_Paulo"): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  return formatter.format(date1) === formatter.format(date2);
}

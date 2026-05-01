import { learningPlans, planLessons, learningPracticeSessions, learningXpTransactions } from "./learning.schema";

export interface StudentCurriculumGap {
    upcomingClassesCount: number;
    planLessonsCount: number;
    gap: number;
    hasGap: boolean;
    activePlanName?: string;
    activePlanId?: string;
    totalClasses: number;
    completedClasses: number;
    classesWithLesson: number;
    profileId?: string;
}

export type LearningPlan = typeof learningPlans.$inferSelect;
export type PlanLesson = typeof planLessons.$inferSelect;

export type LearningPlanWithLessons = LearningPlan & {
  lessons: Array<PlanLesson & {
    lesson?: {
      title: string;
      id: string;
    };
  }>;
};

export type PracticeSessionPersistence = typeof learningPracticeSessions.$inferSelect;
export type XpTransaction = typeof learningXpTransactions.$inferSelect;

// ================= PRACTICE SESSION TYPES =================

export type PracticeMode =
  | "flashcard_visual"
  | "gap_fill_listening"
  | "sentence_unscramble"
  | "flashcard_recall"
  | "quiz_comprehensive"
  | "listening_choice"
  | "review_standard";

export interface PracticeQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  sectionType?: string;
  audioSegment?: { start: number; end: number; url: string };
}

export interface TranscriptSegmentForPractice {
  text: string;
  start: number;
  end: number;
}

export interface LearningItemForPractice {
  id: string;
  mainText: string;
}

export interface PracticeItem {
  id: string;
  lessonId: string;
  type: "item" | "structure";
  renderMode: PracticeMode;
  mainText: string;

  flashcard?: {
    front: string;
    back: string;
    imageUrl?: string | null;
    useTTS?: boolean; // Always true for flashcard exercises
  };

  gapFill?: {
    sentenceWithGap: string;
    correctAnswer: string;
    fullSentenceForTTS: string; // The full sentence for TTS to read aloud
    useTTS: true;
  };

  unscramble?: {
    scrambledWords: string[];
    correctOrder: string[];
  };

  quiz?: PracticeQuizQuestion;

  interactiveListening?: {
    audioUrl: string | null;
    transcriptSegments: TranscriptSegmentForPractice[];
    learningItems: LearningItemForPractice[];
  };
}

export interface PracticeResult {
  itemId: string;
  lessonId: string;
  grade: 0 | 1 | 2 | 3 | 4 | 5;
  type: "item" | "structure";
  timestamp: Date;
}

export interface SessionState {
  planId: string;
  currentDay: number;
  mode: PracticeMode;
  currentIndex: number;
  results: PracticeResult[];
  items: PracticeItem[];
  lastUpdated: Date;
}

export interface DailyPracticeSession {
  dayIndex: number;
  mode: PracticeMode;
  items: PracticeItem[];
  error?: string;
}

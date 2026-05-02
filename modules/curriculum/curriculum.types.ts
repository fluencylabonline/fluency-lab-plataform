import { z } from "zod";

// ================= ENUMS & BASE TYPES =================

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type ItemPriority = "CORE" | "SECONDARY";

export type GrammaticalRole =
  | "subject"
  | "verb"
  | "object"
  | "adjective"
  | "adverb"
  | "preposition"
  | "conjunction"
  | "pronoun"
  | "determiner"
  | "particle";

export type LearningStructureType =
  //A1
  | "s-v" // Subject + Verb → "I run."
  | "s-v-o" // Subject + Verb + Object → "She eats apples."
  | "s-v-p-o" // Subject + Verb + Preposition + Object → "He listens to music."
  | "s-av" // Subject + Adjective + Verb → "She is happy."
  | "s-v-adv" // Subject + Verb + Adverb → "They speak well."

  //A2
  | "s-v-do-io" // Subject + Verb + Direct Object + Indirect Object → "She gave me a gift."
  | "s-v-o-o" // Subject + Verb + Object + Object → "He taught us English."
  | "s-av-v-o" // Subject + Adjective + Verb + Object → "She is ready to start."
  | "s-v-inf" // Subject + Verb + Infinitive → "I want to eat."
  | "s-v-ing" // Subject + Verb + Gerund → "She enjoys reading."

  //B1
  | "s-v-o-adv" // Subject + Verb + Object + Adverb → "She reads books carefully."
  | "s-v-o-p-o" // Subject + Verb + Object + Prep + Object → "He put the book on the table."
  | "s-v-that-s-v-o" // "I think that she likes coffee."
  | "s-v-wh" // Pergunta indireta → "I know where he lives."

  //B2
  | "passive-s-v-o" // Passive voice → "The book was written by her."
  | "s-modal-v-o" // Modal verbs → "She can solve the problem."
  | "s-v-o-to-v" // "She asked me to help."
  | "s-v-o-ing" // "I saw him running."

  //C1
  | "conditional-zero" // If you heat ice, it melts.
  | "conditional-first" // If it rains, I will stay home.
  | "conditional-second" // If I were rich, I would travel.
  | "conditional-third" // If I had studied, I would have passed.
  | "relative-clause-def" // The man who lives here...
  | "relative-clause-nondef" // My brother, who lives in Canada...
  | "s-v-o-which-s-v" // "I bought a car which was very expensive."

  //C2
  | "mixed-conditional" // If I had listened, I would be better now.
  | "passive-perfect" // The project has been completed.
  | "cleft-sentence" // What I need is a break.
  | "inversion-negative" // Never have I seen such a thing.
  | "s-v-o-participle"; // The man seen yesterday...

// ================= QUIZ & PRACTICE TYPES =================

export type QuizSectionType = "vocabulary" | "grammar" | "timestamp" | "context" | "comprehension";

export type PracticeMode =
  | "flashcard_visual"
  | "gap_fill_listening"
  | "sentence_unscramble"
  | "flashcard_recall"
  | "quiz_comprehensive"
  | "listening_choice"
  | "review_standard";

export interface AudioTimestamp {
  start: number;
  end: number;
}

export interface QuizQuestion {
  id?: string;
  text: string;
  type?: "multiple-choice" | "true-false";
  options: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation?: string;
  audioRange?: AudioTimestamp;
  relatedLearningItemId?: string;
}

export interface QuizData {
  quiz_sections?: Array<{
    type: QuizSectionType;
    questions: QuizQuestion[];
  }>;
  questions?: QuizQuestion[];
  passingScore?: number;
}

export interface QuizItem {
  priority: ItemPriority | string;
  item: {
    lemma: string;
  } | null;
}

export interface AnalysisResult {
  vocabulary: Array<{
    lemma: string;
    type: string;
    contextual_meaning: string;
    context?: string;
    processed?: boolean;
    term?: string;
    word?: string;
    meaning?: string;
    definition?: string;
  }>;
  structures: Array<{
    type: string;
    name: string;
    example_from_text: string;
    explanation?: string;
    context?: string;
    processed?: boolean;
    lemma?: string;
    contextual_meaning?: string;
  }>;
}

export interface PracticeItem {
  id: string;
  type: "item" | "structure";
  renderMode: PracticeMode;
  mainText: string;

  // Specific data based on renderMode
  flashcard?: {
    front: string;
    back: string;
    imageUrl?: string | null;
    useTTS?: boolean;
  };
  gapFill?: {
    sentenceWithGap: string;
    correctAnswer: string;
    audioSegment: AudioTimestamp;
    useTTS?: boolean;
  };
  unscramble?: {
    scrambledWords: string[];
    correctOrder: string[];
    wordRoles?: string[];
  };
  quiz?: QuizQuestion;
}

// ================= SCHEMA ENRICHMENT =================

export const vocabMetadataSchema = z.object({
  type: z.string(), // "noun", "verb", "adjective", etc.
  level: z.string(),
  phonetic: z.string(),
  translation: z.string().optional(),
  is_visual: z.boolean(),
  key_image_words: z.string(),
  image_url: z.string().url().nullable().optional(),
  meanings: z.array(z.object({
    definition: z.string(),
    translation: z.string(),
  })),
  forms: z.object({
    base: z.string(),
    past: z.string().optional(),
    participle: z.string().optional(),
    plural: z.string().optional(),
  }),
  examples: z.array(z.object({
    text: z.string(),
    translation: z.string(),
  })),
  synonyms: z.array(z.string()).optional(),
});

export const structureMetadataSchema = z.object({
  level: z.string(),
  structure_type: z.string(), // e.g. "Verb Tense", "Passive Voice"
  syntactic_pattern: z.string().optional(), // e.g. "SVO", "SV", "SVC"
  translation: z.string().optional(),
  explanation: z.string(),
  examples: z.array(z.object({
    text: z.string(),
    translation: z.string(),
    word_order: z.array(z.object({
      word: z.string(),
      index: z.number(),
      role: z.string()
    }))
  }))
});

export type VocabMetadata = z.infer<typeof vocabMetadataSchema>;
export type StructureMetadata = z.infer<typeof structureMetadataSchema>;

export type LearningItemMetadata = VocabMetadata | StructureMetadata;

// ================= ENTITIES =================

export interface Language {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
}

export interface LanguageWithLessons extends Language {
  lessons: Array<{ id: string }>;
}

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export interface Segment {
  word: string;
  start: number;
  end: number;
}

import type { JSONContent } from "@tiptap/core";

export type SectionStatus = "pass" | "partial" | "fail";
export type AnalysisStatus = "idle" | "analyzing" | "completed" | "error";

export interface MediaConfig {
  segments?: Segment[];
  [key: string]: unknown;
}

export interface QualityResult {
  isCompliant: boolean;
  score: number;
  suggestedLevel: string;
  sections: {
    objective: { status: "pass" | "partial" | "fail"; feedback: string };
    vocabulary: { status: "pass" | "partial" | "fail"; feedback: string };
    contextualization: { status: "pass" | "partial" | "fail"; feedback: string };
    guidedPractice: { status: "pass" | "partial" | "fail"; feedback: string };
    freeConversation: { status: "pass" | "partial" | "fail"; feedback: string };
    consolidation: { status: "pass" | "partial" | "fail"; feedback: string };
  };
  generalFeedback: string;
}

export interface Media {
  id: string;
  url: string;
  transcriptionText: string | null;
  transcriptionTimestamps: Segment[] | null;
  config: MediaConfig | null;
  type?: string | null;
  status: "pending_review" | "approved";
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaWithLessons extends Media {
  lessons: Array<{ id: string; title: string }>;
}

export interface Lesson {
  id: string;
  languageId: string;
  mediaId: string | null;
  title: string;
  difficulty: CEFRLevel | string;
  contentText: string | null;
  contentJson: JSONContent | null;
  analysisResultJson: AnalysisResult | null | undefined;
  qualityAnalysisJson: QualityResult | null | undefined;
  quizData: QuizData | null | undefined;
  embedding: number[] | null | undefined;
  status: "draft" | "transcribing" | "analyzing" | "processing_items" | "reviewing" | "reviewing_quiz" | "ready" | "error";
  creationStep: number;
  errorMessage: string | null;
  contentHash: string | null;
  version: number;
  deletedAt: Date | null | undefined;
  isRecessActivity: boolean | null;
  teacherId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonSummary extends Pick<Lesson, "id" | "title" | "difficulty" | "status" | "creationStep" | "version" | "createdAt" | "languageId" | "isRecessActivity" | "teacherId"> {
  language: Language | null;
  media: Media | null;
}

export interface LearningItem {
  id: string;
  languageId: string;
  type: "VOCABULARY" | "STRUCTURE" | string;
  lemma: string;
  metadata: LearningItemMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LessonWithDetails extends Lesson {
  language: Language | null;
  media: Media | null;
  items: Array<{
    priority: "CORE" | "SECONDARY";
    item: LearningItem;
    lessonId?: string;
    itemId?: string;
  }>;
}

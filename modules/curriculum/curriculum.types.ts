import { z } from "zod";

// ================= ENUMS & BASE TYPES =================

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

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
  | "s-v" 
  | "s-v-o" 
  | "passive-s-v-o" 
  | "conditional-first" 
  | "present-continuous" 
  | "past-simple" 
  | "future-will";

// ================= QUIZ & PRACTICE TYPES =================

export type QuizSectionType = "vocabulary" | "grammar" | "timestamps" | "context" | "comprehension";

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
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  audioRange?: AudioTimestamp; // Map to the transcription segment
  relatedLearningItemId?: string;
}

export interface QuizSection {
  type: QuizSectionType;
  questions: QuizQuestion[];
}

export interface QuizData {
  quiz_metadata: {
    title: string;
    level: CEFRLevel;
    dateGenerated: string;
  };
  quiz_sections: QuizSection[];
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
    correctOrder: string[] 
  };
  quiz?: QuizQuestion;
}

// ================= SCHEMA ENRICHMENT =================

export const vocabMetadataSchema = z.object({
  level: z.string(),
  phonetic: z.string(),
  is_visual: z.boolean(),
  key_image_words: z.string(),
  image_url: z.string().url().nullable().optional(),
  meanings: z.array(z.object({
    context: z.string(),
    definition: z.string(),
    example: z.string(),
  })),
  forms: z.object({
    base: z.string(),
    past: z.string().optional(),
    participle: z.string().optional(),
    plural: z.string().optional(),
  }),
  examples: z.array(z.string()),
  synonyms: z.array(z.string()).optional(),
  translation: z.string().optional(),
});

export type LearningItemMetadata = z.infer<typeof vocabMetadataSchema>;

export const structureMetadataSchema = z.object({
  LearningStructureType: z.string(),
  name: z.string(),
});

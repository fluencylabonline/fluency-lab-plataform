import { z } from "zod";

// ================= STEP SCHEMAS =================

export const step1Schema = z.object({
  fullName: z.string().min(3, "Nome muito curto"),
  birthDate: z.string().or(z.date()),
  isMinor: z.boolean().default(false),
  guardianName: z.string().optional(),
  guardianContact: z.string().optional(),
  occupation: z.string().min(2, "Informe sua profissão ou série escolar"),
});

export const step2Schema = z.object({
  languageOfInterest: z.string().uuid("Selecione um idioma").optional(),
  previousStudy: z.boolean(),
  studyDuration: z.enum(["less_than_6m", "6m_to_2y", "more_than_2y"]).optional(),
  selfAssessedLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

export const step3Schema = z.object({
  mainGoals: z.array(z.string()).min(1, "Selecione pelo menos um objetivo"),
  targetDeadline: z.string().optional(),
  deadlineReason: z.string().optional(),
  specificMotivation: z.string().optional(),
  commitmentLevel: z.number().min(1).max(10),
});

export const step4Schema = z.object({
  weeklyFrequency: z.number().min(1).max(7),
  preferredTimes: z.string().optional(),
  dailyStudyTime: z.enum(["none", "5_30min", "30_60min", "1h_plus"]),
});

export const step5Schema = z.object({
  employmentStatus: z.string().optional(),
  professionalArea: z.string().optional(),
  professionalUse: z.array(z.string()).optional(),
  usageType: z.enum(["writing", "speaking", "balanced"]),
  technicalVocabNeeded: z.boolean().default(false).optional(),
  currentUsageFrequency: z.string().optional(),
});

export const step6Schema = z.object({
  hobbies: z.array(z.string()).optional(),
  mediaConsumptionFrequency: z.string().optional(),
  contentTypes: z.array(z.string()).optional(),
  conversationTopics: z.string().optional(),
});

export const step7Schema = z.object({
  preferredMethods: z.array(z.string()).max(3, "Selecione no máximo 3 métodos"),
  activityPreferences: z.record(z.string(), z.number().min(1).max(5)).optional(),
});

export const step8Schema = z.object({
  mainDifficulties: z.array(z.string()).min(1, "Selecione pelo menos uma dificuldade"),
  whatWorked: z.string().optional(),
  whatDidntWork: z.string().optional(),
  specialNeeds: z.string().optional(),
  speakingAnxiety: z.enum(["none", "low", "medium", "high", "very_high"]),
});

export const step9Schema = z.object({
  languageVariant: z.string().optional(),
  accentGoal: z.enum(["intelligible", "natural"]).optional(),
  classExpectations: z.array(z.string()).max(3, "Selecione no máximo 3 expectativas"),
  learningPace: z.enum(["intense", "moderate", "relaxed", "flexible"]),
  correctionStyle: z.enum(["immediate", "important_only", "end_of_lesson", "gentle"]).optional(),
});

export const step10Schema = z.object({
  otherLanguages: z.string().optional(),
  generalObservations: z.string().optional(),
  restrictions: z.string().optional(),
  questions: z.string().optional(),
});

// ================= MAIN SCHEMA =================

export const studentProfileSurveySchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
  step5: step5Schema,
  step6: step6Schema,
  step7: step7Schema,
  step8: step8Schema,
  step9: step9Schema,
  step10: step10Schema,
});

export type StudentProfileSurveyData = z.infer<typeof studentProfileSurveySchema>;
export type StudentProfileSurveyInput = z.input<typeof studentProfileSurveySchema>;

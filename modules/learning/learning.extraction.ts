import { surveyStepSchemas, type SurveyStepKey } from "./learning.schema";

type StepData = Record<string, unknown>;
export type SurveyResponses = Partial<Record<SurveyStepKey, StepData>>;

/** Raw payload returned by the AI: values per step/field plus a supporting quote per field. */
export interface AudioExtractionPayload {
  responses?: Record<string, Record<string, unknown> | null>;
  evidence?: Record<string, string | null>;
}

export interface AudioExtractionResult {
  /** Survey responses after merging (defaults + existing draft + extracted values). */
  responses: SurveyResponses;
  /** Fields filled by the AI, as "step3.mainGoals". */
  filled: string[];
  /** Supporting quote from the audio for each filled field. */
  evidence: Record<string, string>;
}

/**
 * Mirrors the defaults of the profile review form. A draft saved by it
 * contains these values even when nobody touched the field, so a value equal to
 * its default is treated as "empty" and may be overwritten by the AI.
 */
export const SURVEY_DEFAULTS: Required<SurveyResponses> = {
  step1: { fullName: "", occupation: "", approximateAge: "", isMinor: false },
  step2: { selfAssessedLevel: "A1", previousStudy: false, previousStudyDetails: "" },
  step3: { mainGoals: [], customGoal: "", commitmentLevel: 2 },
  step4: { weeklyFrequency: 1, dailyStudyTime: "none" },
  step5: { professionalArea: "", technicalVocabNeeded: false, usageType: "balanced", employmentStatus: "employed" },
  step6: { conversationTopics: "" },
  step7: { preferredMethods: [], activityPreferences: {} },
  step8: { mainDifficulties: [], speakingAnxiety: "none" },
  step9: { classExpectations: [], learningPace: "moderate", accentGoal: "intelligible", correctionStyle: "end_of_lesson" },
  step10: { generalObservations: "" },
};

/** Fields the wizard renders from a fixed option list; values outside it would show nothing. */
const ALLOWED_OPTIONS: Record<string, readonly string[]> = {
  "step3.mainGoals": ["fluency", "travel", "work", "exams", "hobby", "moving", "other"],
  "step5.employmentStatus": ["employed", "seeking", "student"],
  "step7.preferredMethods": ["visual", "auditory", "reading", "practical", "grammar"],
  "step8.mainDifficulties": ["Pronúncia", "Gramática", "Vocabulário", "Escuta", "Falar em público"],
  "step9.classExpectations": ["conversation_focus", "grammar_focus", "exam_prep", "business"],
};

/** The language of interest is a database id the audio cannot reveal. */
const SKIPPED_FIELDS = new Set(["step2.languageOfInterest"]);

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

function isEmptyOrDefault(value: unknown, defaultValue: unknown): boolean {
  if (isBlank(value)) return true;
  return JSON.stringify(value) === JSON.stringify(defaultValue);
}

/** Keeps only the allowed options of a list field; returns undefined if nothing is left. */
function restrictToOptions(path: string, value: unknown): unknown {
  const allowed = ALLOWED_OPTIONS[path];
  if (!allowed) return value;
  if (Array.isArray(value)) {
    const kept = value.filter((v) => typeof v === "string" && allowed.includes(v));
    return kept.length > 0 ? kept : undefined;
  }
  return typeof value === "string" && allowed.includes(value) ? value : undefined;
}

/**
 * Merges the AI output into the existing responses, filling only what is still
 * empty. Every value is validated against its own field schema; invalid or
 * unknown values are dropped so the field simply stays blank for the admin.
 */
export function mergeAudioExtraction(
  existing: SurveyResponses | null | undefined,
  payload: AudioExtractionPayload,
): AudioExtractionResult {
  const responses: SurveyResponses = {};
  const filled: string[] = [];
  const evidence: Record<string, string> = {};

  for (const step of Object.keys(surveyStepSchemas) as SurveyStepKey[]) {
    const defaults = SURVEY_DEFAULTS[step];
    const current = existing?.[step] ?? {};
    const extracted = payload.responses?.[step] ?? {};
    const shape = surveyStepSchemas[step].shape as Record<string, { safeParse: (v: unknown) => { success: boolean; data?: unknown } }>;
    const merged: StepData = { ...defaults, ...current };

    for (const [field, raw] of Object.entries(extracted)) {
      const path = `${step}.${field}`;
      if (SKIPPED_FIELDS.has(path) || !(field in shape) || isBlank(raw)) continue;
      if (!isEmptyOrDefault(merged[field], defaults[field])) continue;

      const restricted = restrictToOptions(path, raw);
      if (restricted === undefined) continue;
      const parsed = shape[field].safeParse(restricted);
      if (!parsed.success) continue;

      merged[field] = parsed.data;
      filled.push(path);
      const quote = payload.evidence?.[path];
      if (quote && quote.trim()) evidence[path] = quote.trim();
    }

    responses[step] = merged;
  }

  return { responses, filled, evidence };
}

import { Difficulty } from "@/modules/immersion/immersion.types";
export type PersistedWordLadderState = {
  selectedLang: string;
  length: 5;
  startWord: string;
  goalWord: string;
  steps: string[];
  current: string;
  finished: boolean;
  learningMode: boolean;
  solution?: string[] | null;
  difficulty?: Difficulty;
  savedAt: number;
};

export const WORD_LADDER_PERSIST_KEY = "immersion_word_ladder_progress";
export const WORD_LADDER_PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const WORD_LADDER_MAX_ROWS = 12;

function differsByOne(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff += 1;
    if (diff > 1) return false;
  }
  return diff === 1;
}

function normalizeWord(input: string): string {
  const onlyLetters = input.normalize("NFKD").replace(/[^\p{L}]/gu, "");
  return onlyLetters.toLowerCase();
}

function normalizeLang(input: string): string {
  const base = (input || "").trim().toLowerCase().split("-")[0] || "en";
  return base;
}

function normalizeLength(input: unknown): 5 | null {
  if (input === 5) return 5;
  return null;
}

function normalizeSteps(raw: unknown, length: number): string[] | null {
  if (!Array.isArray(raw)) return null;
  const steps = raw
    .filter((x) => typeof x === "string")
    .map((x) => normalizeWord(x))
    .filter((x) => x.length === length);
  if (steps.length === 0) return [];
  if (steps.length > WORD_LADDER_MAX_ROWS) return null;
  for (let i = 1; i < steps.length; i++) {
    if (!differsByOne(steps[i - 1], steps[i])) return null;
  }
  return steps;
}

function normalizeSolution(raw: unknown, length: number): string[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const sol = raw
    .filter((x) => typeof x === "string")
    .map((x) => normalizeWord(x))
    .filter((x) => x.length === length);
  if (sol.length < 2) return null;
  if (sol.length > WORD_LADDER_MAX_ROWS) return null;
  for (let i = 1; i < sol.length; i++) {
    if (!differsByOne(sol[i - 1], sol[i])) return null;
  }
  return sol;
}

export function loadPersistedWordLadderState(): PersistedWordLadderState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(WORD_LADDER_PERSIST_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (!data) return null;
    if (typeof data.savedAt !== "number") return null;
    if (Date.now() - data.savedAt > WORD_LADDER_PERSIST_TTL_MS) {
      localStorage.removeItem(WORD_LADDER_PERSIST_KEY);
      return null;
    }

    const length = normalizeLength(data.length);
    if (!length) return null;

    const selectedLang = normalizeLang(data.selectedLang);
    const startWord = normalizeWord(
      typeof data.startWord === "string" ? data.startWord : ""
    );
    const goalWord = normalizeWord(
      typeof data.goalWord === "string" ? data.goalWord : ""
    );
    if (!startWord || !goalWord) return null;
    if (startWord.length !== length || goalWord.length !== length) return null;

    const steps = normalizeSteps(data.steps, length);
    if (!steps) return null;
    if (steps.length && steps[0] !== startWord) return null;

    const current =
      typeof data.current === "string"
        ? normalizeWord(data.current).slice(0, length)
        : "";

    const finished = data.finished === true;
    const learningMode = data.learningMode !== false;
    const solution = normalizeSolution(data.solution, length);
    if (
      solution &&
      (solution[0] !== startWord || solution[solution.length - 1] !== goalWord)
    ) {
      // return null; // Relaxing this check if solution changed but words match
    }

    const difficulty = (data.difficulty as Difficulty) || "medium";

    return {
      selectedLang,
      length,
      startWord,
      goalWord,
      steps,
      current,
      finished,
      learningMode,
      solution,
      difficulty,
      savedAt: data.savedAt,
    };
  } catch {
    return null;
  }
}

export function savePersistedWordLadderState(
  state: Omit<PersistedWordLadderState, "savedAt">
) {
  if (typeof window === "undefined") return;
  const payload: PersistedWordLadderState = { ...state, savedAt: Date.now() };
  localStorage.setItem(WORD_LADDER_PERSIST_KEY, JSON.stringify(payload));
}

export function clearPersistedWordLadderState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WORD_LADDER_PERSIST_KEY);
}

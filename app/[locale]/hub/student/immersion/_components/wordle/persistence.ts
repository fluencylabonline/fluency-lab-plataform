import type { WordleState, WordDetails } from "@/modules/immersion/immersion.types";

export type PersistedWordleState = WordleState & {
  details?: WordDetails | null;
  savedAt: number;
};

export const WORDLE_MAX_ATTEMPTS = 6;
export const WORDLE_PERSIST_KEY = "immersion_wordle_progress";
export const WORDLE_PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function loadPersistedWordleState(): PersistedWordleState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(WORDLE_PERSIST_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (!data || typeof data.savedAt !== "number") return null;
    
    // Check TTL
    if (Date.now() - data.savedAt > WORDLE_PERSIST_TTL_MS) {
      localStorage.removeItem(WORDLE_PERSIST_KEY);
      return null;
    }

    return data as PersistedWordleState;
  } catch (err) {
    console.error("Error loading persisted Wordle state:", err);
    return null;
  }
}

export function savePersistedWordleState(
  state: Omit<PersistedWordleState, "savedAt">
) {
  if (typeof window === "undefined") return;
  const payload: PersistedWordleState = { ...state, savedAt: Date.now() };
  localStorage.setItem(WORDLE_PERSIST_KEY, JSON.stringify(payload));
}

export function clearPersistedWordleState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WORDLE_PERSIST_KEY);
}

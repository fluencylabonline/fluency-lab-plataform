import ptWords from "./_vocabulary/palavras.json";
import enWords from "./_vocabulary/words.json";
import { getAvailableWordsAction } from "@/modules/immersion/immersion.actions";
import { getStudentLanguagesAction } from "@/modules/user/user.actions";

export type LearnedWord = {
  id: string;
  word: string;
  type: "item" | "structure";
  lang?: string;
};

const WORD_LENGTH = { min: 4, max: 8 } as const;

const isValidLength = (w: string) =>
  w.length >= WORD_LENGTH.min && w.length <= WORD_LENGTH.max;

function normalizeWord(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[^\p{L}]/gu, "")
    .toLowerCase();
}

// client-only
export async function fetchLearnedWords(lang: string = "en"): Promise<LearnedWord[]> {
  const result = await getAvailableWordsAction({ lang });
  if (!result || !result.data) return [];
  
  return result.data.map(it => ({
    id: it.id,
    word: it.word,
    type: it.type as "item" | "structure",
    lang: it.lang
  }));
}

// client-only
export async function getStudentLanguages(): Promise<string[]> {
  const result = await getStudentLanguagesAction();
  if (!result || !result.data) return ["en"];
  
  const langs = result.data.filter((x): x is string => typeof x === "string");
  return langs.length ? langs.map((x) => x.toLowerCase()) : ["en"];
}

// Para adicionar um novo idioma futuramente, basta importar o JSON (string[])
// e adicionar uma entrada aqui: ex. fr: frWords as string[]
const VOCAB_LISTS: Record<string, unknown> = {
  en: enWords,
  pt: ptWords,
};

function getRawVocabList(lang: string): string[] {
  const base = lang.toLowerCase().split("-")[0];
  const raw = VOCAB_LISTS[base] || VOCAB_LISTS["en"];
  if (Array.isArray(raw)) return raw;
  if (
    raw &&
    typeof raw === "object" &&
    "default" in raw &&
    Array.isArray((raw as { default: unknown }).default)
  ) {
    return (raw as { default: string[] }).default;
  }
  return [];
}

const vocabWordSetCache: Record<string, Set<string>> = {};

function getVocabWordSet(lang: string): Set<string> {
  const base = lang.toLowerCase().split("-")[0];
  if (vocabWordSetCache[base]) return vocabWordSetCache[base];
  const set = new Set<string>();
  const list = getRawVocabList(base);
  for (const w of list) {
    const normalized = normalizeWord(w);
    if (normalized) set.add(normalized);
  }
  return (vocabWordSetCache[base] = set);
}

export function wordExistsInVocabulary(word: string, lang: string): boolean {
  return getVocabWordSet(lang).has(normalizeWord(word));
}

export function getVocabularyWords(lang: string): string[] {
  return Array.from(getVocabWordSet(lang)).filter(isValidLength);
}

function wordsFromVocabulary(code: string): LearnedWord[] {
  const seen = new Set<string>();
  const result: LearnedWord[] = [];
  
  const list = getRawVocabList(code);

  for (const w of list) {
    const normalized = normalizeWord(w);
    if (!normalized || !isValidLength(normalized) || seen.has(normalized))
      continue;
    seen.add(normalized);
    result.push({ id: normalized, word: normalized, type: "item", lang: code });
    if (result.length >= 4000) break;
  }
  return result;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

type BlockedEntry = { word: string; ts: number };

export type PlayedEntry = {
  word: string;
  ts: number;
  success?: boolean;
  attempts?: number;
  lang?: string;
  length?: number;
};

const BLOCKED_KEY = "immersion_wordle_blocked_words";
const HISTORY_KEY = "immersion_wordle_history";

const isBlockedEntry = (x: unknown): x is BlockedEntry => {
  if (!x || typeof x !== "object") return false;
  const entry = x as Record<string, unknown>;
  return typeof entry.word === "string" && typeof entry.ts === "number";
};

const isPlayedEntry = (x: unknown): x is PlayedEntry => {
  if (!x || typeof x !== "object") return false;
  const entry = x as Record<string, unknown>;
  return typeof entry.word === "string" && typeof entry.ts === "number";
};

// client-only
function getStore<T>(key: string, isValid: (x: unknown) => x is T): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(isValid);
  } catch {
    return [];
  }
}

// client-only
function setStore<T extends { ts: number }>(
  key: string,
  arr: T[],
  maxAgeMs: number
) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const pruned = arr.filter((x) => now - x.ts < maxAgeMs);
  localStorage.setItem(key, JSON.stringify(pruned));
}

// client-only
function getBlockedStore(): BlockedEntry[] {
  return getStore(BLOCKED_KEY, isBlockedEntry);
}

// client-only
function setBlockedStore(arr: BlockedEntry[]) {
  setStore(BLOCKED_KEY, arr, 3 * 24 * 60 * 60 * 1000);
}

// client-only
export function markWordPlayed(word: string) {
  const store = getBlockedStore();
  store.push({ word, ts: Date.now() });
  setBlockedStore(store);
}

// client-only
function getHistoryStore(): PlayedEntry[] {
  return getStore(HISTORY_KEY, isPlayedEntry);
}

// client-only
function setHistoryStore(arr: PlayedEntry[]) {
  setStore(HISTORY_KEY, arr, 30 * 24 * 60 * 60 * 1000);
}

// client-only
export function getPlayedWordsHistory(days: number = 7): PlayedEntry[] {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return getHistoryStore()
    .filter((x) => x.ts >= cutoff)
    .sort((a, b) => b.ts - a.ts);
}

// client-only
export function recordGameResult(entry: PlayedEntry) {
  const store = getHistoryStore();
  let updated = false;
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].word === entry.word) {
      store[i] = { ...store[i], ...entry };
      updated = true;
      break;
    }
  }
  if (!updated) store.push(entry);
  setHistoryStore(store);
}

// ─── Word selection ──────────────────────────────────────────────────────────

// client-only
export async function getAvailableWords(lang: string = "en"): Promise<LearnedWord[]> {
  const blocked = getBlockedStore();
  const blockedSet = new Set<string>();
  const now = Date.now();
  for (const e of blocked) {
    if (now - e.ts < 2 * 24 * 60 * 60 * 1000) blockedSet.add(e.word);
  }

  const learned = await fetchLearnedWords(lang);
  let pool = learned.filter((w) => !blockedSet.has(w.word));
  
  // If we have enough words, return them
  if (pool.length >= 15) return pool;

  // Client-side fallback if server returns few words
  // We use the static JSONs we have in the client bundle
  const staticFallback = wordsFromVocabulary(lang);
  const uniqueFallback = staticFallback.filter(w => !pool.some(p => p.word === w.word));
  
  pool = [...pool, ...uniqueFallback.slice(0, 100)];

  return pool;
}

export function pickTargetWord(words: LearnedWord[]): LearnedWord | null {
  if (!words.length) return null;
  const five = words.filter((w) => w.word.length === 5);
  if (!five.length && process.env.NODE_ENV !== "production") {
    console.warn(
      "[wordle] pickTargetWord fallback: no 5-letter words in pool",
      {
        total: words.length,
      }
    );
  }
  const pool = five.length ? five : words;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Word details ────────────────────────────────────────────────────────────

export type WordDetails = {
  definitions: string[];
  synonyms: string[];
  examples: string[];
};

// client-only
export async function fetchWordDetails(
  word: string,
  lang: string
): Promise<WordDetails> {
  try {
    const url = new URL("/api/words/definition", window.location.origin);
    url.searchParams.set("q", word);
    url.searchParams.set("lang", (lang || "en").toLowerCase());
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return { definitions: [], synonyms: [], examples: [] };
    const data = await res.json();
    return {
      definitions: Array.isArray(data.definitions) ? data.definitions : [],
      synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
      examples: Array.isArray(data.examples) ? data.examples : [],
    };
  } catch {
    return { definitions: [], synonyms: [], examples: [] };
  }
}

import { immersionRepository } from "./immersion.repository";
import { immersionHistory } from "./immersion.schema";
import { eq, and, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { LearnedWord, PlayedEntry, ImmersionGameId, ImmersionState } from "./immersion.types";
import { studentItemProgress } from "@/modules/learning/learning.schema";
import { learningItems } from "@/modules/curriculum/curriculum.schema";
import enWords from "./_vocabulary/words.json";
import ptWords from "./_vocabulary/palavras.json";

const VOCAB_LISTS: Record<string, string[]> = {
  en: enWords as string[],
  pt: ptWords as string[],
};

function normalizeWord(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[^\p{L}]/gu, "")
    .toLowerCase();
}

const WORD_LENGTH = { min: 4, max: 8 } as const;

const isValidLength = (w: string) =>
  w.length >= WORD_LENGTH.min && w.length <= WORD_LENGTH.max;

export const immersionService = {
  // ================= PROGRESS =================

  async getProgress(userId: string, gameId: ImmersionGameId) {
    return immersionRepository.findProgress(userId, gameId);
  },

  async saveProgress(userId: string, gameId: ImmersionGameId, state: ImmersionState, lang: string) {
    return immersionRepository.upsertProgress({
      userId,
      gameId,
      state,
      lang,
    });
  },

  async deleteProgress(userId: string, gameId: ImmersionGameId) {
    return immersionRepository.deleteProgress(userId, gameId);
  },

  // ================= HISTORY =================

  async getHistory(userId: string, gameId: ImmersionGameId, limit: number = 30) {
    return immersionRepository.findHistory(userId, gameId, limit);
  },

  async recordResult(userId: string, gameId: ImmersionGameId, entry: PlayedEntry) {
    // 1. Save to history
    await immersionRepository.createHistoryEntry({
      userId,
      gameId,
      lang: entry.lang,
      word: entry.word,
      success: entry.success,
      attempts: entry.attempts,
      metadata: entry.metadata || {},
      playedAt: new Date(entry.ts),
    });

    // 2. Clear active progress as the game is finished
    await this.deleteProgress(userId, gameId);
  },

  // ================= GAME LOGIC =================

  async getAvailableWords(userId: string, lang: string): Promise<LearnedWord[]> {
    try {
      const baseLang = (lang || "en").toLowerCase().split("-")[0];
      
      // 1. Get recently played words from history (last 2 days) to avoid repetition
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const history = await db.query.immersionHistory.findMany({
        where: and(
          eq(immersionHistory.userId, userId),
          gte(immersionHistory.playedAt, twoDaysAgo)
        ),
        columns: { word: true }
      }).catch(err => {
        console.error("[immersionService] history query failed:", err);
        return [];
      });
      
      const blockedSet = new Set(history.map((h: { word: string; }) => normalizeWord(h.word)));

      // 2. Fetch words from Student's Learned Cards (SRS) filtered by language
      // We first need the language ID
      const targetLang = await db.query.languages.findFirst({
        where: (l, { eq }) => eq(l.code, baseLang.toLowerCase())
      });

      let srsItems: { id: string; word: string; type: "VOCABULARY" | "STRUCTURE" }[] = [];
      if (targetLang) {
        srsItems = await (db
          .select({
            id: learningItems.id,
            word: learningItems.lemma,
            type: learningItems.type,
          })
          .from(studentItemProgress)
          .innerJoin(learningItems, eq(studentItemProgress.itemId, learningItems.id))
          .where(and(
            eq(studentItemProgress.studentId, userId),
            eq(learningItems.languageId, targetLang.id),
            inArray(studentItemProgress.status, ["ACTIVE", "RECEPTIVE", "MASTERED"])
          )) as Promise<{ id: string; word: string; type: "VOCABULARY" | "STRUCTURE" }[]>)
          .catch(err => {
            console.error("[immersionService] srsItems query failed:", err);
            return [];
          });
      }

      const learnedWords: LearnedWord[] = srsItems
        .map(item => ({
          id: item.id,
          word: normalizeWord(item.word),
          type: item.type === "STRUCTURE" ? ("structure" as const) : ("item" as const),
          lang
        }))
        .filter(w => isValidLength(w.word) && !blockedSet.has(w.word));

      // 3. Fallback to Static Vocabulary if student has few learned words
      const staticVocab: LearnedWord[] = [];
      
      // Safety check for the list
      let list: string[] = [];
      const rawList = VOCAB_LISTS[baseLang] || VOCAB_LISTS["en"];
      
      if (Array.isArray(rawList)) {
        list = rawList;
      }

      if (list.length > 0) {
        for (const w of list) {
          if (typeof w !== "string") continue;
          const normalized = normalizeWord(w);
          if (normalized && isValidLength(normalized) && !blockedSet.has(normalized)) {
            staticVocab.push({
              id: `static_${normalized}`,
              word: normalized,
              type: "item" as const,
              lang
            });
          }
        }
      }

      // Hard fallback if still empty
      if (staticVocab.length === 0 && learnedWords.length === 0) {
        const fallbackSet = baseLang === "pt" 
          ? ["falar", "comer", "beber", "andar", "viver", "mundo", "tempo", "noite"]
          : ["speak", "world", "water", "night", "place", "thing", "house", "light"];
          
        fallbackSet.forEach(w => {
          staticVocab.push({
            id: `emergency_${w}`,
            word: w,
            type: "item" as const,
            lang
          });
        });
      }

      // Merge and deduplicate
      const seen = new Set(learnedWords.map(w => w.word.toLowerCase()));
      const uniqueFallback = staticVocab.filter(w => !seen.has(w.word.toLowerCase()));

      return [...learnedWords, ...uniqueFallback];
    } catch (error) {
      console.error("[immersionService] getAvailableWords fatal error:", error);
      return [];
    }
  },

  pickTargetWord(words: LearnedWord[], length: number = 5): LearnedWord | null {
    if (!words.length) return null;
    
    const candidates = words.filter(w => w.word.length === length);
    const pool = candidates.length ? candidates : words;
    
    return pool[Math.floor(Math.random() * pool.length)];
  },

  wordExistsInVocabulary(word: string, lang: string): boolean {
    const normalized = normalizeWord(word);
    const baseLang = lang.toLowerCase().split("-")[0];
    const list = VOCAB_LISTS[baseLang] || [];
    
    return list.some(w => normalizeWord(w) === normalized);
  }
};

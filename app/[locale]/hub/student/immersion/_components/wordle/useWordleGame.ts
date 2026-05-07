"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CellState,
  FinishedState,
  LearnedWord,
  WordleState,
  PlayedEntry,
} from "@/modules/immersion/immersion.types";
import { evaluateGuess } from "./evaluateGuess";
import {
  clearPersistedWordleState,
  loadPersistedWordleState,
  savePersistedWordleState,
  WORDLE_MAX_ATTEMPTS,
} from "./persistence";
import { 
  saveImmersionProgressAction, 
  recordImmersionResultAction 
} from "@/modules/immersion/immersion.actions";
import { pickTargetWord, getAvailableWords } from "../Database";

const guessResultScore: Record<CellState, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

export interface WordleGameProps {
  initialProgress: WordleState | null;
  initialAvailableWords: LearnedWord[];
  initialHistory: PlayedEntry[];
  selectedLang: string;
}

export function useWordleGame({
  initialProgress,
  initialAvailableWords,
  initialHistory,
  selectedLang: serverSelectedLang,
}: WordleGameProps) {
  // Persistence logic: LocalStorage vs Server
  const initialPersisted = useMemo(() => loadPersistedWordleState(), []);
  
  // Decide which state to use as base
  const baseState = useMemo(() => {
    if (!initialPersisted) return initialProgress;
    // If we have local state, use it (it might be newer or offline progress)
    // In a real app, we might compare timestamps, but for Wordle, local is usually what the user expects if they were playing
    return initialPersisted;
  }, [initialPersisted, initialProgress]);

  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => baseState?.selectedLang || serverSelectedLang);
  const [target, setTarget] = useState<LearnedWord | null>(() => {
    if (baseState?.target) return baseState.target;
    // If no progress, pick one from the initial words passed by RSC
    return pickTargetWord(initialAvailableWords);
  });
  const [guesses, setGuesses] = useState<string[]>(() => baseState?.guesses ?? []);
  const [current, setCurrent] = useState(() => baseState?.current ?? "");
  const [finished, setFinished] = useState<FinishedState>(() => baseState?.finished ?? null);
  const [availableWords, setAvailableWords] = useState<LearnedWord[]>(initialAvailableWords);
  const [shaking, setShaking] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<PlayedEntry[]>(initialHistory);
  const [availableLangs] = useState<string[]>(["en", "pt"]);

  const maxAttempts = WORDLE_MAX_ATTEMPTS;
  const length = target?.word.length || 5;
  const shakeTimeoutRef = useRef<number | null>(null);

  const availableWordSet = useMemo(() => {
    const set = new Set<string>();
    for (const w of availableWords) set.add(w.word.toLowerCase());
    return set;
  }, [availableWords]);

  const evaluations = useMemo<CellState[][]>(() => {
    if (!target) return [];
    return guesses.map((g) => evaluateGuess(g, target.word));
  }, [guesses, target]);

  const letterStates = useMemo<Record<string, CellState>>(() => {
    const map: Record<string, CellState> = {};
    guesses.forEach((g, gi) => {
      const ev = evaluations[gi] || [];
      for (let i = 0; i < g.length; i++) {
        const ch = g[i];
        const st: CellState = ev[i] ?? "absent";
        const prev: CellState | undefined = map[ch];
        if (!prev || guessResultScore[st] > guessResultScore[prev])
          map[ch] = st;
      }
    });
    return map;
  }, [guesses, evaluations]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => setShaking(false), 450);
  }, []);

  const syncToServer = useCallback(async (state: WordleState) => {
    // Background sync
    saveImmersionProgressAction({
      gameId: "wordle",
      lang: state.selectedLang,
      state: {
        guesses: state.guesses,
        current: state.current,
        finished: state.finished,
        target: state.target,
        selectedLang: state.selectedLang,
      },
    });
  }, []);

  const startNewGame = useCallback(async (lang: string) => {
    clearPersistedWordleState();
    setCurrent("");
    setGuesses([]);
    setFinished(null);
    setLoading(true);

    const pool = await getAvailableWords(lang);
    setAvailableWords(pool);
    
    // We use the same picking logic as the server to be consistent
    const pick = pickTargetWord(pool);
    
    if (pick) {
      const newState: WordleState = {
        target: pick,
        guesses: [],
        current: "",
        finished: null,
        selectedLang: lang,
      };
      setTarget(pick);
      setSelectedLang(lang);
      savePersistedWordleState(newState);
      syncToServer(newState);
    }
    
    setLoading(false);
  }, [syncToServer]);

  const enter = useCallback(async () => {
    if (finished || !target) return;

    const normalized = current.trim().toLowerCase();
    if (normalized.length !== length) {
      if (normalized.length < length) {
        toast.error("Palavra muito curta");
      }
      return;
    }

    // Check if word exists in our available words or some general vocabulary
    // For now, we only allow words from our availableWords pool for simplicity
    // or we could implement a check against a larger list if we had one.
    if (!availableWordSet.has(normalized)) {
      triggerShake();
      toast.error("Palavra não encontrada", {
        description: "Não está no seu vocabulário disponível",
      });
      return;
    }

    const nextCount = guesses.length + 1;
    const win = normalized === target.word.toLowerCase();
    const newGuesses = [...guesses, normalized];
    let newFinished: FinishedState = null;

    if (win) newFinished = "win";
    else if (nextCount >= maxAttempts) newFinished = "lose";

    setGuesses(newGuesses);
    setFinished(newFinished);
    setCurrent("");

    const newState: WordleState = {
      target,
      guesses: newGuesses,
      current: "",
      finished: newFinished,
      selectedLang,
    };

    // Update LocalStorage
    savePersistedWordleState(newState);

    // Sync to Server
    syncToServer(newState);

    if (newFinished) {
      const result = {
        word: target.word,
        ts: Date.now(),
        success: win,
        attempts: nextCount,
        lang: target.lang || selectedLang,
        length,
      };
      
      // Record result in history
      const recordResult = await recordImmersionResultAction({
        gameId: "wordle",
        entry: result,
      });
      if (recordResult?.data?.success) {
        // Refresh local history entries if needed
        // For now just add it locally
        setHistoryEntries(prev => [result, ...prev]);
      }
    }
  }, [availableWordSet, current, finished, guesses, length, maxAttempts, selectedLang, syncToServer, target, triggerShake]);

  const onLetter = useCallback(
    (ch: string) => setCurrent((p) => (p.length >= length ? p : p + ch)),
    [length],
  );

  const onBackspace = useCallback(() => setCurrent((p) => p.slice(0, -1)), []);

  // Sync current typing to LocalStorage (optional, but good for persistence)
  useEffect(() => {
    if (!target) return;
    savePersistedWordleState({
      target,
      guesses,
      current,
      finished,
      selectedLang,
    });
  }, [current, finished, guesses, selectedLang, target]);

  // listener de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finished || !target) return;

      if (e.key === "Enter") return enter();
      if (e.key === "Backspace") return onBackspace();

      const ch = e.key.toLowerCase();
      if (ch.length === 1 && ch >= "a" && ch <= "z") {
        onLetter(ch);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enter, finished, onBackspace, onLetter, target]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  return {
    loading,
    target,
    guesses,
    current,
    finished,
    selectedLang,
    setSelectedLang,
    availableWords,
    maxAttempts,
    length,
    evaluations,
    letterStates,
    enter,
    startNewGame,
    onLetter,
    onBackspace,
    shaking,
    historyOpen,
    setHistoryOpen,
    detailsOpen,
    setDetailsOpen,
    historyEntries,
    availableLangs,
    openHistory: () => setHistoryOpen(true),
    openDetails: () => setDetailsOpen(true),
  };
}

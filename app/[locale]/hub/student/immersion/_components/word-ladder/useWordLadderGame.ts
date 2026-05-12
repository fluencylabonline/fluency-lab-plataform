"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { 
  WordLadderState, 
  PlayedEntry, 
  LearnedWord,
  Difficulty
} from "@/modules/immersion/immersion.types";
import { 
  clearPersistedWordLadderState, 
  loadPersistedWordLadderState, 
  savePersistedWordLadderState, 
  WORD_LADDER_MAX_ROWS 
} from "./persistence";
import { evaluateGuess } from "../evaluateGuess";
import { 
  saveImmersionProgressAction, 
  recordImmersionResultAction 
} from "@/modules/immersion/immersion.actions";
import { getAvailableWordsAction } from "@/modules/immersion/immersion.actions";
import { useLanguages } from "@/hooks/data/use-languages";

const DEFAULT_LENGTH = 5 as const;
const MAX_PATH_LENGTH = WORD_LADDER_MAX_ROWS;

export type CellState = "correct" | "present" | "absent" | "empty";

const guessResultScore: Record<CellState, number> = {
  empty: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

function differsByOne(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff += 1;
    if (diff > 1) return false;
  }
  return diff === 1;
}

function buildPatternIndex(words: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const w of words) {
    for (let i = 0; i < w.length; i++) {
      const key = `${w.slice(0, i)}*${w.slice(i + 1)}`;
      const arr = map.get(key);
      if (arr) arr.push(w);
      else map.set(key, [w]);
    }
  }
  return map;
}

function neighbors(word: string, index: Map<string, string[]>): string[] {
  const out = new Set<string>();
  for (let i = 0; i < word.length; i++) {
    const key = `${word.slice(0, i)}*${word.slice(i + 1)}`;
    const arr = index.get(key) || [];
    for (const w of arr) {
      if (w !== word) out.add(w);
    }
  }
  return Array.from(out);
}

function shortestPath(
  start: string,
  goal: string,
  index: Map<string, string[]>,
  exclude: Set<string> = new Set()
): string[] | null {
  if (start === goal) return [start];
  const q: string[] = [start];
  const prev = new Map<string, string | null>();
  prev.set(start, null);

  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    const ns = neighbors(cur, index);
    for (const n of ns) {
      if (prev.has(n) || exclude.has(n)) continue;
      prev.set(n, cur);
      if (n === goal) {
        const path: string[] = [];
        let c: string | null = n;
        while (c) {
          path.push(c);
          c = prev.get(c) || null;
        }
        return path.reverse();
      }
      q.push(n);
    }
  }
  return null;
}

/**
 * Encontra todos os caminhos possíveis a partir de uma palavra inicial usando BFS.
 * Retorna um mapa de palavra -> caminho (array de strings).
 */
function findAllPaths(
  start: string,
  index: Map<string, string[]>,
  maxDepth: number
): Map<string, string[]> {
  const paths = new Map<string, string[]>();
  paths.set(start, [start]);

  const q: string[] = [start];
  const visited = new Set<string>([start]);

  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi];
    const curPath = paths.get(cur)!;
    
    if (curPath.length >= maxDepth) continue;

    const ns = neighbors(cur, index);
    for (const n of ns) {
      if (visited.has(n)) continue;
      visited.add(n);
      const nextPath = [...curPath, n];
      paths.set(n, nextPath);
      q.push(n);
    }
  }

  return paths;
}

const DIFFICULTY_MIN_PATH: Record<Difficulty, number> = {
  easy: 3,    // mínimo 3 passos
  medium: 5,  // mínimo 5 passos
  hard: 7,    // mínimo 7 passos
};

const DIFFICULTY_MAX_PATH: Record<Difficulty, number> = {
  easy: 4,
  medium: 6,
  hard: WORD_LADDER_MAX_ROWS, // sem teto superior no hard
};

function pickPuzzle(
  words: string[],
  index: Map<string, string[]>,
  difficulty: Difficulty = "medium"
) {
  if (words.length < 2) return null;

  const minPath = DIFFICULTY_MIN_PATH[difficulty];
  const maxPath = DIFFICULTY_MAX_PATH[difficulty];

  // Embaralha as palavras para tentar pontos de partida diferentes
  const shuffledStarts = [...words].sort(() => Math.random() - 0.5);
  
  // Tentamos alguns pontos de partida (300 é um bom equilíbrio entre performance e chances de sucesso)
  const limit = Math.min(shuffledStarts.length, 300);

  for (let i = 0; i < limit; i++) {
    const start = shuffledStarts[i];
    const allPaths = findAllPaths(start, index, maxPath);
    
    // Filtra destinos que respeitam a dificuldade
    const candidates: { goal: string; path: string[] }[] = [];
    for (const [goal, path] of allPaths.entries()) {
      if (path.length >= minPath && path.length <= maxPath) {
        candidates.push({ goal, path });
      }
    }

    if (candidates.length > 0) {
      // Se houver candidatos, pegamos o melhor (mais longo dentro da faixa)
      candidates.sort((a, b) => b.path.length - a.path.length);
      
      // Para não ser sempre o mesmo, pegamos um dos 3 melhores aleatoriamente
      const topCount = Math.min(candidates.length, 3);
      const best = candidates[Math.floor(Math.random() * topCount)];
      
      return {
        start,
        goal: best.goal,
        solution: best.path
      };
    }
  }

  // Fallback: Se não achou com a dificuldade exata, tentamos uma última vez sem o teto máximo de dificuldade 
  // (pegando o mais longo que encontrar)
  if (difficulty !== "easy") {
    for (let i = 0; i < Math.min(shuffledStarts.length, 100); i++) {
      const start = shuffledStarts[i];
      const allPaths = findAllPaths(start, index, WORD_LADDER_MAX_ROWS);
      let bestFallback: { goal: string; path: string[] } | null = null;

      for (const [goal, path] of allPaths.entries()) {
        if (path.length >= 3 && (!bestFallback || path.length > bestFallback.path.length)) {
          bestFallback = { goal, path };
        }
      }

      if (bestFallback) {
        return {
          start,
          goal: bestFallback.goal,
          solution: bestFallback.path
        };
      }
    }
  }

  return null;
}

export interface WordLadderGameProps {
  initialProgress: WordLadderState | null;
  initialAvailableWords: LearnedWord[];
  initialHistory: PlayedEntry[];
  selectedLang: string;
}

export function useWordLadderGame({
  initialProgress,
  initialAvailableWords,
  initialHistory,
  selectedLang: serverSelectedLang,
}: WordLadderGameProps) {
  const initialPersisted = useMemo(() => loadPersistedWordLadderState(), []);
  
  const baseState = useMemo(() => {
    if (!initialPersisted) return initialProgress;
    return initialPersisted;
  }, [initialPersisted, initialProgress]);

  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => baseState?.selectedLang || serverSelectedLang);
  const [availableWords, setAvailableWords] = useState<LearnedWord[]>(initialAvailableWords);
  const [historyEntries, setHistoryEntries] = useState<PlayedEntry[]>(initialHistory);
  
  const [startWord, setStartWord] = useState<string>(() => baseState?.startWord || "");
  const [goalWord, setGoalWord] = useState<string>(() => baseState?.goalWord || "");
  const [solution, setSolution] = useState<string[] | null>(() => baseState?.solution || null);
  const [steps, setSteps] = useState<string[]>(() => baseState?.steps || []);
  const [current, setCurrent] = useState(() => baseState?.current || "");
  const [finished, setFinished] = useState(() => baseState?.finished || false);
  const [learningMode, setLearningMode] = useState(() => baseState?.learningMode !== false);
  const [difficulty, setDifficultyState] = useState<Difficulty>(
    () => (baseState?.difficulty as Difficulty) || "medium"
  );
  
  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d);
    // Persistimos a preferência mesmo se não iniciar jogo novo agora
    const currentPersisted = loadPersistedWordLadderState();
    if (currentPersisted) {
      savePersistedWordLadderState({
        ...currentPersisted,
        difficulty: d,
      });
    }
  }, []);
  
  const [shaking, setShaking] = useState(false);
  const shakeTimeoutRef = useRef<number | null>(null);

  const { languages: dbLanguages } = useLanguages();

  const length = DEFAULT_LENGTH;
  const availableLangs = useMemo(() => {
    return dbLanguages.map((l) => l.code.toLowerCase());
  }, [dbLanguages]);

  const wordsOfLength = useMemo(() => {
    return availableWords.map(w => w.word.toLowerCase()).filter(w => w.length === length);
  }, [availableWords, length]);

  const patternIndex = useMemo(() => {
    if (wordsOfLength.length === 0) return new Map<string, string[]>();
    return buildPatternIndex(wordsOfLength);
  }, [wordsOfLength]);

  const availableWordSet = useMemo(() => {
    return new Set(wordsOfLength);
  }, [wordsOfLength]);

  const evaluations = useMemo(() => {
    if (!goalWord) return [] as CellState[][];
    return steps.map((w) => evaluateGuess(w, goalWord));
  }, [goalWord, steps]);

  const letterStates = useMemo<Record<string, CellState>>(() => {
    const map: Record<string, CellState> = {};
    steps.forEach((w, wi) => {
      const ev = evaluations[wi] || [];
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        const st: CellState = ev[i] ?? "absent";
        const prev: CellState | undefined = map[ch];
        if (!prev || guessResultScore[st] > guessResultScore[prev])
          map[ch] = st;
      }
    });
    return map;
  }, [evaluations, steps]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => setShaking(false), 450);
  }, []);

  const syncToServer = useCallback(async (state: WordLadderState) => {
    saveImmersionProgressAction({
      gameId: "word-ladder",
      lang: state.selectedLang,
      state,
    });
  }, []);

  const startNewGame = useCallback(
    async (lang: string) => {
      clearPersistedWordLadderState();
      setLoading(true);
      setFinished(false);
      setCurrent("");
      setSolution(null);

      const result = await getAvailableWordsAction({ lang });
      const pool = (result?.data || []) as LearnedWord[];
      setAvailableWords(pool);
      setSelectedLang(lang);

      const words = pool.map(w => w.word.toLowerCase()).filter(w => w.length === length);

      if (words.length < 2) {
        setStartWord("");
        setGoalWord("");
        setSteps([]);
        setLoading(false);
        toast.error("Poucas palavras disponíveis para este idioma");
        return;
      }

      const idx = buildPatternIndex(words);
      const puzzle = pickPuzzle(words, idx, difficulty);
      
      if (!puzzle) {
        setLoading(false);
        toast.error("Não foi possível gerar um desafio com solução", {
          description: "Seu vocabulário atual é limitado para este idioma.",
        });
        setStartWord("");
        setGoalWord("");
        setSteps([]);
        return;
      }

      const newState: WordLadderState = {
        startWord: puzzle.start,
        goalWord: puzzle.goal,
        solution: puzzle.solution,
        steps: [puzzle.start],
        current: "",
        finished: false,
        learningMode,
        selectedLang: lang,
        length,
        difficulty,
      };

      setStartWord(newState.startWord);
      setGoalWord(newState.goalWord);
      setSolution(newState.solution);
      setSteps(newState.steps);
      savePersistedWordLadderState(newState);
      syncToServer(newState);
      setLoading(false);
    },
    [length, learningMode, difficulty, syncToServer]
  );

  const undo = useCallback(() => {
    if (loading || steps.length <= 1) return;

    const nextSteps = steps.slice(0, -1);
    const lastWord = nextSteps[nextSteps.length - 1];
    // Ao desfazer, recalculamos a solução sem os passos atuais (exceto o último que virou o novo atual)
    const exclude = new Set(nextSteps.slice(0, -1));
    const nextSolution = shortestPath(lastWord, goalWord, patternIndex, exclude);

    setSteps(nextSteps);
    setSolution(nextSolution);
    setCurrent("");
    setFinished(false);

    const newState: WordLadderState = {
      startWord,
      goalWord,
      solution: nextSolution,
      steps: nextSteps,
      current: "",
      finished: false,
      learningMode,
      selectedLang,
      length,
      difficulty,
    };

    savePersistedWordLadderState(newState);
    syncToServer(newState);
  }, [loading, steps, goalWord, patternIndex, startWord, learningMode, selectedLang, syncToServer, difficulty, length]);

  const enter = useCallback(async () => {
    if (loading || finished) return;
    if (!goalWord) return;

    const normalized = current.trim().toLowerCase();
    if (normalized.length !== length) {
      if (normalized.length < length) toast.error("Palavra muito curta");
      return;
    }

    if (!availableWordSet.has(normalized)) {
      triggerShake();
      toast.error("Palavra não encontrada", {
        description: "Não está no seu vocabulário disponível",
      });
      return;
    }

    const prev = steps[steps.length - 1] || "";
    if (!differsByOne(prev, normalized)) {
      triggerShake();
      toast.error("Mude apenas 1 letra");
      return;
    }

    if (steps.includes(normalized)) {
      triggerShake();
      toast.error("Palavra já usada");
      return;
    }

    const nextSteps = [...steps, normalized];
    const isWin = normalized === goalWord;
    const isEnd = nextSteps.length >= MAX_PATH_LENGTH && !isWin;
    const isFinished = isWin || isEnd;

    // Recalculamos a solução a partir da nova palavra, excluindo o caminho já percorrido
    const exclude = new Set(nextSteps);
    const nextSolution = shortestPath(normalized, goalWord, patternIndex, exclude);

    if (!nextSolution && !isWin) {
      toast.warning("Essa palavra não leva ao objetivo!", {
        description: "Você pode desfazer o movimento para tentar outro caminho.",
        action: {
          label: "Desfazer",
          onClick: () => undo(),
        }
      });
    }

    setSteps(nextSteps);
    setFinished(isFinished);
    setSolution(nextSolution);
    setCurrent("");

    const newState: WordLadderState = {
      startWord,
      goalWord,
      solution: nextSolution,
      steps: nextSteps,
      current: "",
      finished: isFinished,
      learningMode,
      selectedLang,
      length,
      difficulty,
    };

    savePersistedWordLadderState(newState);
    syncToServer(newState);

    if (isFinished) {
      const resultEntry: PlayedEntry = {
        word: goalWord,
        ts: Date.now(),
        success: isWin,
        attempts: nextSteps.length - 1,
        lang: selectedLang,
        length,
        metadata: { steps: nextSteps }
      };

      const recordResult = await recordImmersionResultAction({
        gameId: "word-ladder",
        entry: resultEntry,
      });

      if (recordResult?.data?.success) {
        setHistoryEntries(prev => [resultEntry, ...prev]);
      }
    }
  }, [loading, finished, goalWord, current, length, availableWordSet, steps, patternIndex, startWord, learningMode, selectedLang, syncToServer, triggerShake, undo, difficulty]);

  const onLetter = useCallback(
    (ch: string) => setCurrent((p) => (p.length >= length ? p : p + ch)),
    [length]
  );

  const onBackspace = useCallback(() => setCurrent((p) => p.slice(0, -1)), []);

  const hint = useCallback(() => {
    if (loading || finished) return;
    if (!solution || solution.length <= 1) {
      toast.error("Não há caminho disponível até o objetivo");
      return;
    }
    const next = solution[1]; 
    if (!next) return;
    setCurrent(next);
    toast.message("Dica aplicada");
  }, [finished, loading, solution]);

  const revealSolution = useCallback(() => {
    if (!solution) return;
    
    // Garantimos que não haja duplicatas ao revelar
    const used = new Set(steps);
    const cleanSolution = solution.filter(w => !used.has(w));
    const fullPath = [...steps, ...cleanSolution];
    setSteps(fullPath);
    setCurrent("");
    setFinished(true);
    
    const newState: WordLadderState = {
      startWord,
      goalWord,
      solution,
      steps: fullPath,
      current: "",
      finished: true,
      learningMode,
      selectedLang,
      length,
      difficulty,
    };
    savePersistedWordLadderState(newState);
    syncToServer(newState);
  }, [goalWord, learningMode, selectedLang, solution, startWord, steps, syncToServer, difficulty, length]);

  useEffect(() => {
    if (!startWord && availableWords.length > 0) {
      const timer = setTimeout(() => {
        startNewGame(selectedLang);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [availableWords.length, startWord, startNewGame, selectedLang]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading || finished) return;
      if (e.key === "Enter") return enter();
      if (e.key === "Backspace") return onBackspace();
      const ch = e.key.toLowerCase();
      if (ch.length === 1 && ch >= "a" && ch <= "z") onLetter(ch);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enter, finished, loading, onBackspace, onLetter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  const status = useMemo(() => {
    if (loading) return "loading";
    if (!startWord || !goalWord) return "empty";
    if (!finished) return "playing";
    const won = steps[steps.length - 1] === goalWord;
    return won ? "win" : "end";
  }, [finished, goalWord, loading, startWord, steps]);

  const learningWord = steps[steps.length - 1] || "";

  return {
    loading,
    status,
    selectedLang,
    setSelectedLang,
    langOptions: availableLangs,
    length,
    startWord,
    goalWord,
    steps,
    current,
    setCurrent,
    evaluations,
    letterStates,
    enter,
    onLetter,
    onBackspace,
    startNewGame,
    hint,
    revealSolution,
    hasSolution: !!solution && solution.length > 1,
    learningMode,
    setLearningMode,
    difficulty,
    setDifficulty,
    learningWord,
    shaking,
    historyEntries,
    undo,
    canUndo: steps.length > 1,
  };
}

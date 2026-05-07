"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  clearPersistedLyricsTrainingState,
  loadPersistedLyricsTrainingState,
  savePersistedLyricsTrainingState,
} from "./persistence";
import { getStudentLanguages } from "../Database";
import { evaluateGuess } from "../wordle/evaluateGuess";

type LrcLine = { ms: number; text: string };
interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

type YTPlayer = {
  getCurrentTime: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (v: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
};

function getYouTubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!host.includes("youtube.com") && host !== "youtu.be") return null;
    const re = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const m = url.match(re);
    const id = m && m[1]?.length === 11 ? m[1] : null;
    return id || null;
  } catch {
    return null;
  }
}

function parseLrc(lrc: string): LrcLine[] {
  const lines = lrc.split(/\r?\n/);
  const out: LrcLine[] = [];
  for (const line of lines) {
    const m = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/);
    if (!m) continue;
    const ms =
      parseInt(m[1], 10) * 60000 +
      parseInt(m[2], 10) * 1000 +
      (m[3] ? parseInt(m[3], 10) : 0) * 10;
    const text = m[4].trim();
    if (text) out.push({ ms, text });
  }
  return out.sort((a, b) => a.ms - b.ms);
}

async function fetchLrcData(
  track: string,
  artist: string
): Promise<string | null> {
  try {
    const q = new URLSearchParams({ track_name: track, artist_name: artist });
    const r = await fetch(`https://lrclib.net/api/search?${q.toString()}`);
    if (!r.ok) return null;
    const arr: unknown[] = await r.json();
    if (!Array.isArray(arr)) return null;
    const item = arr.find((x): x is { syncedLyrics: string } => {
      if (!x || typeof x !== "object") return false;
      const candidate = x as Record<string, unknown>;
      return (
        typeof candidate.syncedLyrics === "string" &&
        candidate.syncedLyrics.length > 0
      );
    });
    return item ? item.syncedLyrics : null;
  } catch {
    return null;
  }
}

function normalizeWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function chooseAutoGapIndex(text: string): number {
  const words = text.split(" ");
  if (words.length === 0) return -1;

  let maxLen = 0;
  let maxIdx = -1;

  words.forEach((w, i) => {
    const clean = w.replace(/[^\p{L}\p{N}']/gu, "");
    if (clean.length > 2 && clean.length > maxLen) {
      maxLen = clean.length;
      maxIdx = i;
    }
  });

  if (maxIdx === -1 && words.length > 0) return 0;
  return maxIdx;
}

function getGapForLine(lineText: string): {
  blankWord: string | null;
  gapIndex: number;
} {
  const idx = chooseAutoGapIndex(lineText);
  if (idx < 0) return { blankWord: null, gapIndex: -1 };
  const words = lineText.split(" ");
  const w = words[idx]?.replace(/[^\p{L}\p{N}']/gu, "") ?? "";
  if (!w) return { blankWord: null, gapIndex: -1 };
  return { blankWord: w, gapIndex: idx };
}

function ensureYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as {
    YT?: { Player: new (elementId: string | HTMLElement, options: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
    __ytIframeApiPromise?: Promise<void>;
  };
  if (w.YT?.Player) return Promise.resolve();

  if (w.__ytIframeApiPromise) return w.__ytIframeApiPromise as Promise<void>;

  w.__ytIframeApiPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve();
    };
  });

  return w.__ytIframeApiPromise as Promise<void>;
}

import { 
  saveImmersionProgressAction, 
  recordImmersionResultAction 
} from "@/modules/immersion/immersion.actions";
import { LyricsTrainingState, CellState } from "@/modules/immersion/immersion.types";

interface LyricsTrainingProps {
  initialProgress: LyricsTrainingState | null;
}

export function useLyricsTrainingGame({ initialProgress }: LyricsTrainingProps) {
  // Persistence logic: LocalStorage vs Server
  const initialPersisted = useMemo(() => loadPersistedLyricsTrainingState(), []);

  // Decide which state to use as base
  const baseState = useMemo(() => {
    if (!initialPersisted) return initialProgress;
    return initialPersisted;
  }, [initialPersisted, initialProgress]);

  const [loading] = useState(false);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState(baseState?.selectedLang || "en");

  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState(baseState?.videoUrl || "");
  const [track, setTrack] = useState(baseState?.track || "");
  const [artist, setArtist] = useState(baseState?.artist || "");
  const [pauseEvery, setPauseEvery] = useState<1 | 2>(baseState?.pauseEvery || 1);

  const [lrc, setLrc] = useState(baseState?.lrc || "");
  const [synced, setSynced] = useState<LrcLine[]>(() => baseState?.lrc ? parseLrc(baseState.lrc) : []);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  const [started, setStarted] = useState(!!baseState?.videoUrl && !!baseState?.lrc);
  const [finished, setFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(baseState?.currentIndex || 0);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [blankWord, setBlankWord] = useState<string | null>(null);
  const [gapIndex, setGapIndex] = useState<number>(-1);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [score, setScore] = useState(baseState?.score || 0);
  const [streak, setStreak] = useState(baseState?.streak || 0);
  const [hintLevel, setHintLevel] = useState(0);
  const [guessEvaluation, setGuessEvaluation] = useState<CellState[] | null>(
    null
  );
  const [submittedGuess, setSubmittedGuess] = useState("");
  const [awaitingNext, setAwaitingNext] = useState(false);

  const [playerHostEl, setPlayerHostEl] = useState<HTMLDivElement | null>(null);
  const playerContainerRef = useCallback((node: HTMLDivElement | null) => {
    setPlayerHostEl(node);
  }, []);
  const playerRef = useRef<YTPlayer | null>(null);
  const reqAnimRef = useRef<number | null>(null);
  const replayUntilMsRef = useRef<number | null>(null);
  const replayRestoreInputRef = useRef(false);
  const pauseLockIndexRef = useRef<number | null>(null);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const syncToServer = useCallback(async (state: LyricsTrainingState) => {
    saveImmersionProgressAction({
      gameId: "lyrics-training",
      lang: state.selectedLang,
      state: {
        selectedLang: state.selectedLang,
        videoUrl: state.videoUrl,
        track: state.track,
        artist: state.artist,
        lrc: state.lrc,
        pauseEvery: state.pauseEvery,
        currentIndex: state.currentIndex,
        score: state.score,
        streak: state.streak,
      },
    });
  }, []);

  const stateRef = useRef({
    currentIndex,
    waitingInput,
    blankWord,
    synced,
    pauseEvery,
  });

  useEffect(() => {
    stateRef.current = {
      currentIndex,
      waitingInput,
      blankWord,
      synced,
      pauseEvery,
    };
  }, [blankWord, currentIndex, pauseEvery, synced, waitingInput]);

  const videoId = useMemo(
    () => (videoUrl ? getYouTubeIdFromUrl(videoUrl) : null),
    [videoUrl]
  );

  useEffect(() => {
    if (!videoId) return;
    if (!playerHostEl) return;
    let cancelled = false;

    const init = async () => {
      await ensureYouTubeIframeApi();
      if (cancelled) return;
      const w = window as unknown as { YT?: { Player: new (elementId: string | HTMLElement, options: unknown) => YTPlayer } };
      if (!w.YT?.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }

      playerHostEl.innerHTML = "";

      const onReady = (event: { target: YTPlayer }) => {
        playerRef.current = event.target;
        setIsPlayerReady(true);
        try {
          event.target.setVolume(100);
        } catch {}
      };

      const onStateChange = (event: { data: number }) => {
        setIsPlaying(event.data === 1);
      };

      new w.YT.Player(playerHostEl, {
        videoId,
        playerVars: {
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: { onReady, onStateChange },
      });
    };

    setIsPlayerReady(false);
    setIsPlaying(false);
    init();

    return () => {
      cancelled = true;
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [playerHostEl, videoId]);

  const safePlayerCall = useCallback((fn: (p: YTPlayer) => void) => {
    const p = playerRef.current;
    if (!p) return;
    if (typeof p.playVideo !== "function") return;
    fn(p);
  }, []);

  const togglePlay = useCallback(() => {
    safePlayerCall((p) => {
      if (isPlaying) p.pauseVideo();
      else p.playVideo();
    });
  }, [isPlaying, safePlayerCall]);

  const replayLine = useCallback(() => {
    const line = synced[currentIndex];
    if (!line) return;
    const nextMs = synced[currentIndex + 1]?.ms ?? line.ms + 3000;
    replayUntilMsRef.current = Math.max(line.ms, nextMs - 50);
    replayRestoreInputRef.current =
      !!stateRef.current.blankWord || stateRef.current.waitingInput;
    setWaitingInput(false);
    const startSeconds = line.ms / 1000;
    safePlayerCall((p) => {
      p.seekTo(startSeconds, true);
      setTimeout(() => p.playVideo(), 50);
    });
  }, [currentIndex, safePlayerCall, synced]);

  const computeGapForIndex = useCallback(
    (idx: number) => {
      const line = synced[idx];
      if (!line) {
        setBlankWord(null);
        setGapIndex(-1);
        return;
      }
      const g = getGapForLine(line.text);
      setBlankWord(g.blankWord);
      setGapIndex(g.gapIndex);
    },
    [synced]
  );

  const startLoop = useCallback(() => {
    const loop = () => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === "function") {
        const { currentIndex, waitingInput, blankWord, synced, pauseEvery } =
          stateRef.current;

        const currentTimeMs = p.getCurrentTime() * 1000;

        const replayUntilMs = replayUntilMsRef.current;
        if (replayUntilMs !== null && currentTimeMs >= replayUntilMs) {
          replayUntilMsRef.current = null;
          p.pauseVideo();
          if (replayRestoreInputRef.current) setWaitingInput(true);
          replayRestoreInputRef.current = false;
        }

        if (waitingInput || !blankWord) {
          pauseLockIndexRef.current = null;
        }

        if (!waitingInput && !blankWord) {
          const nextIdx = currentIndex + 1;
          if (nextIdx < synced.length) {
            if (currentTimeMs >= synced[nextIdx].ms) {
              setCurrentIndex(nextIdx);
              computeGapForIndex(nextIdx);
              setInputValue("");
              setGuessEvaluation(null);
              setSubmittedGuess("");
              setAwaitingNext(false);
              setHintLevel(0);
            }
          } else {
            const lastMs = synced[synced.length - 1]?.ms ?? 0;
            if (synced.length && currentTimeMs > lastMs + 2500) {
              queueMicrotask(() => setFinished(true));
            }
          }
        }

        if (blankWord && !waitingInput) {
          const nextMs =
            synced[currentIndex + 1]?.ms ?? synced[currentIndex].ms + 3000;
          const shouldPause = (currentIndex + 1) % pauseEvery === 0;
          if (shouldPause && currentTimeMs >= nextMs - 200) {
            if (pauseLockIndexRef.current !== currentIndex) {
              pauseLockIndexRef.current = currentIndex;
              p.pauseVideo();
              setWaitingInput(true);
            }
          }
        }
      }

      reqAnimRef.current = requestAnimationFrame(loop);
    };

    if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    reqAnimRef.current = requestAnimationFrame(loop);
  }, [computeGapForIndex]);

  const startGame = useCallback(
    (resumeIndex?: number, preserveProgress?: boolean) => {
      if (!synced.length) return;
      if (!isPlayerReady) {
        toast.error("O player ainda está carregando...");
        return;
      }
      pauseLockIndexRef.current = null;
      replayUntilMsRef.current = null;
      replayRestoreInputRef.current = false;
      setFinished(false);
      setStarted(true);
      if (!preserveProgress) {
        setScore(0);
        setStreak(0);
      }
      setWaitingInput(false);
      setFeedback(null);
      setGuessEvaluation(null);
      setSubmittedGuess("");
      setAwaitingNext(false);
      const idx =
        typeof resumeIndex === "number" ? Math.max(0, resumeIndex) : 0;
      setCurrentIndex(idx);
      computeGapForIndex(idx);
      setInputValue("");
      setHintLevel(0);

      const startSeconds = (synced[idx]?.ms ?? 0) / 1000;
      safePlayerCall((p) => {
        p.seekTo(startSeconds, true);
        p.playVideo();
      });
      startLoop();
    },
    [computeGapForIndex, isPlayerReady, safePlayerCall, startLoop, synced]
  );

  const stopPlayback = useCallback(() => {
    if (reqAnimRef.current) {
      cancelAnimationFrame(reqAnimRef.current);
      reqAnimRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch {}
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
    if (playerHostEl) playerHostEl.innerHTML = "";
    setIsPlaying(false);
    setIsPlayerReady(false);
  }, [playerHostEl]);

  const resetSong = useCallback(() => {
    clearPersistedLyricsTrainingState();
    setStarted(false);
    setFinished(false);
    setCurrentIndex(0);
    setWaitingInput(false);
    setInputValue("");
    setBlankWord(null);
    setGapIndex(-1);
    setFeedback(null);
    setGuessEvaluation(null);
    setSubmittedGuess("");
    setAwaitingNext(false);
    setScore(0);
    setStreak(0);
    setHintLevel(0);
  }, []);

  const chooseAnotherSong = useCallback(() => {
    stopPlayback();
    clearPersistedLyricsTrainingState();
    setStarted(false);
    setFinished(false);
    setWaitingInput(false);
    setInputValue("");
    setBlankWord(null);
    setGapIndex(-1);
    setFeedback(null);
    setGuessEvaluation(null);
    setSubmittedGuess("");
    setAwaitingNext(false);
    setScore(0);
    setStreak(0);
    setHintLevel(0);
    setCurrentIndex(0);
    setVideoUrl("");
    setTrack("");
    setArtist("");
    setLrc("");
    setSynced([]);
  }, [stopPlayback]);

  const submitAnswer = useCallback(() => {
    if (!blankWord) return;
    const v = normalizeWord(inputValue);
    const b = normalizeWord(blankWord);
    if (!v || !b) return;
    if (v.length !== b.length) return;
    const ev = evaluateGuess(v, b);
    if (v && b && v === b) {
      setFeedback("correct");
      setGuessEvaluation(ev);
      setSubmittedGuess(v);
      setAwaitingNext(true);
      const pts = 100 + streak * 10 - hintLevel * 25;
      setScore((s) => s + Math.max(10, pts));
      setStreak((s) => s + 1);
      setWaitingInput(false);
      setBlankWord(null);
      setGapIndex(-1);
      setTimeout(() => setFeedback(null), 900);
    } else {
      setFeedback("incorrect");
      setGuessEvaluation(ev);
      setSubmittedGuess(v);
      setStreak(0);
      setTimeout(() => setFeedback(null), 900);
    }
  }, [blankWord, hintLevel, inputValue, streak]);

  const continueAfterCorrect = useCallback(() => {
    if (!awaitingNext) return;
    setAwaitingNext(false);
    setGuessEvaluation(null);
    setSubmittedGuess("");
    setInputValue("");
    safePlayerCall((p) => p.playVideo());
  }, [awaitingNext, safePlayerCall]);

  useEffect(() => {
    if (!guessEvaluation) return;
    const v = normalizeWord(inputValue);
    if (v !== submittedGuess) {
      setGuessEvaluation(null);
      setSubmittedGuess("");
      setAwaitingNext(false);
    }
  }, [awaitingNext, guessEvaluation, inputValue, submittedGuess]);

  const keyboardLetterStates = useMemo(() => {
    const map: Record<
      string,
      "correct" | "present" | "absent" | "empty" | "unknown"
    > = {};
    if (!guessEvaluation || !submittedGuess) return map;

    const guessResultScore: Record<CellState, number> = {
      empty: 0,
      absent: 1,
      present: 2,
      correct: 3,
    };

    for (let i = 0; i < submittedGuess.length; i++) {
      const ch = submittedGuess[i];
      const st = (guessEvaluation[i] ?? "absent") as CellState;
      const prev = map[ch] as CellState | "unknown" | undefined;
      if (
        !prev ||
        prev === "unknown" ||
        guessResultScore[st] > guessResultScore[prev]
      )
        map[ch] = st;
    }

    return map;
  }, [guessEvaluation, submittedGuess]);

  const hint = useCallback(() => {
    if (!blankWord) return;
    setHintLevel((h) => Math.min(2, h + 1));
  }, [blankWord]);

  const placeholder = useMemo(() => {
    if (!blankWord) return "";
    if (hintLevel === 0) return "Digite a resposta...";
    if (hintLevel === 1) return blankWord.replace(/./g, "_ ");
    if (blankWord.length <= 2) return blankWord;
    return (
      blankWord[0] +
      blankWord.slice(1, -1).replace(/./g, "_ ") +
      blankWord.slice(-1)
    );
  }, [blankWord, hintLevel]);

  const maskedLine = useMemo(() => {
    const line = synced[currentIndex]?.text ?? "";
    if (!line) return { before: "", blank: "", after: "" };
    if (!blankWord || gapIndex < 0)
      return { before: line, blank: "", after: "" };
    const parts = line.split(" ");
    const before = parts.slice(0, gapIndex).join(" ");
    const after = parts.slice(gapIndex + 1).join(" ");
    return { before, blank: parts[gapIndex] ?? "", after };
  }, [blankWord, currentIndex, gapIndex, synced]);

  const searchYouTube = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    try {
      setSearchError(null);
      const r = await fetch(
        `/api/editor/youtube-search?q=${encodeURIComponent(q)}&maxResults=6`
      );
      const data = await r.json();
      if (!r.ok) {
        setSearchError("Erro ao buscar.");
        setResults([]);
        return;
      }
      const items = Array.isArray(data?.items) ? data.items : [];
      setResults(items);
    } catch {
      setSearchError("Falha na conexão.");
    } finally {
      setSearching(false);
    }
  }, [search]);

  const chooseVideo = useCallback((item: YouTubeVideo) => {
    const url = `https://www.youtube.com/watch?v=${item.videoId}`;
    setVideoUrl(url);
    const parts = String(item.title || "")
      .split("-")
      .map((s: string) => s.trim());
    if (parts.length >= 2) {
      setArtist(parts[0] || String(item.channelTitle || ""));
      setTrack(parts.slice(1).join(" - "));
    } else {
      setTrack(String(item.title || ""));
      setArtist(String(item.channelTitle || ""));
    }
  }, []);

  const loadLyrics = useCallback(async () => {
    if (!videoUrl || !track || !artist) return;
    setLoadingLyrics(true);
    try {
      const data = await fetchLrcData(track, artist);
      if (!data) {
        toast.error("Não conseguimos encontrar a letra sincronizada.");
        setLrc("");
        setSynced([]);
        return;
      }
      setLrc(data);
      const lines = parseLrc(data);
      setSynced(lines);
      resetSong();
    } finally {
      setLoadingLyrics(false);
    }
  }, [artist, resetSong, track, videoUrl]);

  const status = useMemo(() => {
    if (loading) return "loading" as const;
    if (!videoUrl) return "setup" as const;
    if (!synced.length) return "setup" as const;
    if (finished) return "finished" as const;
    if (started) return "playing" as const;
    return "ready" as const;
  }, [finished, loading, started, synced.length, videoUrl]);

  const langOptions = useMemo(
    () => (availableLangs.length ? availableLangs : ["en"]),
    [availableLangs]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const langs = await getStudentLanguages();
      if (!mounted) return;
      const normalized = langs.map((l) => l.toLowerCase());
      setAvailableLangs(normalized);
      if (!baseState) {
        setSelectedLang(normalized[0] || "en");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [baseState]);

  useEffect(() => {
    if (!started || !synced.length) return;
    const state = {
      selectedLang,
      videoUrl,
      track,
      artist,
      lrc,
      pauseEvery,
      currentIndex,
      score,
      streak,
    };
    savePersistedLyricsTrainingState(state);
    syncToServer(state);
  }, [
    artist,
    currentIndex,
    lrc,
    pauseEvery,
    score,
    selectedLang,
    started,
    streak,
    synced.length,
    track,
    videoUrl,
    syncToServer,
  ]);

  useEffect(() => {

    if (status === "finished") {
      recordImmersionResultAction({
        gameId: "lyrics-training",
        entry: {
          lang: selectedLang,
          word: track || "unknown",
          success: true,
          attempts: score,
          ts: Date.now(),
          length: synced.length,
          metadata: {
            artist,
            streak,
            videoUrl,
          },
        },
      });
    }
  }, [status, selectedLang, track, score, artist, streak, synced.length, videoUrl]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!waitingInput) return;
      if (isPlaying) return;
      const target = e.target as unknown;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
        return;

      const maxLetters = blankWord ? normalizeWord(blankWord).length : 0;
      if (!maxLetters) return;

      if (e.key === "Enter") {
        e.preventDefault();
        return submitAnswer();
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        setInputValue((p) => p.slice(0, -1));
        return;
      }

      if (e.key.length !== 1) return;
      if (!/^[\p{L}\p{N}]$/u.test(e.key)) return;

      e.preventDefault();
      setInputValue((prev) => {
        const used = normalizeWord(prev).length;
        if (used >= maxLetters) return prev;
        return prev + e.key;
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [blankWord, isPlaying, submitAnswer, waitingInput]);

  return {
    loading,
    status,
    selectedLang,
    setSelectedLang,
    langOptions,
    search,
    setSearch,
    searching,
    results,
    searchError,
    searchYouTube,
    chooseVideo,
    videoUrl,
    setVideoUrl,
    track,
    setTrack,
    artist,
    setArtist,
    pauseEvery,
    setPauseEvery,
    loadingLyrics,
    loadLyrics,
    playerContainerRef,
    isPlayerReady,
    isPlaying,
    togglePlay,
    replayLine,
    started,
    finished,
    startGame,
    resetSong,
    chooseAnotherSong,
    currentIndex,
    waitingInput,
    inputValue,
    setInputValue,
    blankWord,
    placeholder,
    submitAnswer,
    hint,
    feedback,
    guessEvaluation,
    keyboardLetterStates,
    awaitingNext,
    continueAfterCorrect,
    score,
    streak,
    maskedLine,
  };
}

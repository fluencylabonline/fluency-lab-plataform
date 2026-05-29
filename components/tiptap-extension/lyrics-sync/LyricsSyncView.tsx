"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ref, onValue, set, off, DataSnapshot } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { toast } from "sonner";
import { 
  Search, 
  Video, 
  Loader2, 
  AlertCircle, 
  Music, 
  Globe2 
} from "lucide-react";
import { useTranslations } from "next-intl";

import { TeacherLyricsView } from "./TeacherLyricsView";
import { StudentLyricsView } from "./StudentLyricsView";
import type { LyricsSyncNodeAttributes } from "./LyricsSyncNode";
import type { YouTubeVideo } from "@/modules/media/media.service";
import type { CellState } from "@/modules/immersion/immersion.types";
import { evaluateGuess } from "@/app/[locale]/hub/student/immersion/_components/evaluateGuess";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface LyricsSyncState {
  videoUrl: string;
  track: string;
  artist: string;
  lrc: string;
  pauseEvery: 1 | 2;

  playing: boolean;
  currentTime: number;
  playbackRate: number;

  currentIndex: number;
  waitingInput: boolean;
  blankWord: string | null;
  gapIndex: number;
  studentInput: string;
  score: number;
  streak: number;
  finished: boolean;

  lastUpdatedBy: string;
  updatedAt: number;
}

interface LrcLine {
  ms: number;
  text: string;
}

interface YouTubePlayerInstance {
  getCurrentTime: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (time: number, allowSeek: boolean) => void;
  destroy: () => void;
  setVolume: (vol: number) => void;
  getVolume: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
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

function normalizeWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

// Selects the longest word (> 2 letters) in the sentence to hide.
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

// YouTube Player API Async Loader
let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiLoaded) return resolve();
    ytApiCallbacks.push(resolve);
    if (ytApiLoading) return;
    ytApiLoading = true;

    (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiCallbacks.forEach((cb) => cb());
      ytApiCallbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
}

// Fetch synced LRC lyrics from LrcLib
async function fetchLrcData(track: string, artist: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ track_name: track, artist_name: artist });
    const r = await fetch(`https://lrclib.net/api/search?${q.toString()}`);
    if (!r.ok) return null;
    const arr = (await r.json()) as Array<{ syncedLyrics?: string }>;
    if (!Array.isArray(arr)) return null;
    const item = arr.find((x) => typeof x.syncedLyrics === "string" && x.syncedLyrics.length > 0);
    return item ? (item.syncedLyrics as string) : null;
  } catch {
    return null;
  }
}

// ─── Component View ───────────────────────────────────────────────────────────

const SYNC_TOLERANCE_SEC = 2;

export function LyricsSyncView({ node, updateAttributes, selected }: NodeViewProps) {
  const { nodeId, videoUrl, track, artist, lrc, pauseEvery } = node.attrs as LyricsSyncNodeAttributes;

  const userRole = (globalThis as Record<string, unknown>).__userRole as string ?? "student";
  const myUserId = (globalThis as Record<string, unknown>).__userId as string ?? "anonymous";
  const t = useTranslations("LyricsSync");

  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  
  // Real-time synchronization lock refs
  const isSyncingRef = useRef(false);
  const playLoopRef = useRef<number | null>(null);
  // Grace period after a programmatic seek — suppress auto-pause for N ms
  const seekGraceUntilRef = useRef<number>(0);
  const studentSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // General setups states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playerHostEl, setPlayerHostEl] = useState<HTMLDivElement | null>(null);
  const playerContainerRef = useCallback((node: HTMLDivElement | null) => {
    setPlayerHostEl(node);
  }, []);

  // Setup song editor states (only used by Teacher during setup)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLrcInput] = useState(lrc ?? "");
  const [trackInput, setTrackInput] = useState(track ?? "");
  const [artistInput, setArtistInput] = useState(artist ?? "");
  const [pauseEveryInput, setPauseEveryInput] = useState<1 | 2>(pauseEvery ?? 1);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [setupVideoUrl, setSetupVideoUrl] = useState(videoUrl ?? "");

  // Game Logic States
  const syncedLines = useMemo(() => (lrc ? parseLrc(lrc) : []), [lrc]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [blankWord, setBlankWord] = useState<string | null>(null);
  const [gapIndex, setGapIndex] = useState<number>(-1);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [guessEvaluation, setGuessEvaluation] = useState<CellState[] | null>(null);
  const [submittedGuess, setSubmittedGuess] = useState("");
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Real-time synchronizer state received from RTDB
  const [syncState, setSyncState] = useState<LyricsSyncState | null>(null);

  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;

  // ── Stable Refs (never change identity, always up-to-date) ───────────────────

  // Tracks node-level attrs so publishState never needs React closure deps
  const nodeAttrsRef = useRef({ videoUrl, track, artist, lrc, pauseEvery, nodeId, myUserId, syncedLines });
  useEffect(() => {
    nodeAttrsRef.current = { videoUrl, track, artist, lrc, pauseEvery, nodeId, myUserId, syncedLines };
  }, [videoUrl, track, artist, lrc, pauseEvery, nodeId, myUserId, syncedLines]);

  // State refs to bypass stale React closures in requestAnimationFrame loops
  const stateRef = useRef({
    currentIndex,
    waitingInput,
    blankWord,
    gapIndex,
    syncedLines,
    pauseEvery,
    isPlaying,
    speed,
    score,
    streak,
    inputValue,
    awaitingNext,
  });

  useEffect(() => {
    stateRef.current = {
      currentIndex,
      waitingInput,
      blankWord,
      gapIndex,
      syncedLines,
      pauseEvery,
      isPlaying,
      speed,
      score,
      streak,
      inputValue,
      awaitingNext,
    };
  }, [currentIndex, waitingInput, blankWord, gapIndex, syncedLines, pauseEvery, isPlaying, speed, score, streak, inputValue, awaitingNext]);

  // ── Firebase Realtime DB Publisher ──────────────────────────────────────────
  // Reads exclusively from refs — never recreates, never causes cascade re-renders

  const publishState = useCallback(
    (customState: Partial<LyricsSyncState>) => {
      const attrs = nodeAttrsRef.current;
      if (!attrs.nodeId) return;

      const s = stateRef.current;
      const player = playerRef.current;
      const currentTime = player ? (player.getCurrentTime?.() ?? 0) : 0;

      const fullState: LyricsSyncState = {
        videoUrl: attrs.videoUrl ?? "",
        track: attrs.track ?? "",
        artist: attrs.artist ?? "",
        lrc: attrs.lrc ?? "",
        pauseEvery: attrs.pauseEvery ?? 1,
        playing: s.isPlaying,
        currentTime,
        playbackRate: s.speed,
        currentIndex: s.currentIndex,
        waitingInput: s.waitingInput,
        blankWord: s.blankWord,
        gapIndex: s.gapIndex,
        studentInput: s.inputValue,
        score: s.score,
        streak: s.streak,
        finished: s.currentIndex >= attrs.syncedLines.length && attrs.syncedLines.length > 0,
        lastUpdatedBy: attrs.myUserId,
        updatedAt: Date.now(),
        ...customState,
      };

      set(ref(rtdb, `lyrics-sync/${attrs.nodeId}`), fullState).catch(console.error);
    },
    [] // Intentionally empty — reads live data from refs only
  );

  // Throttle typing synchronization to student monitor so we do not overload Firebase
  const publishTypingState = useCallback((val: string) => {
    if (studentSyncTimerRef.current) clearTimeout(studentSyncTimerRef.current);
    studentSyncTimerRef.current = setTimeout(() => {
      publishState({ studentInput: val });
    }, 100);
  }, [publishState]);

  useEffect(() => {
    if (userRole === "student" && stateRef.current.waitingInput) {
      publishTypingState(inputValue);
    }
  }, [inputValue, userRole, publishTypingState]);

  // ── YouTube Player Lifecycle ────────────────────────────────────────────────

  useEffect(() => {
    if (!videoId) return;
    if (!playerHostEl) return;

    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed) return;

      const w = window as unknown as {
        YT: {
          Player: new (
            el: HTMLElement,
            options: {
              videoId: string;
              playerVars: Record<string, unknown>;
              events: {
                onReady: () => void;
                onStateChange: (event: { data: number }) => void;
                onError: () => void;
              };
            }
          ) => YouTubePlayerInstance;
          PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
        };
      };

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
        setIsPlayerReady(false);
      }

      playerRef.current = new w.YT.Player(playerHostEl, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setIsPlayerReady(true);
            playerRef.current?.setVolume(100);
            playerRef.current?.setPlaybackRate(speed);
          },
          onStateChange: (event) => {
            if (destroyed || isSyncingRef.current) return;
            const YT = w.YT.PlayerState;
            const time = playerRef.current?.getCurrentTime() ?? 0;
            if (event.data === YT.PLAYING) {
              setIsPlaying(true);
              publishState({ playing: true, currentTime: time });
            } else if (event.data === YT.PAUSED || event.data === YT.ENDED) {
              setIsPlaying(false);
              publishState({ playing: false, currentTime: time });
            }
          },
          onError: () => {
            if (!destroyed) setError(t("setup.videoLoadError") || "Não foi possível carregar o vídeo.");
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (playLoopRef.current) cancelAnimationFrame(playLoopRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      setIsPlayerReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, playerHostEl]);

  // ── Lyrics Time-Syncer loop (requestAnimationFrame) ──────────────────────────

  const startTimelineLoop = useCallback(() => {
    const loop = () => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === "function") {
        const { currentIndex, waitingInput, blankWord, syncedLines, pauseEvery } = stateRef.current;
        const currentTimeMs = p.getCurrentTime() * 1000;

        // Automatic lyric progression when we are not waiting for input and no gap
        if (!waitingInput && !blankWord) {
          const nextIdx = currentIndex + 1;
          if (nextIdx < syncedLines.length) {
            if (currentTimeMs >= syncedLines[nextIdx].ms) {
              const g = getGapForLine(syncedLines[nextIdx].text);
              // Update stateRef immediately so next tick reads correctly
              stateRef.current = {
                ...stateRef.current,
                currentIndex: nextIdx,
                blankWord: g.blankWord,
                gapIndex: g.gapIndex,
                inputValue: "",
                awaitingNext: false,
              };
              setCurrentIndex(nextIdx);
              setBlankWord(g.blankWord);
              setGapIndex(g.gapIndex);
              setInputValue("");
              setGuessEvaluation(null);
              setSubmittedGuess("");
              setAwaitingNext(false);
              publishState({
                currentIndex: nextIdx,
                blankWord: g.blankWord,
                gapIndex: g.gapIndex,
                studentInput: "",
                waitingInput: false,
              });
            }
          } else {
            const lastMs = syncedLines[syncedLines.length - 1]?.ms ?? 0;
            if (syncedLines.length && currentTimeMs > lastMs + 2000) {
              publishState({ finished: true });
            }
          }
        }

        // Automatic pausing at specific line milestones for typing exercises
        // Guard: skip if inside the grace window after a programmatic seek
        const inGrace = Date.now() < seekGraceUntilRef.current;
        if (blankWord && !waitingInput && !inGrace) {
          const nextMs = syncedLines[currentIndex + 1]?.ms ?? (syncedLines[currentIndex]?.ms ?? 0) + 3000;
          const shouldPause = (currentIndex + 1) % pauseEvery === 0;
          if (shouldPause && currentTimeMs >= nextMs - 150) {
            // Arm grace for the next seek so we don't double-fire
            seekGraceUntilRef.current = Date.now() + 500;
            p.pauseVideo();
            // Update stateRef immediately to prevent double-fire on next tick
            stateRef.current = { ...stateRef.current, isPlaying: false, waitingInput: true };
            setIsPlaying(false);
            setWaitingInput(true);
            publishState({ playing: false, waitingInput: true });
          }
        }
      }
      playLoopRef.current = requestAnimationFrame(loop);
    };

    if (playLoopRef.current) cancelAnimationFrame(playLoopRef.current);
    playLoopRef.current = requestAnimationFrame(loop);
  }, [publishState]); // publishState is stable (empty deps) — loop never restarts during gameplay

  useEffect(() => {
    if (isPlayerReady && syncedLines.length > 0) {
      startTimelineLoop();
    }
    return () => {
      if (playLoopRef.current) cancelAnimationFrame(playLoopRef.current);
    };
  }, [isPlayerReady, syncedLines.length, startTimelineLoop]);

  // ── RTDB Subscription (Receive State Changes) ───────────────────────────────

  useEffect(() => {
    if (!nodeId) return;

    const syncRef = ref(rtdb, `lyrics-sync/${nodeId}`);

    const handleSnapshot = (snapshot: DataSnapshot) => {
      const state: LyricsSyncState | null = snapshot.val();
      if (!state) return;

      setSyncState(state);

      if (state.lastUpdatedBy === myUserId) return;

      // Lock synchronization loop to prevent recursive cycles
      isSyncingRef.current = true;

      const player = playerRef.current;

      try {
        if (player) {
          const currentTime = player.getCurrentTime?.() ?? 0;
          const timeDiff = Math.abs(currentTime - state.currentTime);

          if (timeDiff > SYNC_TOLERANCE_SEC) {
            player.seekTo?.(state.currentTime, true);
          }

          if (state.playing) {
            player.playVideo?.();
            setIsPlaying(true);
          } else {
            player.pauseVideo?.();
            setIsPlaying(false);
          }

          // Speed synchronization
          if (state.playbackRate !== undefined && player.setPlaybackRate && player.getPlaybackRate) {
            const currentRate = player.getPlaybackRate();
            if (Math.abs(currentRate - state.playbackRate) > 0.01) {
              player.setPlaybackRate(state.playbackRate);
              setSpeed(state.playbackRate);
            }
          }
        }

        // Sincronizar game states
        setCurrentIndex(state.currentIndex);
        setWaitingInput(state.waitingInput);
        setBlankWord(state.blankWord);
        setGapIndex(state.gapIndex);
        setScore(state.score);
        setStreak(state.streak);
        
        if (userRole === "teacher") {
          // Keep teacher typing buffer updated
          setInputValue(state.studentInput);
        }
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 300);
      }
    };

    onValue(syncRef, handleSnapshot);
    return () => off(syncRef, "value", handleSnapshot);
  }, [nodeId, myUserId, userRole]);

  // ── Bidirectional Playback Controllers ──────────────────────────────────────

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
      publishState({ playing: false });
    } else {
      player.playVideo();
      setIsPlaying(true);
      publishState({ playing: true });
    }
  };

  const replayLine = () => {
    const line = syncedLines[currentIndex];
    if (!line || !playerRef.current) return;
    const seekTime = line.ms / 1000;
    
    // Grace period: suppress auto-pause for 1.2s after seek
    seekGraceUntilRef.current = Date.now() + 1200;
    isSyncingRef.current = true;
    playerRef.current.seekTo(seekTime, true);
    playerRef.current.playVideo();
    setIsPlaying(true);
    setWaitingInput(false);
    setInputValue("");
    
    publishState({ 
      playing: true, 
      currentTime: seekTime, 
      waitingInput: false,
      studentInput: ""
    });

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 500);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    playerRef.current?.setPlaybackRate(newSpeed);
    publishState({ playbackRate: newSpeed });
  };

  const handleNextLine = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < syncedLines.length) {
      const nextTime = syncedLines[nextIdx].ms / 1000;
      
      const line = syncedLines[nextIdx];
      const g = getGapForLine(line.text);

      // Grace period: suppress auto-pause for 1.2s after seek
      seekGraceUntilRef.current = Date.now() + 1200;
      isSyncingRef.current = true;

      // Imperatively sync stateRef so the RAF loop reads correct values right away
      stateRef.current = {
        ...stateRef.current,
        currentIndex: nextIdx,
        blankWord: g.blankWord,
        gapIndex: g.gapIndex,
        waitingInput: false,
        awaitingNext: false,
        inputValue: "",
        isPlaying: true,
      };

      setCurrentIndex(nextIdx);
      setBlankWord(g.blankWord);
      setGapIndex(g.gapIndex);
      setInputValue("");
      setSubmittedGuess("");
      setGuessEvaluation(null);
      setAwaitingNext(false);
      setIsPlaying(true);
      setWaitingInput(false);

      playerRef.current?.seekTo(nextTime, true);
      playerRef.current?.playVideo();

      publishState({
        playing: true,
        currentTime: nextTime,
        currentIndex: nextIdx,
        blankWord: g.blankWord,
        gapIndex: g.gapIndex,
        studentInput: "",
        waitingInput: false,
      });

      setTimeout(() => {
        isSyncingRef.current = false;
      }, 500);
    }
  };

  const hint = () => {
    if (!blankWord) return;
    toast.info(t("hints.text", { length: blankWord.length, letter: blankWord[0].toUpperCase() }) || `Dica: A palavra tem ${blankWord.length} letras e começa com "${blankWord[0].toUpperCase()}"`);
  };

  // ── Answer Submission Logic (Student View) ──────────────────────────────────

  const submitAnswer = () => {
    if (!blankWord) return;
    const v = normalizeWord(inputValue);
    const b = normalizeWord(blankWord);
    if (!v || !b) return;
    if (v.length !== b.length) return;

    const ev = evaluateGuess(v, b);
    if (v === b) {
      const pts = 100 + streak * 10;
      const nextScore = score + pts;
      const nextStreak = streak + 1;

      // Sync stateRef immediately so any concurrent reads (RAF, publishState) see correct values
      stateRef.current = { ...stateRef.current, waitingInput: false, awaitingNext: true, score: nextScore, streak: nextStreak, inputValue: v };

      setFeedback("correct");
      setGuessEvaluation(ev);
      setSubmittedGuess(v);
      setAwaitingNext(true);
      setScore(nextScore);
      setStreak(nextStreak);
      setWaitingInput(false);
      
      publishState({
        score: nextScore,
        streak: nextStreak,
        waitingInput: false,
        studentInput: v,
      });
      
      setTimeout(() => setFeedback(null), 900);
    } else {
      stateRef.current = { ...stateRef.current, streak: 0 };

      setFeedback("incorrect");
      setGuessEvaluation(ev);
      setSubmittedGuess(v);
      setStreak(0);
      publishState({ streak: 0 });
      setTimeout(() => setFeedback(null), 900);
    }
  };

  const continueAfterCorrect = () => {
    if (!awaitingNext) return;

    const nextIdx = currentIndex + 1;
    if (nextIdx < syncedLines.length) {
      const nextTime = syncedLines[nextIdx].ms / 1000;
      const line = syncedLines[nextIdx];
      const g = getGapForLine(line.text);

      // Grace period: suppress auto-pause for 1.2s after seek
      seekGraceUntilRef.current = Date.now() + 1200;
      isSyncingRef.current = true;

      // Imperatively sync stateRef so the RAF loop reads correct values right away
      stateRef.current = {
        ...stateRef.current,
        currentIndex: nextIdx,
        blankWord: g.blankWord,
        gapIndex: g.gapIndex,
        waitingInput: false,
        awaitingNext: false,
        inputValue: "",
        isPlaying: true,
      };

      setAwaitingNext(false);
      setGuessEvaluation(null);
      setSubmittedGuess("");
      setInputValue("");
      setCurrentIndex(nextIdx);
      setBlankWord(g.blankWord);
      setGapIndex(g.gapIndex);
      setWaitingInput(false);
      setIsPlaying(true);

      playerRef.current?.seekTo(nextTime, true);
      playerRef.current?.playVideo();

      publishState({
        playing: true,
        currentTime: nextTime,
        currentIndex: nextIdx,
        blankWord: g.blankWord,
        gapIndex: g.gapIndex,
        studentInput: "",
        waitingInput: false,
      });

      setTimeout(() => {
        isSyncingRef.current = false;
      }, 500);
    } else {
      publishState({ finished: true });
    }
  };

  const keyboardLetterStates = useMemo(() => {
    const map: Record<string, "correct" | "present" | "absent" | "empty" | "unknown"> = {};
    if (!guessEvaluation || !submittedGuess) return map;

    const scores = { empty: 0, absent: 1, present: 2, correct: 3 };

    for (let i = 0; i < submittedGuess.length; i++) {
      const ch = submittedGuess[i];
      const st = (guessEvaluation[i] ?? "absent") as CellState;
      const prev = map[ch] as CellState | "unknown" | undefined;
      if (!prev || prev === "unknown" || scores[st] > scores[prev]) {
        map[ch] = st;
      }
    }
    return map;
  }, [guessEvaluation, submittedGuess]);

  const maskedLine = useMemo(() => {
    const line = syncedLines[currentIndex]?.text ?? "";
    if (!line) return { before: "", blank: "", after: "" };
    if (!blankWord || gapIndex < 0) return { before: line, blank: "", after: "" };

    const parts = line.split(" ");
    const before = parts.slice(0, gapIndex).join(" ");
    const after = parts.slice(gapIndex + 1).join(" ");
    return { before, blank: parts[gapIndex] ?? "", after };
  }, [blankWord, currentIndex, gapIndex, syncedLines]);

  // ── Setup Mode Action Handlers ──────────────────────────────────────────────

  const searchYouTube = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setIsSearching(true);
    setError(null);
    try {
      const r = await fetch(`/api/editor/youtube-search?q=${encodeURIComponent(query)}&maxResults=6`);
      const data = (await r.json()) as { items: YouTubeVideo[] };
      setSearchResults(data.items || []);
    } catch {
      setError(t("setup.searchError") || "Erro ao buscar vídeos.");
    } finally {
      setIsSearching(false);
    }
  };

  const chooseVideo = (item: YouTubeVideo) => {
    setSetupVideoUrl(`https://www.youtube.com/watch?v=${item.videoId}`);
    const parts = String(item.title || "").split("-").map((s) => s.trim());
    if (parts.length >= 2) {
      setArtistInput(parts[0] || String(item.channelTitle || ""));
      setTrackInput(parts.slice(1).join(" - "));
    } else {
      setTrackInput(String(item.title || ""));
      setArtistInput(String(item.channelTitle || ""));
    }
  };

  const handleLoadLyrics = async () => {
    if (!setupVideoUrl || !trackInput || !artistInput) {
      toast.error(t("setup.fillFieldsWarning") || "Por favor, preencha todos os campos do vídeo.");
      return;
    }
    setLoadingLyrics(true);
    try {
      const lyrics = await fetchLrcData(trackInput, artistInput);
      if (!lyrics) {
        toast.error(t("setup.lyricsNotFoundError") || "Não conseguimos encontrar a letra sincronizada para essa música.");
        return;
      }
      setLrcInput(lyrics);
      
      // Persist the song setup on the Node View wrapper attributes
      updateAttributes({
        videoUrl: setupVideoUrl,
        track: trackInput,
        artist: artistInput,
        lrc: lyrics,
        pauseEvery: pauseEveryInput,
      });

      toast.success(t("setup.lyricsLoadSuccess") || "Letra sincronizada carregada com sucesso!");
    } catch {
      toast.error(t("setup.lyricsLoadError") || "Erro ao carregar letra.");
    } finally {
      setLoadingLyrics(false);
    }
  };

  // ── Renders Setup Board vs Visual Roles ──────────────────────────────────────

  if (!videoId) {
    if (userRole === "student") {
      return (
        <NodeViewWrapper>
          <div className="my-4 p-8 text-center text-zinc-500/60 dark:text-zinc-400/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10">
            <Globe2 className="w-8 h-8 text-primary/40 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-foreground">{t("setup.waitingTitle") || "Aguardando Professor"}</h3>
            <p className="text-xs mt-1">{t("setup.waitingDesc") || "O professor está preparando a atividade Lyrics Training para esta aula."}</p>
          </div>
        </NodeViewWrapper>
      );
    }

    return (
      <NodeViewWrapper>
        <div 
          className={`my-4 p-6 border rounded-2xl bg-white dark:bg-zinc-900 transition-colors duration-200 flex flex-col gap-5 ${
            selected ? "border-solid border-primary" : "border-dashed border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <div className="text-center flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform duration-200 hover:scale-105 shrink-0">
              <Music size={20} />
            </div>
            <h3 className="text-base font-bold text-foreground m-0">{t("setup.title") || "Lyrics Training (Completar Letras)"}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              {t("setup.subtitle") || "Pesquise uma música no YouTube e preencha os dados do artista para carregar a letra sincronizada automaticamente."}
            </p>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("setup.searchPlaceholder") || "Pesquise o nome da música ou cantor..."}
              className="flex-1 h-10 px-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-background outline-none text-sm focus:border-primary"
              onKeyDown={(e) => e.key === "Enter" && searchYouTube()}
            />
            <button
              type="button"
              onClick={searchYouTube}
              disabled={isSearching || !searchQuery.trim()}
              className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t("setup.searchBtn") || "Buscar"}
            </button>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1.5 custom-scrollbar">
              {searchResults.map((item) => (
                <button
                  key={String(item.videoId)}
                  type="button"
                  className="w-full flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-850 p-2 text-left transition-all duration-200 cursor-pointer"
                  onClick={() => chooseVideo(item)}
                >
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    {item.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail} alt={String(item.title)} className="object-cover w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate mb-0.5">{String(item.title)}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{String(item.channelTitle)}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            searchQuery.trim() && (
              <div className="text-center py-6 text-xs text-zinc-500/60 dark:text-zinc-400/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                {t("setup.emptySearch") || "Nenhum vídeo pesquisado ainda."}
              </div>
            )
          )}

          {setupVideoUrl && (
            <div className="flex flex-col gap-4 border-t border-zinc-150 dark:border-zinc-800/50 pt-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 pl-1">{t("setup.trackLabel") || "Nome da Música"}</label>
                  <input
                    type="text"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    placeholder="Shape of You"
                    className="h-10 px-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-background outline-none text-sm focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 pl-1">{t("setup.artistLabel") || "Cantor / Artista"}</label>
                  <input
                    type="text"
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    placeholder="Ed Sheeran"
                    className="h-10 px-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-background outline-none text-sm focus:border-primary"
                  />
                </div>
              </div>

              {/* Pause configuration option */}
              <div className="flex items-center justify-between gap-4 bg-zinc-55/50 dark:bg-zinc-900/10 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Video size={14} className="text-primary" /> {t("setup.pauseEveryLabel") || "Pausar automaticamente a cada:"}
                </span>
                <div className="flex gap-1.5 p-0.5 bg-zinc-150 dark:bg-zinc-800 rounded-full">
                  <button
                    type="button"
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-150 ${
                      pauseEveryInput === 1 ? "bg-white dark:bg-zinc-950 text-foreground shadow-sm" : "text-zinc-500 dark:text-zinc-450 hover:text-foreground"
                    }`}
                    onClick={() => setPauseEveryInput(1)}
                  >
                    {t("setup.oneLine") || "1 linha"}
                  </button>
                  <button
                    type="button"
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-150 ${
                      pauseEveryInput === 2 ? "bg-white dark:bg-zinc-950 text-foreground shadow-sm" : "text-zinc-500 dark:text-zinc-455 hover:text-foreground"
                    }`}
                    onClick={() => setPauseEveryInput(2)}
                  >
                    {t("setup.twoLines") || "2 linhas"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadLyrics}
                disabled={loadingLyrics || !trackInput.trim() || !artistInput.trim()}
                className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingLyrics ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("setup.loadingLyrics") || "Carregando Letra Sincronizada..."}
                  </>
                ) : (
                  t("setup.saveBtn") || "Salvar e Carregar Letra"
                )}
              </button>
            </div>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  // Active sync views based on the session role
  return (
    <NodeViewWrapper>
      <div 
        className={`my-4 p-6 border rounded-2xl bg-white dark:bg-zinc-900 transition-colors duration-200 flex flex-col gap-4 ${
          selected ? "border-solid border-primary" : "border-dashed border-zinc-200 dark:border-zinc-800"
        }`}
      >
        {userRole === "teacher" ? (
          <TeacherLyricsView
            playerContainerRef={playerContainerRef}
            isPlaying={isPlaying}
            isPlayerReady={isPlayerReady}
            togglePlay={togglePlay}
            replayLine={replayLine}
            track={track}
            artist={artist}
            syncedLines={syncedLines}
            currentIndex={currentIndex}
            syncState={syncState}
            handleSpeedChange={handleSpeedChange}
            handleNextLine={handleNextLine}
          />
        ) : (
          <StudentLyricsView
            playerContainerRef={playerContainerRef}
            isPlaying={isPlaying}
            isPlayerReady={isPlayerReady}
            togglePlay={togglePlay}
            replayLine={replayLine}
            hint={hint}
            track={track}
            artist={artist}
            syncedLines={syncedLines}
            currentIndex={currentIndex}
            waitingInput={waitingInput}
            inputValue={inputValue}
            setInputValue={setInputValue}
            blankWord={blankWord}
            placeholder={blankWord ? blankWord.replace(/./g, "_ ") : ""}
            submitAnswer={submitAnswer}
            feedback={feedback}
            guessEvaluation={guessEvaluation}
            keyboardLetterStates={keyboardLetterStates}
            awaitingNext={awaitingNext}
            continueAfterCorrect={continueAfterCorrect}
            score={score}
            streak={streak}
            maskedLine={maskedLine}
            normalizeWord={normalizeWord}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

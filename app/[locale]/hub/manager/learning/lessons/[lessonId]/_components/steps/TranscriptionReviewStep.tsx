"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play, Pause, Save, SkipBack, SkipForward,
  Loader2, ArrowRight
} from "lucide-react";
import { notify } from "@/components/ui/toaster";
import { updateMediaAction, updateLessonAction } from "@/modules/curriculum/curriculum.actions";
import { cn } from "@/lib/utils";
import { Media, Segment, Sentence } from "@/modules/curriculum/curriculum.types";

// Local interfaces removed, using curriculum.types.ts

interface TranscriptionReviewStepProps {
  lessonId: string;
  media: Media;
  onComplete: () => void;
  status: string;
}

export function TranscriptionReviewStep({ lessonId, media, onComplete, status }: TranscriptionReviewStepProps) {
  const t = useTranslations("Learning");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [savedRows, setSavedRows] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initialSegments = (media.transcriptionTimestamps?.length ? media.transcriptionTimestamps : media.config?.segments) || [];
  const [localSentences, setLocalSentences] = useState<Sentence[]>(
    mapSegmentsToSentences(initialSegments as Segment[])
  );

  // Sync state with props when they arrive (fixes "empty initially" issue)
  useEffect(() => {
    if (localSentences.length === 0) {
      const segments = (media.transcriptionTimestamps?.length ? media.transcriptionTimestamps : media.config?.segments) || [];
      if (segments.length > 0) {
        setLocalSentences(mapSegmentsToSentences(segments as Segment[]));
      }
    }
  }, [media.transcriptionTimestamps, media.config?.segments, localSentences.length]);

  useEffect(() => {
    const audio = new Audio(media.url);
    audio.preload = "auto";
    audioRef.current = audio;

    const onCanPlay = () => setIsMediaReady(true);
    const onError = (e: Event) => {
      console.error("❌ Audio load failed:", { url: media.url, error: e });
      const err = audio.error;
      const codes: Record<number, string> = { 1: "ABORTED", 2: "NETWORK", 3: "DECODE", 4: "SRC_NOT_SUPPORTED" };
      console.error("❌ Audio details:", { errorCode: err?.code, errorType: err?.code ? codes[err.code] : "unknown", message: err?.message });
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.src = "";
      audioRef.current = null;
    };
  }, [media.url]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) { audio.pause(); } else { await audio.play(); }
    } catch (e) { console.error("Playback error:", e); }
  };

  const jumpTo = async (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    try { audio.currentTime = Math.max(0, time); await audio.play(); }
    catch (e) { console.error("Jump error:", e); }
  };

  const updateText = (idx: number, text: string) => {
    setLocalSentences(prev => { const n = [...prev]; n[idx] = { ...n[idx], text }; return n; });
  };

  const updateTimestamp = (idx: number, field: "start" | "end", raw: string) => {
    const parsed = parseTime(raw);
    if (parsed === null) return;
    setLocalSentences(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: parsed }; return n; });
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const fullText = localSentences.map(s => s.text).join(" ");
      const flatSegments = localSentences.map(s => ({ word: s.text, start: s.start, end: s.end }));

      const result = await updateMediaAction({
        mediaId: media.id,
        transcriptionText: fullText,
        transcriptionTimestamps: flatSegments,
        config: { ...media.config, segments: flatSegments },
      });

      if (!result?.data?.success) {
        notify.error(result?.serverError || t("error_saving"));
        return;
      }

      const allIndexes = new Set(localSentences.map((_, i) => i));
      setSavedRows(allIndexes);
      setTimeout(() => setSavedRows(new Set()), 1200);
      notify.success(t("saved"));
    } catch {
      notify.error(t("error_saving_transcription"));
    } finally {
      setIsSaving(false);
    }
  }, [localSentences, media.id, media.config, t]);

  const handleConfirm = async () => {
    if (status === "ready") {
      onComplete();
      return;
    };
    setIsAdvancing(true);
    try {
      const fullText = localSentences.map(s => s.text).join(" ");
      const flatSegments = localSentences.map(s => ({ word: s.text, start: s.start, end: s.end }));

      const saveResult = await updateMediaAction({
        mediaId: media.id,
        transcriptionText: fullText,
        transcriptionTimestamps: flatSegments,
        config: { ...media.config, segments: flatSegments },
      });

      if (!saveResult?.data?.success) {
        notify.error(saveResult?.serverError || t("error_saving"));
        return;
      }

      const lessonResult = await updateLessonAction({ id: lessonId, creationStep: 4 });
      if (lessonResult?.data?.success) {
        notify.success(t("save_success"));
        onComplete();
      } else {
        notify.error(lessonResult?.serverError || t("error_advance_step"));
      }
    } catch {
      notify.error(t("error_saving_transcription"));
    } finally {
      setIsAdvancing(false);
    }
  };

  const audioFilename = media.url.split('/').pop()?.split('?')[0] || t("lesson_audio_fallback");

  return (

    <div className="step-content flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col items-start">
          <h2 className="text-xl font-semibold tracking-tight">{t("edit_transcription_title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("edit_transcription_desc")}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleSave} isLoading={isSaving} className="flex-1 sm:flex-none">
            <Save className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">{t("save")}</span>
            <span className="xs:hidden">{t("save")}</span>
          </Button>
          <Button onClick={handleConfirm} isLoading={isAdvancing}>
            {t("confirm_and_next")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-col md:flex-row gap-4 w-full h-auto md:h-[75vh]">

        {/* ── Audio Player ── */}
        <div className={cn(
          "card shrink-0 flex md:flex-col items-center justify-between md:justify-center gap-4 md:gap-6 p-4 md:p-8 border border-border rounded-xl bg-background",
          "w-full md:w-64 sticky top-0 md:relative z-10 md:z-0 md:shadow-none"
        )}>

          {/* State indicator (Compact on mobile) */}
          <div className="flex items-center md:flex-col gap-3 w-auto md:w-full overflow-hidden">
            <div className={cn(
              "shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center transition-colors duration-300",
              isPlaying
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-muted text-muted-foreground"
            )}>
              {!isMediaReady
                ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                : isPlaying
                  ? <Pause className="w-4 h-4 md:w-5 md:h-5" />
                  : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              }
            </div>

            <div className="text-left md:text-center min-w-0 md:w-full">
              <p
                className="text-xs md:text-sm font-medium text-foreground truncate max-w-[120px] xs:max-w-[180px] md:mx-auto"
                title={audioFilename}
              >
                {audioFilename}
              </p>
              <p className="text-[10px] md:text-xs font-mono text-muted-foreground mt-0.5 md:mt-1 tabular-nums">
                {isMediaReady ? formatTime(currentTime) : "—:——.—"}
              </p>
            </div>
          </div>

          {/* Controls (Horizontal on mobile) */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => jumpTo(currentTime - 5)}
              disabled={!isMediaReady}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="-5s"
            >
              <SkipBack className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!isMediaReady}
              className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {isPlaying
                ? <Pause className="w-4 h-4" />
                : <Play className="w-4 h-4 fill-current" />
              }
            </button>

            <button
              onClick={() => jumpTo(currentTime + 5)}
              disabled={!isMediaReady}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="+5s"
            >
              <SkipForward className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Status label (Hidden on small mobile) */}
          <p className="hidden md:block text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            {isMediaReady ? t("audio_content_label") : t("loading_audio")}
          </p>
        </div>

        {/* ── Transcription Editor ── */}
        <div className="card flex flex-col flex-1 border border-border rounded-xl bg-background overflow-hidden min-h-[400px] md:min-h-0">

          {/* Editor header */}
          <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-border bg-muted/5">
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("segments_timestamps_label")}
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground tabular-nums">
              {localSentences.length} {t("segments_count")}
            </span>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">

              {localSentences.length === 0 && (
                <div className="text-center py-20 text-sm text-muted-foreground italic">
                  {t("no_segments_found")}
                </div>
              )}

              {localSentences.map((sentence, idx) => (
                <SentenceRow
                  key={idx}
                  idx={idx}
                  sentence={sentence}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  savedRows={savedRows}
                  jumpTo={jumpTo}
                  updateTimestamp={updateTimestamp}
                  updateText={updateText}
                  t={t}
                />
              ))}

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

interface SentenceRowProps {
  idx: number;
  sentence: Sentence;
  currentTime: number;
  isPlaying: boolean;
  savedRows: Set<number>;
  jumpTo: (time: number) => void;
  updateTimestamp: (idx: number, field: "start" | "end", raw: string) => void;
  updateText: (idx: number, text: string) => void;
  t: (key: string) => string;
}

function SentenceRow({
  idx,
  sentence,
  currentTime,
  isPlaying,
  savedRows,
  jumpTo,
  updateTimestamp,
  updateText,
  t
}: SentenceRowProps) {
  const isActive = currentTime >= sentence.start && currentTime <= sentence.end;
  const wasSaved = savedRows.has(idx);
  const segmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && isPlaying) {
      segmentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [isActive, isPlaying]);

  return (
    <div
      ref={segmentRef}
      className={cn(
        "rounded-xl border transition-all duration-300",
        wasSaved
          ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
          : isActive
            ? "border-primary bg-primary/10 dark:bg-primary/20"
            : "border-transparent hover:border-border/50 bg-muted/20 md:bg-transparent"
      )}
    >
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <button
          onClick={() => jumpTo(sentence.start)}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-md transition-colors",
            isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t("jump_to_segment")}
        >
          <Play className="w-2.5 h-2.5 fill-current" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">
              {t("timestamp_start")}
            </span>
            <input
              key={`start-${idx}-${sentence.start}`}
              className="w-14 text-[11px] md:text-xs font-mono bg-transparent border-none outline-none text-muted-foreground focus:text-foreground focus:font-bold transition-all"
              defaultValue={formatTime(sentence.start)}
              onBlur={(e) => updateTimestamp(idx, "start", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
          </div>

          <span className="text-muted-foreground/20 text-xs mt-2">→</span>

          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">
              {t("timestamp_end")}
            </span>
            <input
              key={`end-${idx}-${sentence.end}`}
              className="w-14 text-[11px] md:text-xs font-mono bg-transparent border-none outline-none text-muted-foreground focus:text-foreground focus:font-bold transition-all"
              defaultValue={formatTime(sentence.end)}
              onBlur={(e) => updateTimestamp(idx, "end", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <textarea
          value={sentence.text}
          onChange={(e) => updateText(idx, e.target.value)}
          rows={1}
          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm md:text-base leading-relaxed resize-none overflow-hidden min-h-[1.5em]"
          placeholder={t("transcription_placeholder")}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
      </div>
    </div>
  );
}

function mapSegmentsToSentences(segments: Segment[]): Sentence[] {
  if (!segments || segments.length === 0) return [];

  return segments.map(s => ({
    text: s.word.trim(),
    start: s.start,
    end: s.end
  }));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

function parseTime(str: string): number | null {
  // Support M:SS.mmm or M:SS.m or M:SS
  const match = str.match(/^(\d+):(\d{1,2})(?:\.(\d+))?$/);
  if (match) {
    const [, m, s, msStr] = match;
    const minutes = parseInt(m, 10);
    const seconds = parseInt(s, 10);
    let milliseconds = 0;
    
    if (msStr) {
      const paddedMs = msStr.padEnd(3, '0').substring(0, 3);
      milliseconds = parseInt(paddedMs, 10);
    }
    
    return minutes * 60 + seconds + milliseconds / 1000;
  }
  const raw = parseFloat(str);
  return isNaN(raw) ? null : raw;
}
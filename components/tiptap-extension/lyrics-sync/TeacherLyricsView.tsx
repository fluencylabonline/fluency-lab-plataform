"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Flame, User, Activity, ArrowRight, ShieldCheck, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import type { LyricsSyncState } from "./LyricsSyncView";

interface TeacherLyricsViewProps {
  playerContainerRef: (node: HTMLDivElement | null) => void;
  isPlaying: boolean;
  isPlayerReady: boolean;
  togglePlay: () => void;
  replayLine: () => void;
  track: string;
  artist: string;
  syncedLines: Array<{ ms: number; text: string }>;
  currentIndex: number;
  syncState: LyricsSyncState | null;
  handleSpeedChange: (speed: number) => void;
  handleNextLine: () => void;
}

export function TeacherLyricsView({
  playerContainerRef,
  isPlaying,
  isPlayerReady,
  togglePlay,
  replayLine,
  track,
  artist,
  syncedLines,
  currentIndex,
  syncState,
  handleSpeedChange,
  handleNextLine,
}: TeacherLyricsViewProps) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const t = useTranslations("LyricsSync");

  const activeLineText = syncedLines[currentIndex]?.text ?? "";

  // Close speed dropdown on outside click
  useEffect(() => {
    if (!speedOpen) return;
    const handleOutsideClick = () => setSpeedOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [speedOpen]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Media Player Area */}
      <div className="mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-xl bg-black border border-zinc-200 dark:border-zinc-800">
        <div ref={playerContainerRef} className="w-full h-full" />
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-row items-center justify-center gap-3 bg-zinc-100/50 dark:bg-zinc-800/20 p-2.5 rounded-full border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-background"
            onClick={togglePlay}
            disabled={!isPlayerReady}
            title={isPlaying ? (t("controls.pause") || "Pausar") : (t("controls.play") || "Tocar")}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-background"
            onClick={replayLine}
            disabled={!isPlayerReady}
            title={t("controls.replay") || "Repetir frase"}
          >
            <RotateCcw className="w-4 h-4 text-foreground" />
          </Button>

          {/* Speed Selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-9 h-9 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                setSpeedOpen(!speedOpen);
              }}
              title={t("controls.speed") || "Velocidade"}
            >
              <Gauge className="w-4 h-4 text-foreground" />
            </Button>
            {speedOpen && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 min-w-[70px] z-50 flex flex-col gap-1 shadow-lg">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg text-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    onClick={() => handleSpeedChange(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-8 px-4 text-xs font-semibold hover:bg-background"
          onClick={handleNextLine}
          title={t("controls.skip") || "Próxima frase"}
        >
          {t("controls.skip") || "Pular Frase"} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Lyrics Display */}
      <div className="flex flex-col justify-center items-center text-center min-h-[120px] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20 transition-all duration-200">
        <div className="text-[11px] font-bold tracking-widest uppercase text-primary mb-2 opacity-80">
          {track || t("student.defaultMusicLabel") || "Música"} {artist ? `• ${artist}` : ""} ({t("student.lineTracker", { current: currentIndex + 1, total: syncedLines.length }) || `Linha ${currentIndex + 1} de ${syncedLines.length}`})
        </div>
        <div className="text-lg md:text-xl font-extrabold leading-relaxed text-foreground flex flex-wrap justify-center items-center gap-1.5 px-4">
          <span className="text-foreground">{activeLineText}</span>
        </div>
      </div>

      {/* Teacher Live Student Progress Monitor */}
      <div className="flex flex-col gap-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-55/50 dark:bg-zinc-900/10 rounded-2xl p-4.5 mt-2">
        <div className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span>{t("teacher.monitorTitle") || "Monitor do Aluno em Tempo Real"}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] font-bold py-0.5 px-2 bg-emerald-500/10 text-emerald-500 rounded-full border-none flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> {t("teacher.statusConnected") || "Conectado"}
          </Badge>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 p-2.5 px-3.5 rounded-xl bg-background border border-zinc-200 dark:border-zinc-850 shadow-sm">
            <span className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("teacher.pointsLabel") || "Pontos"}</span>
            <span className="text-lg font-extrabold text-primary">{syncState?.score ?? 0}</span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 px-3.5 rounded-xl bg-background border border-zinc-200 dark:border-zinc-850 shadow-sm">
            <span className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("teacher.streakLabel") || "Streak (Acertos)"}</span>
            <span className="text-lg font-extrabold text-amber-500 flex items-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              {syncState?.streak ?? 0}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 px-3.5 rounded-xl bg-background border border-zinc-200 dark:border-zinc-850 shadow-sm">
            <span className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("teacher.statusLabel") || "Status"}</span>
            <span className="text-sm font-extrabold text-foreground truncate mt-1">
              {syncState?.finished
                ? (t("teacher.statusFinished") || "Finalizado 🎉")
                : syncState?.waitingInput
                ? (t("teacher.statusWaiting") || "Aguardando Digitação ⌨️")
                : (t("teacher.statusListening") || "Escutando Vídeo 🎧")}
            </span>
          </div>
        </div>

        {/* Real-time typing display */}
        <div className="flex flex-col gap-1.5 p-3 px-3.5 rounded-xl bg-background border border-zinc-200 dark:border-zinc-850 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              {t("teacher.studentTypingLabel") || "O que o Aluno está digitando:"}
            </span>
            {syncState?.waitingInput && syncState?.blankWord && (
              <span className="text-[10px] font-bold">
                {t("teacher.correctAnswerLabel", { word: syncState.blankWord }) || `(Resposta Correta: ${syncState.blankWord})`}
              </span>
            )}
          </span>
          <div className="font-mono text-base font-bold tracking-widest text-primary min-h-[24px] mt-1">
            {syncState?.waitingInput ? (
              syncState.studentInput ? (
                <span className="animate-in fade-in duration-100">{syncState.studentInput}</span>
              ) : (
                <span className="text-zinc-500/40 italic font-normal text-sm font-sans">{t("teacher.noInput") || "Nenhuma letra digitada ainda..."}</span>
              )
            ) : (
              <span className="text-zinc-500/30 font-normal text-sm font-sans">{t("teacher.waitingGap") || "Aguardando a próxima lacuna..."}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

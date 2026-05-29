"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Flame, User, Activity, ArrowRight, ShieldCheck, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LyricsSyncState } from "./LyricsSyncView";

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
      <div className="mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-xl bg-black border border-border/40">
        <div ref={playerContainerRef} className="w-full h-full" />
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-row items-center justify-center gap-3 bg-muted/20 p-2.5 rounded-full border border-border/40">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-background"
            onClick={togglePlay}
            disabled={!isPlayerReady}
            title={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-foreground" /> : <Play className="w-4 h-4 text-foreground ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 hover:bg-background"
            onClick={replayLine}
            disabled={!isPlayerReady}
            title="Repetir frase"
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
              title="Velocidade"
            >
              <Gauge className="w-4 h-4 text-foreground" />
            </Button>
            {speedOpen && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border border-border rounded-xl p-1.5 min-w-[70px] z-50 flex flex-col gap-1">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg text-center hover:bg-muted transition-colors"
                    onClick={() => handleSpeedChange(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-8 px-4 text-xs font-semibold hover:bg-background"
          onClick={handleNextLine}
          title="Próxima frase"
        >
          Pular Frase <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Lyrics Display */}
      <div className="lyrics-text-container">
        <div className="lyrics-text-meta">
          {track || "Música"} {artist ? `• ${artist}` : ""} (Linha {currentIndex + 1}/{syncedLines.length})
        </div>
        <div className="lyrics-text-active-line text-lg md:text-xl font-bold px-4">
          <span className="text-foreground">{activeLineText}</span>
        </div>
      </div>

      {/* Teacher Live Student Progress Monitor */}
      <div className="teacher-progress-panel">
        <div className="teacher-progress-title">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span>Monitor do Aluno em Tempo Real</span>
          <Badge variant="secondary" className="ml-auto text-[10px] font-bold py-0.5 px-2 bg-emerald-500/10 text-emerald-500 rounded-full border-none">
            <ShieldCheck className="w-3 h-3 mr-1" /> Conectado
          </Badge>
        </div>

        {/* Statistics Row */}
        <div className="teacher-progress-stats">
          <div className="teacher-stat-card">
            <span className="teacher-stat-label">Pontos</span>
            <span className="teacher-stat-value text-primary">{syncState?.score ?? 0}</span>
          </div>

          <div className="teacher-stat-card">
            <span className="teacher-stat-label">Streak (Acertos)</span>
            <span className="teacher-stat-value text-amber-500 flex items-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              {syncState?.streak ?? 0}
            </span>
          </div>

          <div className="teacher-stat-card">
            <span className="teacher-stat-label">Status</span>
            <span className="teacher-stat-value text-sm font-semibold truncate">
              {syncState?.finished
                ? "Finalizado 🎉"
                : syncState?.waitingInput
                ? "Aguardando Digitação ⌨️"
                : "Escutando Vídeo 🎧"}
            </span>
          </div>
        </div>

        {/* Real-time typing display */}
        <div className="teacher-live-input-container">
          <span className="teacher-live-input-label">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              O que o Aluno está digitando:
            </span>
            {syncState?.waitingInput && syncState?.blankWord && (
              <span className="text-[10px] text-muted-foreground">
                (Resposta Correta: <strong className="text-foreground">{syncState.blankWord}</strong>)
              </span>
            )}
          </span>
          <div className="teacher-live-input-val mt-1">
            {syncState?.waitingInput ? (
              syncState.studentInput ? (
                <span className="animate-in fade-in duration-100">{syncState.studentInput}</span>
              ) : (
                <span className="text-muted-foreground/40 italic font-normal text-sm font-sans">Nenhuma letra digitada ainda...</span>
              )
            ) : (
              <span className="text-muted-foreground/30 font-normal text-sm font-sans">Aguardando a próxima lacuna...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

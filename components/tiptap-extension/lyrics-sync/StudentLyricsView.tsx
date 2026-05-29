"use client";

import { useEffect } from "react";
import { Play, Pause, RotateCcw, Flame, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "@/app/[locale]/hub/student/immersion/_components/Keyboard";
import { LetterTile } from "@/app/[locale]/hub/student/immersion/_components/LetterTile";
import { cn } from "@/lib/utils";
import type { CellState } from "@/modules/immersion/immersion.types";

interface StudentLyricsViewProps {
  playerContainerRef: (node: HTMLDivElement | null) => void;
  isPlaying: boolean;
  isPlayerReady: boolean;
  togglePlay: () => void;
  replayLine: () => void;
  hint: () => void;
  track: string;
  artist: string;
  syncedLines: Array<{ ms: number; text: string }>;
  currentIndex: number;
  waitingInput: boolean;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  blankWord: string | null;
  placeholder: string;
  submitAnswer: () => void;
  feedback: "correct" | "incorrect" | null;
  guessEvaluation: CellState[] | null;
  keyboardLetterStates: Record<string, "correct" | "present" | "absent" | "empty" | "unknown">;
  awaitingNext: boolean;
  continueAfterCorrect: () => void;
  score: number;
  streak: number;
  maskedLine: { before: string; blank: string; after: string };
  normalizeWord: (s: string) => string;
}

export function StudentLyricsView({
  playerContainerRef,
  isPlaying,
  isPlayerReady,
  togglePlay,
  replayLine,
  hint,
  track,
  artist,
  syncedLines,
  currentIndex,
  waitingInput,
  inputValue,
  setInputValue,
  blankWord,
  submitAnswer,
  guessEvaluation,
  keyboardLetterStates,
  awaitingNext,
  continueAfterCorrect,
  score,
  streak,
  maskedLine,
  normalizeWord,
}: StudentLyricsViewProps) {

  const maxLetters = blankWord ? normalizeWord(blankWord).length : 0;
  const normalizedInput = normalizeWord(inputValue).slice(0, maxLetters);
  const canConfirm = waitingInput && maxLetters > 0 && normalizedInput.length === maxLetters;
  const tilesDisabled = (!waitingInput && !awaitingNext) || isPlaying || !isPlayerReady;

  const tileStates =
    guessEvaluation && guessEvaluation.length === maxLetters
      ? guessEvaluation
      : Array.from({ length: maxLetters }, () => "empty" as const);

  const showNextButton = awaitingNext && !isPlaying;

  // Keyboard input handlers
  const onKeyboardLetter = (ch: string) => {
    if (tilesDisabled) return;
    setInputValue((prev) => {
      const used = normalizeWord(prev).length;
      if (used >= maxLetters) return prev;
      return prev + ch.toLowerCase();
    });
  };

  const onKeyboardBackspace = () => {
    if (tilesDisabled) return;
    setInputValue((p) => p.slice(0, -1));
  };

  const onKeyboardEnter = () => {
    if (tilesDisabled) return;
    if (!canConfirm) return;
    submitAnswer();
  };

  // Intercept and swallow physical keyboard events to prevent Tiptap editor modifications
  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      if (!waitingInput) return;

      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      // Block and swallow all physical keystrokes so they never reach the editor
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("keydown", handlePhysicalKeyDown, true); // use capture phase to intercept before Tiptap
    return () => window.removeEventListener("keydown", handlePhysicalKeyDown, true);
  }, [waitingInput]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Video Player Display */}
      <div className="mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-xl bg-black border border-border/40">
        <div ref={playerContainerRef} className="w-full h-full" />
      </div>

      {/* Control Buttons & Score Board */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border-none">
            Pontos: <span className="font-bold ml-1">{score}</span>
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border-none flex items-center gap-1">
            <Flame className={cn("w-3.5 h-3.5 fill-amber-500/20", streak > 2 && "animate-bounce")} />
            {streak}
          </Badge>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 rounded-full p-0.5 border border-border/40">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 hover:bg-background"
            onClick={togglePlay}
            disabled={!isPlayerReady || awaitingNext}
            title={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-foreground" /> : <Play className="w-3.5 h-3.5 text-foreground ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 hover:bg-background"
            onClick={replayLine}
            disabled={!isPlayerReady}
            title="Repetir frase"
          >
            <RotateCcw className="w-3.5 h-3.5 text-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-8 h-8 hover:bg-background"
            onClick={hint}
            disabled={!isPlayerReady || !waitingInput || !blankWord}
            title="Dica"
          >
            <Lightbulb className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/10" />
          </Button>
        </div>
      </div>

      {/* Lyrics Exercise Board */}
      <div className="lyrics-text-container">
        <div className="lyrics-text-meta">
          {track || "Música"} {artist ? `• ${artist}` : ""} (Linha {currentIndex + 1}/{syncedLines.length})
        </div>
        <div className="lyrics-text-active-line text-lg md:text-xl font-bold px-4">
          <span>{maskedLine.before ? `${maskedLine.before} ` : ""}</span>

          {maskedLine.blank ? (
            <span
              className={cn(
                "inline-flex items-center justify-center align-middle mx-1.5",
                tilesDisabled && "opacity-60"
              )}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {Array.from({ length: maxLetters }).map((_, idx) => {
                  const ch = normalizedInput[idx]?.toUpperCase() ?? "";
                  const st = tileStates[idx] ?? "empty";
                  return (
                    <span key={idx} className="w-5 md:w-6">
                      <LetterTile
                        letter={ch}
                        state={st}
                        filled={!!ch && st === "empty"}
                        ariaLabel={`Letra ${idx + 1}`}
                      />
                    </span>
                  );
                })}
              </span>
            </span>
          ) : null}

          <span>{maskedLine.after ? ` ${maskedLine.after}` : ""}</span>
        </div>
      </div>

      {/* Inputs / Keyboards Footer Panel */}
      <div className="lyrics-input-footer">
        {showNextButton ? (
          <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 py-1 px-3.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resposta correta!
            </span>
            <Button
              variant="default"
              size="lg"
              className="rounded-full px-8 h-12 text-sm font-bold shadow-sm"
              onClick={continueAfterCorrect}
              disabled={!isPlayerReady}
            >
              Continuar para a Próxima Frase <Play className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        ) : waitingInput ? (
          /* Always show virtual keyboard and block physical key interactions */
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200 flex flex-col items-center gap-3">
            <Keyboard
              onLetter={onKeyboardLetter}
              onEnter={onKeyboardEnter}
              onBackspace={onKeyboardBackspace}
              letterStates={keyboardLetterStates}
              disabled={tilesDisabled}
            />
            <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
              Teclado físico bloqueado nesta aula. Responda pelas teclas virtuais acima.
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="lyrics-typing-indicator">
              <div className="flex gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Ouvindo música... aguarde a lacuna aparecer</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

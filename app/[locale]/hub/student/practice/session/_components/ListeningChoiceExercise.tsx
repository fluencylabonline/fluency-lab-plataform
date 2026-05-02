"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, CheckCircle, ArrowRight, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TranscriptSegmentForPractice, LearningItemForPractice } from "@/modules/learning/learning.types";

interface ListeningChoiceExerciseProps {
  audioUrl?: string | null;
  transcriptSegments: TranscriptSegmentForPractice[];
  learningItems: LearningItemForPractice[];
  onComplete: (score: number) => void;
}

type GapState = {
  hasGap: boolean;
  correctWord: string;
  parts: [string, string];
  options: string[];
  selectedOption: string | null;
  isCorrect: boolean | null;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function ListeningChoiceExercise({ audioUrl, transcriptSegments, learningItems, onComplete }: ListeningChoiceExerciseProps) {
  const t = useTranslations("Practice");
  const [phase, setPhase] = useState<"full_listen" | "interactive">("full_listen");
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasListened, setHasListened] = useState(true); // start as true to skip full listen in mock
  const [segmentIdx, setSegmentIdx] = useState(0);
  const [gapState, setGapState] = useState<GapState | null>(null);
  const [score, setScore] = useState(0);
  const [totalGaps, setTotalGaps] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Build gap state for the current segment
  useEffect(() => {
    if (phase !== "interactive") return;
    const segment = transcriptSegments[segmentIdx];
    if (!segment) return;

    const sorted = [...learningItems].sort((a, b) => b.mainText.length - a.mainText.length);
    let match: LearningItemForPractice | null = null;
    let matchIdx = -1;

    for (const item of sorted) {
      const regex = new RegExp(`\\b${item.mainText}\\b`, "i");
      const found = segment.text.match(regex);
      if (found && found.index !== undefined) {
        match = item;
        matchIdx = found.index;
        break;
      }
    }

    const timer = setTimeout(() => {
      if (match && matchIdx !== -1) {
        const before = segment.text.slice(0, matchIdx);
        const after = segment.text.slice(matchIdx + match.mainText.length);
        const distractors = shuffle(learningItems.filter((i) => i.id !== match!.id))
          .slice(0, 2)
          .map((i) => i.mainText);
        while (distractors.length < 2) distractors.push("...");

        setGapState({
          hasGap: true,
          correctWord: match.mainText,
          parts: [before, after],
          options: shuffle([match.mainText, ...distractors]),
          selectedOption: null,
          isCorrect: null,
        });
        setTotalGaps((p) => p + 1);

        if (audioRef.current && audioUrl) {
          audioRef.current.currentTime = segment.start;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        setGapState({ hasGap: false, correctWord: "", parts: ["", segment.text], options: [], selectedOption: null, isCorrect: null });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [phase, segmentIdx, transcriptSegments, learningItems, audioUrl]);

  // Stop audio at segment end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || phase !== "interactive") return;
    const segment = transcriptSegments[segmentIdx];
    if (!segment) return;

    const checkEnd = () => {
      if (audio.currentTime >= segment.end) {
        audio.pause();
        setIsPlaying(false);
        audio.removeEventListener("timeupdate", checkEnd);
      }
    };
    audio.addEventListener("timeupdate", checkEnd);
    return () => audio.removeEventListener("timeupdate", checkEnd);
  }, [phase, segmentIdx, transcriptSegments]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const startInteractive = () => {
    setPhase("interactive");
    setSegmentIdx(0);
    setScore(0);
    setTotalGaps(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  const handleOptionSelect = (option: string) => {
    if (!gapState || gapState.selectedOption) return;
    const isCorrect = option.toLowerCase() === gapState.correctWord.toLowerCase();
    setGapState({ ...gapState, selectedOption: option, isCorrect });
    if (isCorrect) setScore((p) => p + 1);
  };

  const nextSegment = () => {
    if (segmentIdx < transcriptSegments.length - 1) {
      setSegmentIdx((p) => p + 1);
    } else {
      const finalScore = totalGaps > 0 ? (score / totalGaps) * 5 : 5;
      onComplete(finalScore);
    }
  };

  // ── Full Listen Phase ──
  if (phase === "full_listen") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Volume2 size={38} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t('listenFullAudio') || "Ouça o áudio completo"}</h2>
          <p className="text-muted-foreground text-sm">{t('payAttentionContext') || "Preste atenção no contexto geral antes dos exercícios."}</p>
        </div>

        <div className="w-full max-w-sm bg-muted/30 p-6 rounded-2xl border border-border flex flex-col items-center gap-4">
          <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => { setIsPlaying(false); setHasListened(true); }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="hidden" />
          <Button
            size="lg"
            className={cn("rounded-full w-16 h-16", isPlaying ? "bg-muted text-foreground" : "bg-primary text-primary-foreground")}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
          </Button>
          <p className="text-sm text-muted-foreground">{isPlaying ? (t('playing') || "Reproduzindo...") : (t('tapToListen') || "Toque para ouvir")}</p>
        </div>

        {hasListened && (
          <Button onClick={startInteractive} size="lg" className="w-full max-w-xs">
            {t('startExercise') || "Iniciar exercício"} <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // ── Interactive Phase ──
  const progress = (segmentIdx / transcriptSegments.length) * 100;

  return (
    <div className="flex flex-col min-h-[60vh] max-w-2xl mx-auto w-full space-y-5 animate-in fade-in">
      <audio ref={audioRef} src={audioUrl || undefined} className="hidden" />

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('segmentOf', { current: segmentIdx + 1, total: transcriptSegments.length }) || `Trecho ${segmentIdx + 1} de ${transcriptSegments.length}`}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {audioUrl && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className={cn("rounded-full px-6", isPlaying && "border-primary text-primary")}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={14} className="mr-2" /> : <Play size={14} className="mr-2" />}
            {isPlaying ? (t('playing') || "Reproduzindo...") : (t('listenSegmentAgain') || "Ouvir trecho novamente")}
          </Button>
        </div>
      )}

      <div className="bg-muted/30 rounded-2xl p-6 border border-border min-h-[100px] flex items-center justify-center text-center">
        {gapState ? (
          <p className="text-base font-medium text-foreground leading-relaxed">
            {gapState.parts[0]}
            {gapState.hasGap && (
              <span className={cn(
                "inline-block min-w-[80px] border-b-2 mx-1 px-2 py-0.5 rounded transition-colors",
                !gapState.selectedOption && "border-muted-foreground/50 text-transparent",
                gapState.selectedOption && gapState.isCorrect && "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                gapState.selectedOption && !gapState.isCorrect && "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400",
              )}>
                {gapState.selectedOption || "____"}
              </span>
            )}
            {gapState.parts[1]}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">{t('loadingSegment') || "Carregando trecho..."}</p>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end space-y-4">
        {gapState?.hasGap ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {gapState.options.map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                className={cn(
                  "h-14 text-base font-medium hover:border-primary hover:text-primary hover:bg-primary/5",
                  gapState.selectedOption === option && gapState.isCorrect && "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/20",
                  gapState.selectedOption === option && !gapState.isCorrect && "bg-rose-100 border-rose-500 text-rose-800 dark:bg-rose-900/20",
                  gapState.selectedOption && gapState.selectedOption !== option && "opacity-40",
                )}
                onClick={() => handleOptionSelect(option)}
                disabled={!!gapState.selectedOption}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-xs italic py-2">{t('noKeyTerms') || "Nenhum termo-chave neste trecho."}</p>
        )}

        {(!gapState?.hasGap || gapState?.selectedOption) && (
          <Button className="w-full" onClick={nextSegment}>
            {segmentIdx < transcriptSegments.length - 1 ? (
              <><span>{t('nextSegment') || "Próximo trecho"}</span> <ArrowRight className="ml-2" /></>
            ) : (
              <><span>{t('finishPractice') || "Finalizar prática"}</span> <CheckCircle className="ml-2" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

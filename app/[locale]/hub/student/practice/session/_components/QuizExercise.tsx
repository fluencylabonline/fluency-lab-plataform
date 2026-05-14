"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PracticeAudioPlayer } from "./PracticeAudioPlayer";
import { Volume2, Eye } from "lucide-react";
import type { PracticeQuizQuestion } from "@/modules/learning/learning.types";

interface QuizExerciseProps extends PracticeQuizQuestion {
  language?: string;
  onComplete: (isCorrect: boolean) => void;
}

export function QuizExercise({ 
  question, 
  options, 
  correctIndex, 
  sectionType, 
  audioSegment, 
  language,
  onComplete 
}: QuizExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showOptions, setShowOptions] = useState(!audioSegment);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelected(idx);
    setIsSubmitted(true);
    onComplete(idx === correctIndex);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {sectionType && (
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">
          {sectionType}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{question}</h2>

        {audioSegment && (
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlayerOpen(true)}
              className="text-primary border-primary/40 hover:bg-primary/10"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Ouvir
            </Button>
            {!showOptions && (
              <Button variant="ghost" size="sm" onClick={() => setShowOptions(true)} className="text-muted-foreground">
                <Eye className="mr-2 h-4 w-4" />
                Ver opções
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {!showOptions ? (
        <div className="h-48 flex flex-col items-center justify-center bg-muted/30 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
          <Volume2 className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Ouça o áudio para ver as opções...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {options.map((option, idx) => (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                "h-auto py-5 px-5 text-base justify-start text-left whitespace-normal transition-all",
                selected === idx && idx === correctIndex && "border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500 text-green-800 dark:text-green-300",
                selected === idx && idx !== correctIndex && "border-rose-500 bg-rose-50 dark:bg-rose-950/30 ring-2 ring-rose-500 text-rose-800 dark:text-rose-300",
                !isSubmitted && "hover:border-primary/50 hover:bg-accent"
              )}
              onClick={() => handleSelect(idx)}
              disabled={isSubmitted}
            >
              <span className={cn(
                "mr-3 font-mono text-xs border rounded-full w-7 h-7 shrink-0 flex items-center justify-center",
                selected === idx && idx === correctIndex && "border-green-500 bg-green-200 text-green-800",
                selected === idx && idx !== correctIndex && "border-rose-500 bg-rose-200 text-rose-800",
                !isSubmitted && "text-muted-foreground"
              )}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
            </Button>
          ))}
        </div>
      )}

      {audioSegment && (
        <PracticeAudioPlayer
          audioUrl={audioSegment.url}
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          startTime={audioSegment.start}
          endTime={audioSegment.end}
          onComplete={() => setShowOptions(true)}
          language={language}
          autoPlay
        />
      )}
    </div>
  );
}

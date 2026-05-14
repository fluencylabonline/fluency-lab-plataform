"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface GapFillExerciseProps {
  sentenceWithGap: string;
  correctAnswer: string;
  /** Full sentence to read via TTS (always used instead of audioUrl) */
  fullSentenceForTTS: string;
  language?: string;
  onComplete: (isCorrect: boolean, userAnswer: string) => void;
}

export function GapFillExercise({
  sentenceWithGap,
  correctAnswer,
  fullSentenceForTTS,
  language = "en-US",
  onComplete,
}: GapFillExerciseProps) {
  const [answer, setAnswer] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [prevSentence, setPrevSentence] = useState(sentenceWithGap);

  // Calculate parts directly during render
  const parts = sentenceWithGap.split("___");

  // Reset state if the sentence changes
  if (sentenceWithGap !== prevSentence) {
    setPrevSentence(sentenceWithGap);
    setAnswer("");
    setIsLocked(false);
  }

  const speakSentence = useCallback(() => {
    if (!fullSentenceForTTS || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utt = new SpeechSynthesisUtterance(fullSentenceForTTS);
    utt.lang = language;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }, [fullSentenceForTTS, language]);

  // Auto-play TTS when exercise mounts
  useEffect(() => {
    speakSentence();
  }, [speakSentence]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !answer.trim()) return;
    setIsLocked(true);
    const isCorrect = answer.trim().toLowerCase() === correctAnswer.toLowerCase();
    onComplete(isCorrect, answer.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-4 w-full max-w-2xl mx-auto">
      {/* Instruction + TTS button */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground text-center">
          Ouça e preencha a lacuna
        </h2>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          disabled={isLocked}
          onClick={speakSentence}
          className="shrink-0 text-primary"
          title="Ouvir novamente"
        >
          <Volume2 className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-8">
        {/* Sentence with gap */}
        <div className="text-xl md:text-2xl font-medium leading-relaxed text-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          {parts.map((part, index) => (
            <span key={index} className="whitespace-pre-wrap">
              {part}
              {index < parts.length - 1 && (
                <span className="inline-block mx-2">
                  <Input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isLocked}
                    className="w-32 md:w-48 text-center text-xl font-bold bg-muted border-b-4 border-primary focus:bg-background transition-all rounded-xl h-12 inline-block"
                    placeholder=""
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </span>
              )}
            </span>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={!answer.trim() || isLocked}
            className="px-12 py-6 text-lg font-bold uppercase tracking-widest rounded-md bg-green-500 hover:bg-green-600 border-none text-white shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
          >
            Verificar
          </Button>
        </div>
      </form>
    </div>
  );
}

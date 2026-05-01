"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import Image from "next/image";

interface FlashcardExerciseProps {
  front: string;
  back: string;
  imageUrl?: string | null;
  /** If true, clicking the audio button reads the front text via browser TTS */
  useTTS?: boolean;
  language?: string;
  onResult: (grade: 0 | 1 | 3 | 4 | 5) => void;
}

export function FlashcardExercise({ front, back, imageUrl, useTTS = true, language = "en-US", onResult }: FlashcardExerciseProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (isLocked || !useTTS) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleFlip = () => {
    if (isLocked) return;
    window.speechSynthesis.cancel();
    setIsFlipped((p) => !p);
  };

  const handleGrade = (e: React.MouseEvent, grade: 0 | 1 | 3 | 4 | 5) => {
    e.stopPropagation();
    if (isLocked) return;
    setIsLocked(true);
    onResult(grade);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 w-full max-w-md mx-auto">
      {/* Card with 3D flip */}
      <div
        className="relative w-full aspect-[3/4] cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: "1000px" }}
      >
        {/* Stacked "depth" layers */}
        <div className="absolute top-2 left-2 right-[-8px] bottom-[-8px] bg-muted rounded-3xl border-2 border-border z-0" />
        <div className="absolute top-1 left-1 right-[-4px] bottom-[-4px] bg-muted/60 rounded-3xl border border-border z-10" />

        <motion.div
          className="relative w-full h-full z-20"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.55, type: "spring", stiffness: 280, damping: 22 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-card rounded-3xl border-b-4 border-border flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            {useTTS && (
              <button
                onClick={(e) => handleSpeak(e, front)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary transition-colors z-30"
                title="Ouvir"
              >
                <Volume2 size={22} />
              </button>
            )}

            {imageUrl && (
              <div className="relative w-full max-h-[180px] h-44 mb-6 flex justify-center">
                <Image
                  src={imageUrl}
                  alt={front}
                  fill
                  className="object-contain rounded-xl"
                  sizes="(max-width: 480px) 90vw, 384px"
                />
              </div>
            )}

            <p className="text-3xl font-bold text-foreground">{front}</p>
            <p className="absolute bottom-6 text-muted-foreground text-xs uppercase tracking-widest font-semibold">
              Toque para virar
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-card rounded-3xl border-b-4 border-border flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {useTTS && (
              <button
                onClick={(e) => handleSpeak(e, back)}
                disabled={isLocked}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary transition-colors z-30"
                title="Ouvir tradução"
              >
                <Volume2 size={22} />
              </button>
            )}
            <p className="text-2xl font-medium text-foreground">{back}</p>
          </div>
        </motion.div>
      </div>

      {/* Grade buttons — appear after flip */}
      <div className="h-24 w-full mt-8 flex items-center justify-center">
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="grid grid-cols-4 gap-2 w-full"
            >
              {(
                [
                  { label: "Again", grade: 1 as const, cls: "bg-rose-500 hover:bg-rose-600 shadow-[0_4px_0_0_#be123c]" },
                  { label: "Hard",  grade: 3 as const, cls: "bg-amber-500 hover:bg-amber-600 shadow-[0_4px_0_0_#b45309]" },
                  { label: "Good",  grade: 4 as const, cls: "bg-indigo-500 hover:bg-indigo-600 shadow-[0_4px_0_0_#4338ca]" },
                  { label: "Easy",  grade: 5 as const, cls: "bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_0_0_#047857]" },
                ] as const
              ).map(({ label, grade, cls }) => (
                <Button
                  key={label}
                  onClick={(e) => handleGrade(e, grade)}
                  disabled={isLocked}
                  className={`border-none h-14 rounded-xl text-white font-bold text-sm active:translate-y-1 active:shadow-none transition-all px-1 ${cls}`}
                >
                  {label}
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

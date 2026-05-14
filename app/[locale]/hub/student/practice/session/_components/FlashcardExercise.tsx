"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const GRADES = [
  { label: "Again", grade: 1 as const, bg: "bg-[#e05c5c] hover:bg-[#d44f4f]" },
  { label: "Hard",  grade: 3 as const, bg: "bg-[#d48a2e] hover:bg-[#c47e26]" },
  { label: "Good",  grade: 4 as const, bg: "bg-[#5275e0] hover:bg-[#4668d4]" },
  { label: "Easy",  grade: 5 as const, bg: "bg-[#3aaa76] hover:bg-[#2f9e6a]" },
] as const;

export function FlashcardExercise({
  front,
  back,
  imageUrl,
  useTTS = true,
  language = "en-US",
  onResult,
}: FlashcardExerciseProps) {
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 w-full max-w-sm mx-auto">

      {/* Card */}
      <div
        className="relative w-full aspect-3/4 cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0.2, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >

          {/* ── Front ── */}
          <div
            className="absolute inset-0 rounded-md border border-border/40 bg-accent overflow-hidden flex flex-col"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Image — flush, no padding, no border */}
            {imageUrl && (
              <div className="relative w-full shrink-0 overflow-hidden rounded-t-md" style={{ height: "52%" }}>
                <Image
                  src={imageUrl}
                  alt={front}
                  fill
                  className="object-cover"
                  sizes="(max-width: 480px) 90vw, 384px"
                />
              </div>
            )}

            {/* Text area */}
            <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-4">
              {useTTS && (
                <button
                  onClick={(e) => handleSpeak(e, front)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full border border-border/30 bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  title="Ouvir"
                >
                  <Volume2 size={15} />
                </button>
              )}

              <p className="text-[28px] font-medium text-foreground tracking-tight text-center leading-tight">
                {front}
              </p>

              <span className="absolute bottom-5 text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground/60">
                Toque para virar
              </span>
            </div>
          </div>

          {/* ── Back ── */}
          <div
            className="absolute inset-0 rounded-md border border-border/40 bg-muted/30 overflow-hidden flex flex-col"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {/* Same image on back */}
            {imageUrl && (
              <div className="relative w-full shrink-0 overflow-hidden rounded-t-md" style={{ height: "52%" }}>
                <Image
                  src={imageUrl}
                  alt={back}
                  fill
                  className="object-cover"
                  sizes="(max-width: 480px) 90vw, 384px"
                />
              </div>
            )}

            <div className="relative flex flex-1 flex-col items-center justify-center gap-1.5 px-6 pb-6 pt-4">
              {useTTS && (
                <button
                  onClick={(e) => handleSpeak(e, back)}
                  disabled={isLocked}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full border border-border/30 bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  title="Ouvir tradução"
                >
                  <Volume2 size={15} />
                </button>
              )}

              <p className="text-[22px] font-medium text-foreground tracking-tight text-center leading-snug">
                {back}
              </p>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Grade buttons */}
      <div className="w-full mt-6 h-14">
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, delay: 0.28, ease: "easeOut" }}
              className="grid grid-cols-4 gap-2 w-full"
            >
              {GRADES.map(({ label, grade, bg }) => (
                <button
                  key={label}
                  onClick={(e) => handleGrade(e, grade)}
                  disabled={isLocked}
                  className={`
                    h-12 rounded-md text-white text-[13px] font-medium
                    transition-all active:scale-[0.97] disabled:opacity-50
                    ${bg}
                  `}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
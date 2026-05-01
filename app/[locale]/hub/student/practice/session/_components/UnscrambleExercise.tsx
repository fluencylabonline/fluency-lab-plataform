"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UnscrambleExerciseProps {
  scrambledWords: string[];
  correctOrder: string[];
  onComplete: (isCorrect: boolean, movesMade: number) => void;
}

export function UnscrambleExercise({ scrambledWords, correctOrder, onComplete }: UnscrambleExerciseProps) {
  const [available, setAvailable] = useState(
    scrambledWords.map((w, i) => ({ id: `${w}-${i}`, word: w }))
  );
  const [selected, setSelected] = useState<{ id: string; word: string }[]>([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const move = (wordObj: { id: string; word: string }, from: "bank" | "answer") => {
    if (isLocked) return;
    setMoves((p) => p + 1);
    if (from === "bank") {
      setAvailable((p) => p.filter((w) => w.id !== wordObj.id));
      setSelected((p) => [...p, wordObj]);
    } else {
      setSelected((p) => p.filter((w) => w.id !== wordObj.id));
      setAvailable((p) => [...p, wordObj]);
    }
  };

  const checkAnswer = () => {
    if (isLocked) return;
    setIsLocked(true);
    const current = selected.map((w) => w.word).join(" ");
    const correct = correctOrder.join(" ");
    onComplete(current === correct, moves);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[60vh] p-4 max-w-2xl mx-auto w-full">
      <div className="w-full space-y-8">
        <h2 className="text-2xl font-bold text-foreground text-center">
          Forme a frase correta
        </h2>

        {/* Answer zone */}
        <div className="min-h-[80px] w-full border-b-2 border-border p-3 flex flex-wrap gap-2 items-center justify-start rounded-t-xl bg-muted/30">
          {selected.map((w) => (
            <motion.button
              layoutId={w.id}
              key={w.id}
              onClick={() => move(w, "answer")}
              disabled={isLocked}
              className="px-4 py-2 bg-card border-2 border-border border-b-4 active:border-b-2 rounded-xl font-semibold text-foreground text-base"
              whileTap={{ scale: 0.95 }}
            >
              {w.word}
            </motion.button>
          ))}
          {selected.length === 0 && (
            <p className="text-muted-foreground text-sm italic px-2">Clique nas palavras abaixo para montar a frase...</p>
          )}
        </div>

        {/* Word bank */}
        <div className="flex flex-wrap gap-2 justify-center pt-4">
          {available.map((w) => (
            <motion.button
              layoutId={w.id}
              key={w.id}
              onClick={() => move(w, "bank")}
              disabled={isLocked}
              className="px-4 py-2 bg-card border-2 border-border border-b-4 active:border-b-2 rounded-xl font-semibold text-foreground text-base"
              whileTap={{ scale: 0.95 }}
            >
              {w.word}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="w-full mt-10">
        <Button
          onClick={checkAnswer}
          disabled={selected.length === 0 || isLocked}
          className="w-full md:w-auto md:min-w-[220px] float-right px-8 py-6 text-lg font-bold uppercase tracking-widest rounded-2xl bg-green-500 hover:bg-green-600 border-none text-white shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
        >
          Verificar
        </Button>
      </div>
    </div>
  );
}

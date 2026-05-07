"use client";

import { CellState } from "@/modules/immersion/immersion.types";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LetterTile } from "../LetterTile";

type WordLadderBoardProps = {
  length: number;
  steps: string[];
  current: string;
  goalWord?: string;
  evaluations: CellState[][];
  shaking: boolean;
  finished: boolean;
};


export function WordLadderBoard({
  length,
  steps,
  current,
  goalWord,
  evaluations,
  shaking,
  finished,
}: WordLadderBoardProps) {

  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!shaking) return;
    queueMicrotask(() => setIsShaking(true));
  }, [shaking]);

  // Mostramos: passos já dados + linha atual (se não terminou) + objetivo (se não terminou e não for a linha atual)
  const isGoalVisible = !finished && (steps[steps.length - 1] !== goalWord);

  return (
    <div
      className="flex-1 flex flex-col w-full max-w-[320px] sm:max-w-[400px] mx-auto overflow-hidden h-full max-h-[60vh] sm:max-h-none"
      role="application"
      aria-label="Tabuleiro do Word Ladder"
    >
      {/* Área rolável para a escada */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 sm:space-y-2 py-2 custom-scrollbar">
        <div className="grid gap-1.5 sm:gap-2 w-full">
          {/* Passos já submetidos */}
          {steps.map((word, rowIdx) => (
            <motion.div
              key={`step-${rowIdx}`}
              className="grid gap-1.5 sm:gap-2 w-full"
              style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
            >
              {Array.from({ length }).map((_, colIdx) => (
                <LetterTile
                  key={colIdx}
                  letter={word[colIdx] || ""}
                  state={evaluations[rowIdx]?.[colIdx] || "empty"}
                  animation="flip"
                  delay={colIdx * 0.15}
                />
              ))}
            </motion.div>
          ))}

          {/* Linha de digitação atual */}
          {!finished && (
            <motion.div
              key="current"
              className="grid gap-1.5 sm:gap-2 w-full"
              style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
              animate={isShaking ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              onAnimationComplete={() => setIsShaking(false)}
            >
              {Array.from({ length }).map((_, colIdx) => (
                <LetterTile
                  key={colIdx}
                  letter={current[colIdx] || ""}
                  state="empty"
                  filled={!!current[colIdx]}
                  animation={current[colIdx] ? "pop" : "none"}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Linha de objetivo fixa no final */}
      {isGoalVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-auto pt-4 pb-4 px-3 border-t border-dashed border-border/30 bg-muted/5 rounded-b-2xl"
        >
          <div className="text-[10px] uppercase font-bold text-muted-foreground/40 text-center tracking-widest mb-3">
            Objetivo Final
          </div>
          <div
            className="grid gap-1.5 sm:gap-2 w-full opacity-30 grayscale select-none pointer-events-none"
            style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
          >
            {Array.from({ length }).map((_, colIdx) => (
              <LetterTile
                key={colIdx}
                letter={goalWord?.[colIdx] || ""}
                state="empty"
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

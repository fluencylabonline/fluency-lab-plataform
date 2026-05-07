"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CellState, FinishedState } from "@/modules/immersion/immersion.types";
import { LetterTile } from "../LetterTile";

type WordleBoardProps = {
  maxAttempts: number;
  length: number;
  guesses: string[];
  current: string;
  finished: FinishedState;
  evaluations: CellState[][];
  shaking: boolean;
};

const stateLabel: Record<CellState, string> = {
  empty: "vazia",
  absent: "ausente",
  present: "presente",
  correct: "correta",
};

export function WordleBoard({
  maxAttempts,
  length,
  guesses,
  current,
  finished,
  evaluations,
  shaking,
}: WordleBoardProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!shaking) return;
    queueMicrotask(() => setIsShaking(true));
  }, [shaking]);

  return (
    <div
      className="flex-1 flex flex-col justify-center items-center w-full px-4"
      role="application"
      aria-label="Tabuleiro do Wordle"
    >
      <div className="grid grid-rows-6 gap-1.5 sm:gap-2 w-full max-w-[320px] sm:max-w-[400px]">
        {Array.from({ length: maxAttempts }).map((_, rowIdx) => {
          const isCurrentRow = guesses.length === rowIdx && !finished;
          const isSubmittedRow = rowIdx < guesses.length;
          const guess = guesses[rowIdx] || "";
          const evalRow = evaluations[rowIdx] || [];
          const shouldShake = isCurrentRow && isShaking;

          return (
            <motion.div
              key={rowIdx}
              className="grid gap-1.5 sm:gap-2 w-full"
              style={{
                gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))`,
              }}
              initial={false}
              animate={shouldShake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
              transition={shouldShake ? { duration: 0.4 } : { duration: 0 }}
              onAnimationComplete={() => {
                if (shouldShake) setIsShaking(false);
              }}
            >
              {Array.from({ length }).map((_, colIdx) => {
                const ch =
                  isCurrentRow && colIdx < current.length
                    ? current[colIdx]
                    : guess[colIdx] || "";

                const state = isSubmittedRow
                  ? (evalRow[colIdx] as CellState)
                  : "empty";

                const a11yStateLabel = isSubmittedRow
                  ? stateLabel[state]
                  : ch
                    ? "digitada"
                    : "vazia";
                const ariaLabel = `Tentativa ${rowIdx + 1}, letra ${colIdx + 1}: ${ch ? ch.toUpperCase() : "vazia"}, ${a11yStateLabel}`;

                return (
                  <LetterTile
                    key={colIdx}
                    aria-label={ariaLabel}
                    letter={ch}
                    state={state}
                    filled={!!ch && !isSubmittedRow}
                    animation={isSubmittedRow ? "flip" : ch ? "pop" : "none"}
                    delay={isSubmittedRow ? colIdx * 0.15 : 0}
                  />
                );
              })}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

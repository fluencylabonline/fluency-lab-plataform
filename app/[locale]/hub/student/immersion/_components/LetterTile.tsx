"use client";

import { motion } from "framer-motion";
import { CellState } from "@/modules/immersion/immersion.types";
import { cn } from "@/lib/utils";

type LetterTileProps = {
  letter: string;
  state: CellState;
  filled?: boolean;
  animation?: "flip" | "pop" | "none";
  delay?: number;
  className?: string;
  ariaLabel?: string;
};

function bgForState(state: CellState, filled: boolean) {
  if (state === "correct")
    return "bg-emerald-500 text-white border-emerald-500";
  if (state === "present") return "bg-amber-500 text-white border-amber-500";
  if (state === "absent")
    return "bg-neutral-500 dark:bg-neutral-600 text-white border-neutral-500 dark:border-neutral-600";
  if (filled)
    return "border-neutral-500 dark:border-neutral-400 text-foreground";
  return "bg-transparent border-2 border-neutral-300 dark:border-neutral-700 text-foreground";
}

export function LetterTile({
  letter,
  state,
  filled = false,
  animation = "none",
  delay = 0,
  className,
  ariaLabel,
}: LetterTileProps) {
  const bgClasses = bgForState(state, filled);

  const animate =
    animation === "flip"
      ? { rotateX: [0, 90, 0] }
      : animation === "pop"
        ? { scale: [1, 1.1, 1] }
        : { scale: 1 };

  const transition =
    animation === "flip"
      ? { duration: 0.4, delay }
      : animation === "pop"
        ? { duration: 0.4 }
        : { duration: 0 };

  return (
    <motion.div
      initial={false}
      animate={animate}
      transition={transition}
      className={cn(
        "aspect-square w-full rounded-md flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase transition-colors duration-300",
        bgClasses,
        className
      )}
      role="img"
      aria-label={ariaLabel}
    >
      {letter}
    </motion.div>
  );
}

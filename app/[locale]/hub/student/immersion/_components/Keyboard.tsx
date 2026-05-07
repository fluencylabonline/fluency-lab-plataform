import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

import { CellState } from "@/modules/immersion/immersion.types";

type KeyState = CellState | "unknown";

type KeyboardProps = {
  onLetter: (ch: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  letterStates?: Record<string, KeyState>;
  disabled?: boolean;
  className?: string;
};

const rows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
];

function keyClass(state: KeyState) {
  if (state === "correct")
    return "bg-emerald-500 dark:bg-emerald-600 text-white border-transparent";
  if (state === "present")
    return "bg-amber-400 dark:bg-amber-500 text-white border-transparent";
  if (state === "absent")
    return "bg-muted-foreground/30 text-muted-foreground border-transparent opacity-40";
  return "bg-muted/50 dark:bg-muted/20 text-foreground border-border/50";
}

export function Keyboard({
  onLetter,
  onEnter,
  onBackspace,
  letterStates = {},
  disabled,
  className,
}: KeyboardProps) {
  return (
    <div
      className={twMerge("flex flex-col gap-2 sm:gap-2.5 w-full", className)}
    >
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="flex items-center justify-center gap-1.5 sm:gap-2 w-full"
        >
          {idx === 1 && <div className="flex-[0.5]"></div>}

          {row.map((key) => {
            const state = letterStates[key] || "unknown";
            const isAction = key === "enter" || key === "backspace";
            const content =
              key === "enter"
                ? "ENTER"
                : key === "backspace"
                  ? "⌫"
                  : key.toUpperCase();

            const flexWidth = isAction
              ? "flex-[1.5] max-w-[4.5rem]"
              : "flex-1 max-w-[4rem]";

            const base = `h-10 sm:h-14 ${flexWidth} rounded-md border font-bold text-[10px] sm:text-sm flex items-center justify-center select-none transition-all duration-300`;
            const cls = twMerge(base, keyClass(state));

            const handler =
              key === "enter"
                ? onEnter
                : key === "backspace"
                  ? onBackspace
                  : () => onLetter(key);

            const ariaLabel =
              key === "enter"
                ? "Enter"
                : key === "backspace"
                  ? "Apagar letra"
                  : `Letra ${key.toUpperCase()}`;

            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9 }}
                className={cls}
                type="button"
                onClick={disabled ? undefined : handler}
                disabled={disabled}
                aria-label={ariaLabel}
              >
                {content}
              </motion.button>
            );
          })}

          {idx === 1 && <div className="flex-[0.5]"></div>}
        </div>
      ))}
    </div>
  );
}

import { CellState } from "@/modules/immersion/immersion.types";

export function evaluateGuess(guess: string, target: string): CellState[] {
  const res: CellState[] = Array(target.length).fill("absent");
  const targetCounts: Record<string, number> = {};

  for (const ch of target) targetCounts[ch] = (targetCounts[ch] || 0) + 1;

  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) {
      res[i] = "correct";
      targetCounts[guess[i]] -= 1;
    }
  }

  for (let i = 0; i < target.length; i++) {
    if (res[i] !== "correct") {
      const ch = guess[i];
      if (targetCounts[ch] > 0) {
        res[i] = "present";
        targetCounts[ch] -= 1;
      }
    }
  }

  return res;
}

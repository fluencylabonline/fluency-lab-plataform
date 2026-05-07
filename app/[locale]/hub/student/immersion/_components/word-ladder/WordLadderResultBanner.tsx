"use client";

import { ImmersionButton } from "../ImmersionButton";

type WordLadderResultBannerProps = {
  status: "win" | "end";
  stepsCount: number;
  startWord: string;
  goalWord: string;
  onPlayAgain: () => void;
};

export function WordLadderResultBanner({
  status,
  stepsCount,
  startWord,
  goalWord,
  onPlayAgain,
}: WordLadderResultBannerProps) {

  const title = status === "win" ? "Você conseguiu!" : "Fim de jogo";
  const subtitle =
    status === "win"
      ? `Você chegou em ${goalWord.toUpperCase()} em ${stepsCount} passos.`
      : `Você não chegou em ${goalWord.toUpperCase()} a tempo.`;

  return (
    <div className="w-full flex flex-col items-center max-w-lg rounded-3xl border border-border/50 bg-background/80 backdrop-blur-md p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
      <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-border/50 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">
          Word Ladder
        </span>
        <h2 className="text-2xl font-black tracking-wide text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
        <p className="text-xs text-muted-foreground/80">
          {startWord.toUpperCase()} → {goalWord.toUpperCase()}
        </p>
      </div>

      <ImmersionButton className="h-12 font-bold mt-4" onClick={onPlayAgain}>
        Jogar novamente
      </ImmersionButton>
    </div>
  );
}

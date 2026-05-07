"use client";

import { ImmersionButton } from "../ImmersionButton";

type LyricsTrainingResultBannerProps = {
  score: number;
  streak: number;
  track: string;
  artist: string;
  onPlayAgain: () => void;
  onNewSong: () => void;
};

export function LyricsTrainingResultBanner({
  score,
  streak,
  track,
  artist,
  onPlayAgain,
  onNewSong,
}: LyricsTrainingResultBannerProps) {
  return (
    <div className="w-full flex flex-col items-center max-w-lg rounded-3xl border border-border/50 bg-background/80 backdrop-blur-md p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
      <div className="flex flex-col items-center justify-center space-y-2 pb-4 border-b border-border/50 text-center w-full">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">
          Lyrics Training
        </span>
        <h2 className="text-2xl font-black tracking-wide text-foreground">
          Você terminou!
        </h2>
        <p className="text-sm text-muted-foreground font-medium">
          {track ? track : "Música"} {artist ? `• ${artist}` : ""}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground/80 pt-1">
          <span>Pontos: {score}</span>
          <span>Maior streak: {streak}</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 pt-4">
        <ImmersionButton className="w-full h-12" onClick={onPlayAgain}>
          Jogar novamente
        </ImmersionButton>
        <ImmersionButton
          className="w-full h-12"
          tone="secondary"
          onClick={onNewSong}
        >
          Trocar música
        </ImmersionButton>
      </div>
    </div>
  );
}


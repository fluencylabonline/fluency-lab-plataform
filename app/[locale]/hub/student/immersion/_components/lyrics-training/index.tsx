"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Search,
  Music2,
  Flame,
  Lightbulb,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImmersionButton } from "../ImmersionButton";
import { Keyboard } from "../Keyboard";
import { LetterTile } from "../LetterTile";
import { useLyricsTrainingGame } from "./useLyricsTrainingGame";
import { cn } from "@/lib/utils";
import { LyricsTrainingResultBanner } from "./LyricsTrainingResultBanner";
import { Spinner } from "@/components/ui/spinner";
import { LyricsTrainingState } from "@/modules/immersion/immersion.types";



function normalizeWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}


interface LyricsTrainingGameProps {
  initialProgress: LyricsTrainingState | null;
}

export default function LyricsTrainingGame({ initialProgress }: LyricsTrainingGameProps) {
  const {
    loading,
    status,
    search,
    setSearch,
    searching,
    results,
    searchError,
    searchYouTube,
    chooseVideo,
    videoUrl,
    track,
    setTrack,
    artist,
    setArtist,
    pauseEvery,
    setPauseEvery,
    loadingLyrics,
    loadLyrics,
    playerContainerRef,
    isPlayerReady,
    isPlaying,
    togglePlay,
    replayLine,
    startGame,
    chooseAnotherSong,
    currentIndex,
    waitingInput,
    inputValue,
    setInputValue,
    blankWord,
    submitAnswer,

    hint,
    guessEvaluation,
    keyboardLetterStates,
    awaitingNext,
    continueAfterCorrect,
    score,
    streak,
    maskedLine,
  } = useLyricsTrainingGame({ initialProgress });



  if (loading || status === "loading") return <Spinner />;

  const maxLetters = blankWord
    ? normalizeWord(blankWord).length
    : (guessEvaluation?.length ?? 0);
  const normalizedInput = normalizeWord(inputValue).slice(0, maxLetters);
  const canConfirm =
    waitingInput && maxLetters > 0 && normalizedInput.length === maxLetters;
  const tilesDisabled =
    (!waitingInput && !awaitingNext) || isPlaying || !isPlayerReady;
  const tileStates =
    guessEvaluation && guessEvaluation.length === maxLetters
      ? guessEvaluation
      : Array.from({ length: maxLetters }, () => "empty" as const);
  const showNextButton = awaitingNext && !isPlaying;

  const onKeyboardLetter = (ch: string) => {
    if (tilesDisabled) return;
    setInputValue((prev) => {
      const used = normalizeWord(prev).length;
      if (used >= maxLetters) return prev;
      return prev + ch;
    });
  };

  const onKeyboardBackspace = () => {
    if (tilesDisabled) return;
    setInputValue((p) => p.slice(0, -1));
  };

  const onKeyboardEnter = () => {
    if (tilesDisabled) return;
    if (!canConfirm) return;
    submitAnswer();
  };

  return (
    <div className="container-padding space-y-4">
    

      <div>
        {videoUrl && status !== "setup" ? (
          <div className="mx-auto aspect-video w-[95vw] sm:w-[30vw] overflow-hidden rounded-xl bg-black mb-6 shadow-md border border-border/40">
            <div ref={playerContainerRef} className="w-full h-full" />
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {/* ESTADO: SETUP */}
          {status === "setup" ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium pl-1">Buscar Vídeo</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Digite o nome da música ou artista..."
                    className="h-12 rounded-2xl bg-muted/30"
                    onKeyDown={(e) => e.key === "Enter" && searchYouTube()}
                  />
                  <Button
                    onClick={searchYouTube}
                    disabled={searching || !search.trim()}
                    variant="default"
                    className="h-12 w-12 rounded-2xl shrink-0"
                  >
                    {searching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {searchError ? (
                <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-xl">
                  {searchError}
                </div>
              ) : null}

              {results.length ? (
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((item) => (
                    <button
                      key={String(item.videoId)}
                      className="w-full flex items-center gap-3 rounded-2xl border border-border/40 bg-background hover:bg-muted/50 transition-all p-2 text-left group"
                      onClick={() => chooseVideo(item)}
                      type="button"
                    >
                      <div className="relative w-20 h-14 shrink-0 overflow-hidden rounded-xl bg-muted group-hover:shadow-sm transition-shadow">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={String(item.title || "Vídeo")}
                            fill
                            className="object-cover"
                            sizes="160x90"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                          {String(item.title || "")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {String(item.channelTitle || "")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground/60 text-center py-8 border-2 border-dashed border-border/50 rounded-2xl">
                  Procure uma música e selecione um vídeo.
                </div>
              )}

              {videoUrl ? (
                <div className="space-y-5 pt-5 border-t border-border/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground pl-1">
                        Nome da Faixa
                      </label>
                      <Input
                        value={track}
                        onChange={(e) => setTrack(e.target.value)}
                        placeholder="Ex: Shape of You"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground pl-1">
                        Artista
                      </label>
                      <Input
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="Ex: Ed Sheeran"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 bg-muted/20 p-3 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Music2 className="w-4 h-4 text-primary" />
                      Pausar a cada:
                    </div>
                    <div className="flex gap-1.5 bg-muted/50 p-1 rounded-full">
                      <Button
                        variant={pauseEvery === 1 ? "default" : "ghost"}
                        size="sm"
                        className="rounded-full h-8 px-4 text-xs transition-all"
                        onClick={() => setPauseEvery(1)}
                      >
                        1 linha
                      </Button>
                      <Button
                        variant={pauseEvery === 2 ? "default" : "ghost"}
                        size="sm"
                        className="rounded-full h-8 px-4 text-xs transition-all"
                        onClick={() => setPauseEvery(2)}
                      >
                        2 linhas
                      </Button>
                    </div>
                  </div>

                  <ImmersionButton
                    className="w-full h-12 text-base font-semibold"
                    onClick={loadLyrics}
                    disabled={loadingLyrics || !track.trim() || !artist.trim()}
                  >
                    {loadingLyrics ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando
                        letra...
                      </span>
                    ) : (
                      "Carregar letra"
                    )}
                  </ImmersionButton>
                </div>
              ) : null}
            </motion.div>
          ) : null}

          {/* ESTADO: READY */}
          {status === "ready" ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 py-3 p-8 flex flex-col items-center"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Tudo Pronto
                </span>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-wide leading-tight">
                    {track || "Música"}
                  </h2>
                  {artist && <p className="text-muted-foreground">{artist}</p>}
                </div>
                <div className="text-sm text-muted-foreground max-w-sm mt-2">
                  Prepare-se! Clique em iniciar, ouça com atenção e digite as
                  palavras que faltam.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <ImmersionButton
                  className="flex-1 h-12 text-lg"
                  onClick={() => startGame(currentIndex, true)}
                  disabled={!isPlayerReady}
                >
                  {isPlayerReady ? (
                    "Iniciar"
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                </ImmersionButton>
                <ImmersionButton
                  className="h-12 sm:w-32"
                  tone="secondary"
                  onClick={() => chooseAnotherSong()}
                >
                  Trocar
                </ImmersionButton>
              </div>
            </motion.div>
          ) : null}

          {/* ESTADO: PLAYING */}
          {status === "playing" ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 px-2"
            >
              {/* Header do Jogo (Score & Controles) */}
              <div className="flex flex-row items-center justify-center gap-3">
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1.5 rounded-full text-sm font-semibold"
                  >
                    Pontos: <span className="text-primary ml-1">{score}</span>
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5"
                  >
                    <Flame
                      className={cn(
                        "w-4 h-4",
                        streak > 2 ? "text-orange-500" : "text-muted-foreground"
                      )}
                    />
                    {streak}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 bg-muted/40 rounded-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-9 h-9 hover:bg-background shadow-sm"
                    onClick={togglePlay}
                    disabled={!isPlayerReady || awaitingNext}
                    title={isPlaying ? "Pausar" : "Tocar"}
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3 ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-9 h-9 hover:bg-background shadow-sm"
                    onClick={replayLine}
                    disabled={!isPlayerReady}
                    title="Repetir frase"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-9 h-9 hover:bg-background shadow-sm"
                    onClick={hint}
                    disabled={!isPlayerReady || !waitingInput || !blankWord}
                    title="Dica"
                  >
                    <Lightbulb className="w-3 h-3 text-yellow-500" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-9 h-9 hover:bg-background shadow-sm"
                    onClick={chooseAnotherSong}
                    disabled={!isPlayerReady}
                    title="Trocar música"
                  >
                    <Music2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Área da Letra */}
              <div className="rounded-2xl border border-border/50 bg-muted/30 shadow-inner text-center min-h-[120px] flex flex-col justify-center transition-all">
                <div className="text-xs sm:text-sm text-primary font-bold uppercase tracking-widest mb-2 opacity-80">
                  {track || "Música"} {artist ? `• ${artist}` : ""}
                </div>
                <div className="text-lg sm:text-2xl font-black text-foreground/90">
                  <span>
                    {maskedLine.before ? `${maskedLine.before} ` : ""}
                  </span>

                  {maskedLine.blank ? (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center align-middle mx-1",
                        tilesDisabled && "opacity-60 transition-opacity"
                      )}
                      aria-disabled={tilesDisabled}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5",
                          tilesDisabled && "pointer-events-none"
                        )}
                      >
                        {Array.from({ length: maxLetters }).map((_, idx) => {
                          const ch = normalizedInput[idx]?.toUpperCase() ?? "";
                          const st = tileStates[idx] ?? "empty";
                          return (
                            <span key={idx} className="w-6 sm:w-8">
                              <LetterTile
                                letter={ch}
                                state={st}
                                filled={!!ch && st === "empty"}
                                ariaLabel={`Letra ${idx + 1}`}
                              />
                            </span>
                          );
                        })}
                      </span>
                    </span>
                  ) : null}

                  <span>{maskedLine.after ? ` ${maskedLine.after}` : ""}</span>
                </div>
              </div>

              {/* Rodapé do Jogo (Aviso/Teclado/Próximo) */}
              <div className="min-h-[220px] flex flex-col">
                {showNextButton ? (
                  <div className="mt-auto flex justify-center pb-2 pt-6">
                    <Button
                      variant="default"
                      size="lg"
                      className="rounded-full px-8 h-12 text-base font-semibold shadow-lg animate-in fade-in zoom-in-95"
                      onClick={continueAfterCorrect}
                      disabled={!isPlayerReady}
                    >
                      Continuar para o próximo <Play className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : waitingInput ? (
                  <div className="mt-auto pb-2">
                    <Keyboard
                      onLetter={onKeyboardLetter}
                      onEnter={onKeyboardEnter}
                      onBackspace={onKeyboardBackspace}
                      letterStates={keyboardLetterStates}
                      disabled={tilesDisabled}
                    />
                  </div>
                ) : (
                  <div className="mt-auto mb-2 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground bg-muted/30 px-6 py-3 rounded-full border border-border/40">
                      <div className="flex gap-1">
                        <span
                          className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      Ouvindo... aguarde a próxima lacuna.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}

          {/* ESTADO: FINISHED */}
          {status === "finished" ? (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center py-4"
            >
              <LyricsTrainingResultBanner
                score={score}
                streak={streak}
                track={track}
                artist={artist}
                onPlayAgain={() => startGame()}
                onNewSong={() => chooseAnotherSong()}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Settings2, Undo2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Keyboard } from "../Keyboard";
import { WordLadderBoard } from "./WordLadderBoard";
import { WordLadderOptionsModal } from "./WordLadderOptionsModal";
import { Spinner } from "@/components/ui/spinner";
import { ImmersionButton } from "../ImmersionButton";
import { ImmersionGameHeader } from "../ImmersionGameHeader";
import { LanguageSelect } from "../LanguageSelect";
import { useWordLadderGame, WordLadderGameProps } from "./useWordLadderGame";
import { WordDetailsModal } from "../WordDetailsModal";

export default function WordLadderGame(props: WordLadderGameProps) {
  const {
    loading,
    status,
    selectedLang,

    langOptions,
    length,
    startWord,
    goalWord,
    steps,
    current,
    evaluations,
    letterStates,
    enter,
    onLetter,
    onBackspace,
    startNewGame,
    hint,
    revealSolution,
    hasSolution,
    learningMode,
    setLearningMode,
    learningWord,
    shaking,
    undo,
    canUndo,
    difficulty,
    setDifficulty,
  } = useWordLadderGame(props);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Spinner />
    </div>
  );

  if (!startWord || !goalWord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="text-3xl">🧩</div>
        <div className="text-muted-foreground font-medium">
          Poucas palavras no seu vocabulário para gerar um desafio.
        </div>
        <ImmersionButton 
          variant="outline"
          onClick={() => startNewGame(selectedLang)}
          className="mt-2"
        >
          Tentar Novamente
        </ImmersionButton>
      </div>
    );
  }

  const finished = status === "win" || status === "end";

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto overflow-hidden">
      <ImmersionGameHeader className="px-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
            Idioma:
          </span>
          <LanguageSelect
            value={selectedLang}
            options={langOptions}
            onChange={(l) => startNewGame(l)}
            disabled={loading}
          />
        </div>

        <button 
          onClick={() => setOptionsOpen(true)}
          className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <Settings2 className="w-5 h-5 text-muted-foreground" />
        </button>
      </ImmersionGameHeader>

      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
        <Carousel
          className="w-full"
          opts={{
            watchDrag: !!finished,
            loop: false,
          }}
        >
          <CarouselContent>
            {/* Slide 1: Board + Teclado */}
            <CarouselItem className="w-full flex flex-col items-center min-h-[calc(100dvh-200px)]">
              <div className="flex-1 flex items-center justify-center w-full py-4">
                <WordLadderBoard
                  length={length}
                  steps={steps}
                  current={current}
                  goalWord={goalWord}
                  evaluations={evaluations}
                  finished={finished}
                  shaking={shaking}
                />
              </div>

              <div className="w-full px-2 pb-6 mt-auto">
                <AnimatePresence mode="wait">
                  {!finished ? (
                    <motion.div
                      key="keyboard"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col gap-2">
                        {canUndo && (
                          <div className="flex justify-end px-2">
                            <button
                              onClick={() => undo()}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-xs font-medium border border-border/50"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Desfazer
                            </button>
                          </div>
                        )}
                        <Keyboard
                          onLetter={onLetter}
                          onEnter={enter}
                          onBackspace={onBackspace}
                          letterStates={letterStates}
                          disabled={!!finished}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="swipe-hint"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="mx-auto flex items-center gap-3 text-muted-foreground bg-muted/40 px-4 py-2 rounded-full border border-border/50 animate-pulse cursor-pointer"
                    >
                      <span className="text-sm font-medium">
                        Deslize para ver o resultado
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CarouselItem>

            {/* Slide 2: Resultados */}
            {finished && (
              <CarouselItem className="w-full flex flex-col items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-sm flex flex-col items-center gap-6"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={`text-6xl mb-2 animate-bounce`}>
                      {status === "win" ? "🎉" : "🥺"}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">
                      {status === "win" ? "Parabéns!" : "Fim de jogo"}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                      {status === "win" 
                        ? `Você completou a escada em ${steps.length - 1} passos!` 
                        : "Você não conseguiu chegar ao objetivo."}
                    </p>
                    
                    <div className="mt-2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Início</span>
                        <span className="text-xl font-black tracking-widest text-primary uppercase">{startWord}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary/40" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Objetivo</span>
                        <span className="text-xl font-black tracking-widest text-primary uppercase">{goalWord}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-3 mt-4">
                    {status === "end" && (
                      <ImmersionButton
                        variant="outline"
                        className="w-full h-14 rounded-2xl font-bold text-lg border-2"
                        onClick={() => undo()}
                      >
                        <Undo2 className="w-5 h-5 mr-2" />
                        Desfazer último passo
                      </ImmersionButton>
                    )}
                    
                    <ImmersionButton
                      className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
                      onClick={() => startNewGame(selectedLang)}
                    >
                      Jogar Novamente
                    </ImmersionButton>
                    
                    <button
                      onClick={() => setDetailsOpen(true)}
                      className="w-full h-12 rounded-2xl font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                    >
                      📖 Ver detalhes da palavra
                    </button>
                  </div>
                </motion.div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
      </div>

      <WordLadderOptionsModal
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        learningMode={learningMode}
        setLearningMode={setLearningMode}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onHint={hint}
        onReveal={revealSolution}
        canHint={!finished && !!hasSolution}
        canReveal={!finished && !!hasSolution}
      />

      <WordDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        word={learningWord || goalWord}
        lang={selectedLang}
        onPlayAgain={() => startNewGame(selectedLang)}
      />
    </div>
  );
}

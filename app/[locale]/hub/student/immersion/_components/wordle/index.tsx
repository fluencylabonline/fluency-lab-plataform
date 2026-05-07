"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Keyboard } from "../Keyboard";
import { WordleBoard } from "./WordleBoard";
import { WordDetailsModal } from "../WordDetailsModal";
import { WordleHistoryModal } from "./WordleHistoryModal";
import { useWordleGame, WordleGameProps } from "./useWordleGame";
import { Spinner } from "@/components/ui/spinner";
import { ImmersionButton } from "../ImmersionButton";
import { Header } from "@/components/layout/header";
import { History } from "lucide-react";
import { LanguageSelect } from "../LanguageSelect";

export default function WordleGame(props: WordleGameProps) {
  const {
    loading,
    target,
    guesses,
    current,
    finished,
    selectedLang,
    maxAttempts,
    length,
    evaluations,
    letterStates,
    enter,
    startNewGame,
    onLetter,
    onBackspace,
    shaking,
    historyOpen,
    setHistoryOpen,
    detailsOpen,
    setDetailsOpen,
    historyEntries,
    availableLangs,
    openDetails,
  } = useWordleGame(props);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Spinner />
    </div>
  );

  const headerActions = [
    {
      component: (
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Idioma:
          </span>
          <LanguageSelect
            value={selectedLang}
            options={availableLangs}
            onChange={(l) => startNewGame(l)}
            disabled={loading}
          />
        </div>
      )
    },
    {
      icon: <History className="w-5 h-5" />,
      onClick: () => setHistoryOpen(true),
      label: "Histórico",
      className: "rounded-full"
    }
  ];

  if (!target) {
    return (
      <div>
        <Header 
          title="Wordle" 
          backHref="/hub/student/immersion"
          actions={headerActions}
        />
        <div className="container flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
          <div className="text-3xl">🧩</div>
          <div className="text-muted-foreground font-medium">
            Sem palavras disponíveis no seu vocabulário.
          </div>
          <ImmersionButton 
            variant="outline"
            onClick={() => startNewGame(selectedLang)}
            className="mt-2"
          >
            Tentar Novamente
          </ImmersionButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Wordle" 
        backHref="/hub/student/immersion"
        actions={headerActions}
      />

      <div className="container flex-1 flex flex-col items-center justify-center overflow-hidden">
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
                <WordleBoard
                  maxAttempts={maxAttempts}
                  length={length}
                  guesses={guesses}
                  current={current}
                  finished={finished}
                  evaluations={evaluations}
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
                      <Keyboard
                        onLetter={onLetter}
                        onEnter={enter}
                        onBackspace={onBackspace}
                        letterStates={letterStates}
                        disabled={!!finished}
                      />
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
                      {finished === "win" ? "🎉" : "🥺"}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">
                      {finished === "win" ? "Parabéns!" : "Que pena..."}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                      {finished === "win" 
                        ? `Você acertou a palavra em ${guesses.length} ${guesses.length === 1 ? 'tentativa' : 'tentativas'}!` 
                        : "Não foi desta vez. A palavra era:"}
                    </p>
                    
                    <div className="mt-2 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20">
                      <span className="text-3xl font-black tracking-[0.3em] text-primary uppercase">
                        {target.word}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-3 mt-4">
                    <ImmersionButton
                      className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
                      onClick={() => startNewGame(selectedLang)}
                    >
                      Jogar Novamente
                    </ImmersionButton>
                    
                    <button
                      onClick={openDetails}
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

      {/* Vaults */}
      <WordleHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        entries={historyEntries}
      />

      <WordDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        word={target.word}
        lang={(target.lang || selectedLang || "en").toLowerCase()}
        onPlayAgain={() => startNewGame(selectedLang)}
      />
    </div>
  );
}

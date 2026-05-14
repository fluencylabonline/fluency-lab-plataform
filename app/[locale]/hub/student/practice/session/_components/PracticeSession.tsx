"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/components/ui/toaster";

import { PracticeHeader } from "./PracticeHeader";
import { FlashcardExercise } from "./FlashcardExercise";
import { GapFillExercise } from "./GapFillExercise";
import { UnscrambleExercise } from "./UnscrambleExercise";
import { QuizExercise } from "./QuizExercise";
import { ListeningChoiceExercise } from "./ListeningChoiceExercise";
import { FeedbackSheet } from "./FeedbackSheet";
import { PracticeSummary } from "./PracticeSummary";
import { PracticeExitVault } from "./PracticeExitVault";

import { processSessionResultsAction } from "@/modules/learning/learning.actions";
import { queuePracticeResult, flushPracticeQueue } from "@/modules/learning/learning.offline";

import type { PracticeItem, PracticeResult, DailyPracticeSession } from "@/modules/learning/learning.types";

interface PracticeSessionProps {
  session: DailyPracticeSession;
  planId: string;
  currentStreak: number;
  isReplay?: boolean;
}

type FeedbackState = {
  isOpen: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
  grade?: number;
};

const SLIDE_VARIANTS = {
  enter: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

export function PracticeSession({ session, planId, currentStreak, isReplay = false }: PracticeSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>({ isOpen: false, isCorrect: false });
  const [isCompleted, setIsCompleted] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExitVaultOpen, setIsExitVaultOpen] = useState(false);

  const items = session.items;
  const currentItem = items[currentIndex];
  const progress = items.length > 0 ? (currentIndex / items.length) * 100 : 0;

  // Flush offline queue on mount (if online)
  useEffect(() => {
    if (navigator.onLine) {
      flushPracticeQueue().catch(console.error);
    }
  }, []);

  const recordResult = useCallback(async (result: PracticeResult) => {
    setResults((prev) => [...prev, result]);

    if (!navigator.onLine) {
      await queuePracticeResult({
        itemId: result.itemId,
        lessonId: result.lessonId,
        grade: result.grade,
        type: result.type,
        timestamp: result.timestamp,
      });
    }
  }, []);

  const finishSession = useCallback(async () => {
    setIsProcessing(true);
    try {
      const res = await processSessionResultsAction({
        planId,
        results: results.map((r) => ({
          itemId: r.itemId,
          lessonId: r.lessonId,
          grade: r.grade,
          type: r.type,
          timestamp: r.timestamp,
        })),
        isReplay,
        streak: currentStreak,
      });

      if (res?.data) {
        setXpGained(res.data.xpGained ?? 0);
      }
    } catch {
      notify.error("Erro ao salvar sessão. Tente novamente.");
    } finally {
      setIsProcessing(false);
      setIsCompleted(true);
    }
  }, [planId, results, isReplay, currentStreak]);

  const closeFeedback = useCallback(() => {
    setFeedback({ isOpen: false, isCorrect: false });
    setDirection(1);

    const isLast = currentIndex >= items.length - 1;
    if (isLast) {
      finishSession();
    } else {
      setCurrentIndex((p) => p + 1);
    }
  }, [currentIndex, items.length, finishSession]);

  // ── Handlers per exercise type ──────────────────────────────────────

  const handleFlashcardResult = useCallback(async (grade: 0 | 1 | 3 | 4 | 5) => {
    if (!currentItem) return;
    await recordResult({
      itemId: currentItem.id,
      lessonId: currentItem.lessonId,
      grade,
      type: currentItem.type,
      timestamp: new Date(),
    });
    setFeedback({ isOpen: true, isCorrect: grade >= 3, grade });
  }, [currentItem, recordResult]);

  const handleBinaryResult = useCallback(async (isCorrect: boolean, correctAnswer?: string, explanation?: string) => {
    if (!currentItem) return;
    const grade = isCorrect ? (5 as const) : (1 as const);
    await recordResult({
      itemId: currentItem.id,
      lessonId: currentItem.lessonId,
      grade,
      type: currentItem.type,
      timestamp: new Date(),
    });
    setFeedback({ isOpen: true, isCorrect, correctAnswer, explanation });
  }, [currentItem, recordResult]);

  const handleListeningScore = useCallback(async (score: number) => {
    if (!currentItem) return;
    const grade = (Math.round(Math.min(5, Math.max(0, score))) as 0 | 1 | 3 | 4 | 5);
    await recordResult({
      itemId: currentItem.id,
      lessonId: currentItem.lessonId,
      grade,
      type: currentItem.type,
      timestamp: new Date(),
    });
    setFeedback({ isOpen: true, isCorrect: grade >= 3, grade });
  }, [currentItem, recordResult]);

  // ── Derived summary stats ─────────────────────────────────────────

  const accuracy = results.length > 0
    ? (results.filter((r) => r.grade >= 3).length / results.length) * 100
    : 0;

  // ── Render: Summary ────────────────────────────────────────────────

  if (isCompleted) {
    return (
      <PracticeSummary
        xpGained={xpGained}
        streak={currentStreak}
        accuracy={accuracy}
        onGoBack={() => router.push("/hub/student/practice")}
      />
    );
  }

  // ── Render: Loading state ──────────────────────────────────────────

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground animate-pulse">Salvando sessão...</p>
      </div>
    );
  }

  // ── Render: Exercise ───────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PracticeHeader
        progress={progress}
        streak={currentStreak}
        onClose={() => setIsExitVaultOpen(true)}
      />

      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-32 px-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="w-full max-w-2xl"
          >
            {renderExercise(currentItem, {
              onFlashcard: handleFlashcardResult,
              onBinary: handleBinaryResult,
              onListening: handleListeningScore,
            }, session.language)}
          </motion.div>
        </AnimatePresence>
      </main>

      <FeedbackSheet
        isOpen={feedback.isOpen}
        isCorrect={feedback.isCorrect}
        correctAnswer={feedback.correctAnswer}
        explanation={feedback.explanation}
        grade={feedback.grade}
        onContinue={closeFeedback}
      />

      <PracticeExitVault
        isOpen={isExitVaultOpen}
        onOpenChange={setIsExitVaultOpen}
        onConfirm={() => router.push("/hub/student/practice")}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type Handlers = {
  onFlashcard: (grade: 0 | 1 | 3 | 4 | 5) => void;
  onBinary: (isCorrect: boolean, correctAnswer?: string, explanation?: string) => void;
  onListening: (score: number) => void;
};

function renderExercise(item: PracticeItem, handlers: Handlers, language?: string) {
  if (!item) return null;

  switch (item.renderMode) {
    case "flashcard_visual":
    case "flashcard_recall":
      if (!item.flashcard) return null;
      return (
        <FlashcardExercise
          front={item.flashcard.front}
          back={item.flashcard.back}
          imageUrl={item.renderMode === "flashcard_visual" ? item.flashcard.imageUrl : null}
          useTTS={item.flashcard.useTTS ?? true}
          language={language}
          onResult={handlers.onFlashcard}
        />
      );

    case "gap_fill_listening":
      if (!item.gapFill) return null;
      return (
        <GapFillExercise
          sentenceWithGap={item.gapFill.sentenceWithGap}
          correctAnswer={item.gapFill.correctAnswer}
          fullSentenceForTTS={item.gapFill.fullSentenceForTTS}
          language={language}
          onComplete={(isCorrect) =>
            handlers.onBinary(isCorrect, isCorrect ? undefined : item.gapFill!.correctAnswer)
          }
        />
      );

    case "sentence_unscramble":
      if (!item.unscramble) return null;
      return (
        <UnscrambleExercise
          scrambledWords={item.unscramble.scrambledWords}
          correctOrder={item.unscramble.correctOrder}
          onComplete={(isCorrect) =>
            handlers.onBinary(isCorrect, isCorrect ? undefined : item.unscramble!.correctOrder.join(" "))
          }
        />
      );

    case "quiz_comprehensive":
      if (!item.quiz) return null;
      return (
        <QuizExercise
          {...item.quiz}
          language={language}
          onComplete={(isCorrect) =>
            handlers.onBinary(isCorrect, item.quiz!.options[item.quiz!.correctIndex], item.quiz!.explanation)
          }
        />
      );

    case "listening_choice":
      if (!item.interactiveListening) {
        // Fallback: render as quiz if interactiveListening data is missing
        if (item.quiz) {
          return (
            <QuizExercise
              {...item.quiz}
              language={language}
              onComplete={(isCorrect) =>
                handlers.onBinary(isCorrect, item.quiz!.options[item.quiz!.correctIndex], item.quiz!.explanation)
              }
            />
          );
        }
        return null;
      }
      return (
        <ListeningChoiceExercise
          audioUrl={item.interactiveListening.audioUrl}
          transcriptSegments={item.interactiveListening.transcriptSegments}
          learningItems={item.interactiveListening.learningItems}
          onComplete={handlers.onListening}
        />
      );

    default:
      return null;
  }
}

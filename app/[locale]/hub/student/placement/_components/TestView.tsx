"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "./AudioPlayer";
import { useTranslations } from "next-intl";
import { usePlacementSound } from "@/hooks/ui/use-placement-sound";
import { Question } from "@/modules/placement/placement.schema";
import { UnscrambleView } from "./UnscrambleView";

interface TestViewProps {
  currentQuestion: Question;
  answeredCount: number;
  totalQuestions: number;
  selectedOption: string;
  onOptionSelect: (value: string) => void;
  onAnswer: () => void;
  onContinue: () => void;
  onSkip: () => void;
  onExit: () => void;
  isSubmitting: boolean;
  feedback: { isCorrect: boolean; correctAnswer?: string } | null;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export const TestView = ({
  currentQuestion,
  answeredCount,
  totalQuestions,
  selectedOption,
  onOptionSelect,
  onAnswer,
  onContinue,
  onSkip,
  onExit,
  isSubmitting,
  feedback,
}: TestViewProps) => {
  const t = useTranslations("Placement");
  const { playSound } = usePlacementSound();

  const progress = (answeredCount / totalQuestions) * 100;

  const handleOptionSelect = (value: string) => {
    playSound("click");
    onOptionSelect(value);
  };

  const handleSkip = () => {
    playSound("pop");
    onSkip();
  };

  const handleExit = () => {
    playSound("pop");
    onExit();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl h-full mx-auto p-4">
      <div className="w-full flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-accent"
          onClick={handleExit}
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
          <div className="absolute top-1 left-2 h-1.5 w-full bg-white/20 rounded-full" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex-1 flex flex-col"
        >
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              {currentQuestion.metadata?.mediaUrl && (
                <AudioPlayer
                  key={currentQuestion.metadata.mediaUrl}
                  url={currentQuestion.metadata.mediaUrl}
                  startTime={currentQuestion.metadata.audioRange?.start}
                  endTime={currentQuestion.metadata.audioRange?.end}
                />
              )}

              <h2 className="text-2xl md:text-3xl font-black text-foreground text-center leading-tight">
                {currentQuestion.content}
              </h2>
              {currentQuestion.context && currentQuestion.type !== "unscramble" && (
                <p className="mt-4 text-center text-muted-foreground font-medium text-lg italic">
                  &quot;{currentQuestion.context}&quot;
                </p>
              )}
            </div>

            {currentQuestion.type === "unscramble" ? (
              <UnscrambleView
                key={currentQuestion.id}
                words={currentQuestion.metadata?.unscrambleData?.words || []}
                correctSentence={currentQuestion.context || ""}
                onComplete={() => { }}
                onChange={(sentence) => {
                  onOptionSelect(sentence);
                }}
              />
            ) : currentQuestion.type === "writing" ? (
              <div className="w-full max-w-2xl mx-auto space-y-4">
                <Textarea
                  placeholder={t("typeYourAnswer") || "Digite sua resposta aqui..."}
                  value={selectedOption}
                  onChange={(e) => onOptionSelect(e.target.value)}
                  className="min-h-[150px] text-xl p-6 rounded-2xl border-2 border-b-4 focus-visible:ring-indigo-500 font-medium"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {t("writingHint") || "Dica: Preste atenção à ortografia e pontuação."}
                </p>
              </div>
            ) : (
              <RadioGroup
                value={selectedOption}
                onValueChange={handleOptionSelect}
                className="grid gap-3 max-w-2xl mx-auto w-full"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-3"
                >
                  {(currentQuestion.options as { id: string, text: string }[]).map((option, idx) => {
                    const isSelected = selectedOption === option.id;
                    return (
                      <motion.div key={option.id} variants={itemVariants}>
                        <div className="relative">
                          <RadioGroupItem
                            value={option.id}
                            id={`opt-${idx}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`opt-${idx}`}
                            className={`
                                flex items-center p-4 md:p-5 rounded-2xl border-2 border-b-4 cursor-pointer transition-all active:scale-[0.98] w-full
                                ${isSelected
                                ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                : "border-slate-200 dark:border-gray-800 bg-card hover:bg-accent hover:border-slate-300 text-foreground"
                              }
                            `}
                          >
                            <div
                              className={`
                                flex items-center justify-center w-8 h-8 rounded-lg border-2 mr-4 font-bold text-sm
                                ${isSelected
                                  ? "border-indigo-400 text-indigo-400"
                                  : "border-slate-200 dark:border-gray-700 text-slate-300"
                                }
                            `}
                            >
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span className="font-bold text-lg md:text-xl flex-1">
                              {option.text}
                            </span>
                          </Label>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </RadioGroup>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="w-full py-6 mt-auto flex flex-col md:flex-row gap-4">
        <Button
          variant="ghost"
          className="w-full md:w-auto font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest"
          onClick={handleSkip}
          disabled={isSubmitting || !!feedback}
        >
          {t("skip") || "Skip"}
        </Button>
        <Button
          onClick={onAnswer}
          disabled={!selectedOption || isSubmitting || !!feedback}
          className={`
            flex-1 min-h-14 text-xl font-black uppercase tracking-wider rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all text-white
            ${selectedOption
              ? "bg-green-500 hover:bg-green-600 border-green-700"
              : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-900 text-gray-400"
            }
          `}
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            t("check") || "Check"
          )}
        </Button>
      </div>

      {/* Feedback Bar (Duolingo Style) */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 left-0 right-0 p-6 md:p-8 z-50 border-t-2 ${feedback.isCorrect
              ? "bg-green-100 border-green-200 dark:bg-green-900 dark:border-green-800"
              : "bg-red-100 border-red-200 dark:bg-red-800 dark:border-red-700"
              }`}
          >
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left w-full">
                <div className={`p-3 rounded-2xl ${feedback.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}>
                  {feedback.isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`text-2xl font-black ${feedback.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                    }`}>
                    {feedback.isCorrect
                      ? (t("correct") || "Awesome!")
                      : (t("incorrect") || "Incorrect")}
                  </h3>
                  {!feedback.isCorrect && feedback.correctAnswer && (
                    <div className="mt-1">
                      <p className="text-red-600 dark:text-red-300 font-bold">{t("correctSolution") || "Correct solution:"}</p>
                      <p className="text-red-700 dark:text-red-400 font-medium">{feedback.correctAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={onContinue}
                className={`w-full md:w-64 h-14 text-xl font-black uppercase tracking-wider rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all text-white ${feedback.isCorrect
                  ? "bg-green-500 hover:bg-green-600 border-green-700"
                  : "bg-red-500 hover:bg-red-600 border-red-700"
                  }`}
              >
                {answeredCount === totalQuestions - 1 ? (t("finishTest") || "Finish") : (t("continue") || "Continue")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

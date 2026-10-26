"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2, Flame, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Question {
  section: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

/** Design 430x900: sessão de prática, igual à do app (header com progresso, opções A/B/C e FeedbackSheet). */
export function PracticeQuizPhone() {
  const t = useTranslations("LandingShowcase.PracticeQuiz");
  const QUESTIONS = t.raw("questions") as Question[];
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const q = QUESTIONS[idx];
  const submitted = selected !== null;
  const isCorrect = selected === q.correct;
  const progress = ((idx + (submitted ? 1 : 0)) / QUESTIONS.length) * 100;

  const next = () => {
    setSelected(null);
    setIdx((i) => (i + 1) % QUESTIONS.length);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-background text-foreground pt-12 overflow-hidden select-none">
      <header className="flex items-center gap-2 p-2 px-3 border-b border-border">
        <span className="shrink-0 p-2 rounded-full">
          <X className="w-5 h-5 text-muted-foreground" />
        </span>
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-green-500 rounded-full relative"
            animate={{ width: `${Math.max(progress, 6)}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
          >
            <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
          </motion.div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          <span className="text-base font-bold text-orange-500">12</span>
        </div>
      </header>

      <div className="flex-1 px-6 pt-10 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">
              {q.section}
            </div>
            <h2 className="text-2xl font-bold text-center">{q.question}</h2>
            <div className="grid gap-3 pt-2">
              {q.options.map((option, i) => (
                <Button
                  key={option}
                  variant="outline"
                  disabled={submitted}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "h-auto py-5 px-5 text-lg justify-start text-left whitespace-normal transition-all",
                    selected === i && i === q.correct && "border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500 text-green-800 dark:text-green-300",
                    selected === i && i !== q.correct && "border-rose-500 bg-rose-50 dark:bg-rose-950/30 ring-2 ring-rose-500 text-rose-800 dark:text-rose-300",
                    !submitted && "hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <span
                    className={cn(
                      "mr-3 font-mono text-sm border rounded-full w-8 h-8 shrink-0 flex items-center justify-center",
                      selected === i && i === q.correct && "border-green-500 bg-green-200 text-green-800",
                      selected === i && i !== q.correct && "border-rose-500 bg-rose-200 text-rose-800",
                      !submitted && "text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{option}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "absolute bottom-0 inset-x-0 p-6 border-t-2",
              isCorrect
                ? "bg-green-100 border-green-200 dark:bg-green-950 dark:border-green-900"
                : "bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-900"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn("p-2 rounded-full bg-white/70 shrink-0", isCorrect ? "text-green-600" : "text-rose-600")}>
                {isCorrect ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
              </div>
              <div className="flex flex-col">
                <h3 className={cn("text-xl font-bold", isCorrect ? "text-green-800 dark:text-green-400" : "text-rose-800 dark:text-rose-400")}>
                  {isCorrect ? t("correct") : t("incorrect")}
                </h3>
                {!isCorrect && (
                  <p className="text-rose-700 dark:text-rose-300 text-sm mt-1">
                    {t("correctAnswer")} <span className="font-semibold">{q.options[q.correct]}</span>
                  </p>
                )}
                <p className="text-sm mt-2 text-muted-foreground border-l-2 border-current pl-2 italic">
                  {q.explanation}
                </p>
              </div>
            </div>
            <Button
              onClick={next}
              className={cn(
                "w-full mt-5 py-6 text-base font-bold uppercase tracking-wider rounded-md border-transparent text-white active:shadow-none active:translate-y-1 transition-all",
                isCorrect
                  ? "bg-green-500 hover:bg-green-600 shadow-[0_4px_0_0_#15803d]"
                  : "bg-rose-500 hover:bg-rose-600 shadow-[0_4px_0_0_#be123c]"
              )}
            >
              {t("continue")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

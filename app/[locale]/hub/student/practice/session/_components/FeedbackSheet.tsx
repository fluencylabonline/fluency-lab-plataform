"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RotateCw, ThumbsUp, Medal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedbackSheetProps {
  isOpen: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
  grade?: number;
  onContinue: () => void;
}

type FeedbackConfig = {
  title: string;
  message: string | null;
  colorKey: "rose" | "amber" | "indigo" | "emerald" | "green" | "slate";
  icon: React.ReactNode;
  buttonText: string;
};

function getFeedbackConfig(grade?: number, isCorrect?: boolean): FeedbackConfig {
  if (grade !== undefined) {
    if (grade <= 2) return { title: "Continue praticando!", message: "Revisar é o caminho para a fluência.", colorKey: "rose", icon: <RotateCw size={28} />, buttonText: "Continuar" };
    if (grade === 3) return { title: "Bom esforço!", message: "A prática leva à perfeição.", colorKey: "amber", icon: <ThumbsUp size={28} />, buttonText: "Continuar" };
    if (grade === 4) return { title: "Muito bem!", message: "Você está indo bem.", colorKey: "indigo", icon: <Medal size={28} />, buttonText: "Continuar" };
    return { title: "Excelente!", message: "Muito fácil para você?", colorKey: "emerald", icon: <Sparkles size={28} />, buttonText: "Continuar" };
  }
  if (isCorrect) return { title: "Correto!", message: null, colorKey: "green", icon: <CheckCircle2 size={28} />, buttonText: "Continuar" };
  return { title: "Incorreto", message: null, colorKey: "rose", icon: <XCircle size={28} />, buttonText: "Continuar" };
}

const COLORS = {
  rose:    { bg: "bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-900", icon: "text-rose-600", title: "text-rose-800 dark:text-rose-400", btn: "bg-rose-500 hover:bg-rose-600 text-white border-transparent" },
  amber:   { bg: "bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-900", icon: "text-amber-600", title: "text-amber-800 dark:text-amber-400", btn: "bg-amber-500 hover:bg-amber-600 text-white border-transparent" },
  indigo:  { bg: "bg-indigo-100 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-900", icon: "text-indigo-600", title: "text-indigo-800 dark:text-indigo-400", btn: "bg-indigo-500 hover:bg-indigo-600 text-white border-transparent" },
  emerald: { bg: "bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900", icon: "text-emerald-600", title: "text-emerald-800 dark:text-emerald-400", btn: "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" },
  green:   { bg: "bg-green-100 border-green-200 dark:bg-green-950 dark:border-green-900", icon: "text-green-600", title: "text-green-800 dark:text-green-400", btn: "bg-green-500 hover:bg-green-600 text-white border-transparent" },
  slate:   { bg: "bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-900", icon: "text-slate-600", title: "text-slate-800 dark:text-slate-400", btn: "bg-slate-500 hover:bg-slate-600 text-white border-transparent" },
};

export function FeedbackSheet({ isOpen, isCorrect, correctAnswer, explanation, grade, onContinue }: FeedbackSheetProps) {
  const config = getFeedbackConfig(grade, isCorrect);
  const c = COLORS[config.colorKey];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn("fixed bottom-0 left-0 right-0 p-5 z-50 border-t-2", c.bg)}
        >
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className={cn("p-2 rounded-full bg-white/70 shrink-0", c.icon)}>
                {config.icon}
              </div>
              <div className="flex flex-col">
                <h3 className={cn("text-xl font-bold", c.title)}>{config.title}</h3>
                {config.message && <p className={cn("text-sm mt-0.5 opacity-80", c.title)}>{config.message}</p>}
                {grade === undefined && !isCorrect && correctAnswer && (
                  <p className="text-rose-700 dark:text-rose-300 text-sm mt-1">
                    Resposta correta: <span className="font-semibold">{correctAnswer}</span>
                  </p>
                )}
                {explanation && (
                  <p className="text-sm mt-2 text-muted-foreground border-l-2 border-current pl-2 italic">{explanation}</p>
                )}
              </div>
            </div>
            <Button
              onClick={onContinue}
              className={cn(
                "w-full md:w-auto px-8 py-6 text-base font-bold uppercase tracking-wider rounded-md shadow-[0_4px_0_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all shrink-0",
                c.btn
              )}
            >
              {config.buttonText}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitQuizAction } from "@/modules/course/course.actions";
import { notify } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { QuizQuestion } from "@/modules/course/course.schema";

interface QuizPlayerProps {
  quizId: string;
  questions: QuizQuestion[];
  initialResult?: { score: number; passed: boolean; answers: Record<string, string>; correctCount: number; totalCount: number } | null;
  onComplete: (score: number, passed: boolean) => void;
}

export function QuizPlayer({ quizId, questions, initialResult, onComplete }: QuizPlayerProps) {
  const t = useTranslations("Courses");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialResult?.answers || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; correctCount: number; totalCount: number } | null>(initialResult || null);
  const [isPracticing, setIsPracticing] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleOptionSelect = (option: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await submitQuizAction({ quizId, answers });
    setIsSubmitting(false);

    if (res?.data?.success && res.data.data) {
      setResult(res.data.data);
      setIsPracticing(false);
      onComplete(res.data.data.score, res.data.data.passed);
    } else {
      notify.error(res?.data?.error || t('submitQuizError') || "Erro ao enviar quiz");
    }
  };

  const resetQuiz = () => {
    setResult(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsPracticing(true);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center">
        <p className="text-muted-foreground">{t('quizHasNoQuestions') || "Este quiz não possui perguntas."}</p>
      </div>
    );
  }

  if (result && !isPracticing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12 flex flex-col items-center justify-center">
        <div className="text-center space-y-1 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/60">{t('result') || "Resultado"}</span>
          {initialResult === result && (
            <p className="text-sm text-muted-foreground">{t('lastAttemptSaved') || "Sua última tentativa salva"}</p>
          )}
        </div>

        <div className="relative">
          <div className={`h-32 w-32 rounded-full border-8 flex items-center justify-center ${result.passed ? "border-primary/20 text-primary" : "border-destructive/20 text-destructive"}`}>
            <span className="text-3xl font-bold">{result.score}%</span>
          </div>
          {result.passed ? (
            <CheckCircle2 className="h-10 w-10 text-primary absolute -bottom-2 -right-2 bg-white rounded-full" />
          ) : (
            <XCircle className="h-10 w-10 text-destructive absolute -bottom-2 -right-2 bg-white rounded-full" />
          )}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">{result.passed ? (t('congratulationsPassed') || "Parabéns! Você passou.") : (t('almostThereTryAgain') || "Quase lá! Tente novamente.")}</h2>
          {result.correctCount > 0 && (
            <p className="text-muted-foreground">{t('correctQuestionsCount', { correct: result.correctCount, total: result.totalCount }) || `Você acertou ${result.correctCount} de ${result.totalCount} questões.`}</p>
          )}
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={resetQuiz}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('practiceAgain') || "Praticar Novamente"}
          </Button>
          {result.passed && (
            <Button>
              {t('nextLesson') || "Próxima Aula"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-0 pb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('questionOf', { current: currentQuestionIndex + 1, total: questions.length }) || `Questão ${currentQuestionIndex + 1} de ${questions.length}`}</span>
          <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold leading-tight">{currentQuestion.text}</h2>
      </div>

      <div className="px-0 py-6">
        <RadioGroup
          value={answers[currentQuestion.id] || ""}
          onValueChange={handleOptionSelect}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, idx) => (
            <div
              key={idx}
              className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${answers[currentQuestion.id] === option
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-muted hover:border-primary/50 hover:bg-muted/50"
                }`}
              onClick={() => handleOptionSelect(option)}
            >
              <RadioGroupItem value={option} id={`opt-${idx}`} className="sr-only" />
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[currentQuestion.id] === option ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                {answers[currentQuestion.id] === option && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-medium text-base">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="px-0 pt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('previous') || "Anterior"}
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={!answers[currentQuestion.id] || isSubmitting}
          >
            {isSubmitting ? (t('submitting') || "Enviando...") : (t('finishQuiz') || "Finalizar Quiz")}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={!answers[currentQuestion.id]}
          >
            {t('next') || "Próxima"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

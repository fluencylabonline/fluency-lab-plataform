"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, HelpCircle, CheckCircle2, ArrowRight, RefreshCw, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { type JSONContent } from "@tiptap/core";
import { type QuizData } from "@/modules/curriculum/curriculum.types";
import { RecessActivityPdfActions } from "./RecessActivityPdfActions";
import { useTranslations } from "next-intl";

interface RecessActivityClientProps {
  slot: {
    id: string;
    startAt: Date;
    notes?: string | null;
    teacherName?: string | null;
  };
  lesson: {
    id: string;
    title: string;
    difficulty: string;
    contentJson?: JSONContent | null;
    quizData?: QuizData | null;
  };
  locale: string;
}

export function RecessActivityClient({ slot, lesson, locale }: RecessActivityClientProps) {
  const dateLocale = locale === "pt" ? ptBR : enUS;
  const t = useTranslations("StudentRecess.activity");
  const tPdf = useTranslations("StudentRecess.pdf");

  // State for interactive Quiz
  const questions = lesson.quizData?.questions || [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Check correctness
    let isCorrect = false;
    if (currentQuestion.correctAnswer !== undefined) {
      isCorrect = selectedOption === currentQuestion.correctAnswer;
    } else if (currentQuestion.correctIndex !== undefined) {
      isCorrect = currentQuestion.options.indexOf(selectedOption) === currentQuestion.correctIndex;
    }

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Esquerda: conteúdo da lição ocupa toda a coluna (2/3 no desktop) */}
        <div className="lg:col-span-2" data-tour="student-recess.content">
          <div className="card p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-xl font-bold truncate">{lesson.title}</h2>
              </div>
              <Badge variant="outline" className="uppercase font-bold text-xs shrink-0">
                {lesson.difficulty}
              </Badge>
            </div>

            {lesson.contentJson ? (
              <div className="lesson-content -mx-4">
                <RichTextEditor
                  content={lesson.contentJson}
                  onChange={() => {}}
                  editable={false}
                />
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">{t("noContent")}</div>
            )}
          </div>
        </div>

        {/* Direita: contexto da aula, prática e PDF */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="rounded-md border border-purple-500/20 bg-purple-500/10 p-4 space-y-2" data-tour="student-recess.context">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-500/30">
              {t("badge")}
            </Badge>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{t("originalClass", { date: format(new Date(slot.startAt), "PPp", { locale: dateLocale }) })}</span>
              </div>
              {slot.teacherName && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("teacher", { name: slot.teacherName })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-4" data-tour="student-recess.quiz">
            <div className="flex items-center gap-2 border-b pb-4">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h3 className="font-bold">{t("quizTitle")}</h3>
            </div>

            {questions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">{t("noQuiz")}</div>
            ) : quizFinished ? (
              // Quiz Finished Screen
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">{t("quizDone")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("quizScore", { score, total: questions.length })}
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="outline" onClick={handleRestartQuiz} className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {t("tryAgain")}
                  </Button>
                </div>
              </div>
            ) : (
              // Active Quiz Screen
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t("questionOf", { current: currentQuestionIndex + 1, total: questions.length })}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {t("correctCount", { count: score })}
                  </Badge>
                </div>

                <p className="text-sm font-semibold leading-relaxed">
                  {questions[currentQuestionIndex].text}
                </p>

                <div className="space-y-2 pt-2">
                  {questions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    
                    // Determine styling based on state
                    let btnClass = "w-full justify-start text-left font-medium h-auto py-3 px-4 border transition-all text-xs ";
                    if (isAnswered) {
                      const currentQ = questions[currentQuestionIndex];
                      let isThisCorrect = false;
                      if (currentQ.correctAnswer !== undefined) {
                        isThisCorrect = option === currentQ.correctAnswer;
                      } else if (currentQ.correctIndex !== undefined) {
                        isThisCorrect = idx === currentQ.correctIndex;
                      }
                      
                      if (isThisCorrect) {
                        btnClass += "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400";
                      } else if (isSelected) {
                        btnClass += "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400";
                      } else {
                        btnClass += "bg-background border-border text-muted-foreground opacity-60";
                      }
                    } else {
                      if (isSelected) {
                        btnClass += "bg-primary/10 border-primary text-primary shadow-sm";
                      } else {
                        btnClass += "bg-background border-border hover:bg-muted/50 text-foreground";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(option)}
                        disabled={isAnswered}
                        className={btnClass}
                        style={{ display: "block", width: "100%", borderRadius: "var(--radius)" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] uppercase shrink-0 font-bold">
                            {String.fromCharCode(97 + idx)}
                          </span>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && questions[currentQuestionIndex].explanation && (
                  <Alert className="bg-muted/50 border-none py-3 mt-4">
                    <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-bold block text-foreground mb-0.5">{t("explanation")}</span>
                      {questions[currentQuestionIndex].explanation}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4">
                  {!isAnswered ? (
                    <Button 
                      onClick={handleConfirmAnswer} 
                      disabled={selectedOption === null}
                      className="w-full gap-2 font-bold"
                    >
                      {t("confirm")}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNextQuestion} 
                      className="w-full gap-2 font-bold"
                    >
                      {currentQuestionIndex + 1 < questions.length ? t("next") : t("seeResult")}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="card p-4 space-y-3">
            <p className="text-xs text-muted-foreground">{tPdf("hint")}</p>
            <RecessActivityPdfActions slotId={slot.id} />
          </div>
        </div>
    </div>
  );
}

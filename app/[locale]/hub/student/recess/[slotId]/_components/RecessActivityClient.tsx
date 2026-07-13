"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, HelpCircle, CheckCircle2, ArrowRight, RefreshCw, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string; // ou string dependendo do schema
  correctIndex?: number;
  explanation?: string;
}

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
    contentJson?: any;
    quizData?: {
      questions: QuizQuestion[];
      passingScore?: number;
    } | null;
  };
  locale: string;
}

export function RecessActivityClient({ slot, lesson, locale }: RecessActivityClientProps) {
  const dateLocale = locale === "pt" ? ptBR : enUS;
  
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
    <div className="space-y-8">
      {/* Recess Context Banner */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-500/30">
              Atividade Alternativa
            </Badge>
            <span className="text-xs text-muted-foreground">Status do professor: Em Recesso</span>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
            {slot.notes || "Esta lição foi disponibilizada para que você continue praticando durante a ausência do seu professor."}
          </p>
        </div>
        <div className="flex flex-col text-xs text-muted-foreground gap-1 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Aula original: {format(new Date(slot.startAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}</span>
          </div>
          {slot.teacherName && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>Prof: {slot.teacherName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle: Lesson Content (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">{lesson.title}</h2>
              </div>
              <Badge variant="outline" className="uppercase font-bold text-xs">
                {lesson.difficulty}
              </Badge>
            </div>

            {lesson.contentJson ? (
              <div className="rich-text-container">
                <RichTextEditor
                  content={lesson.contentJson}
                  onChange={() => {}}
                  editable={false}
                />
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Não há conteúdo de texto cadastrado para esta lição.
              </div>
            )}
          </div>
        </div>

        {/* Right: Quiz (1/3 width on desktop) */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-4">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Praticar e Testar</h3>
            </div>

            {questions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhum quiz associado a esta lição de recesso.
              </div>
            ) : quizFinished ? (
              // Quiz Finished Screen
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">Quiz Concluído!</h4>
                  <p className="text-sm text-muted-foreground">
                    Você acertou {score} de {questions.length} perguntas.
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="outline" onClick={handleRestartQuiz} className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            ) : (
              // Active Quiz Screen
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Questão {currentQuestionIndex + 1} de {questions.length}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {score} acertos
                  </Badge>
                </div>

                <p className="text-sm font-semibold leading-relaxed">
                  {questions[currentQuestionIndex].question}
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
                      <span className="font-bold block text-foreground mb-0.5">Explicação:</span>
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
                      Confirmar Resposta
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNextQuestion} 
                      className="w-full gap-2 font-bold"
                    >
                      {currentQuestionIndex + 1 < questions.length ? "Próxima Questão" : "Ver Resultado"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

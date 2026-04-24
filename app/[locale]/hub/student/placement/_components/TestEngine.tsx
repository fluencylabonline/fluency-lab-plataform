"use client";

import { useState, useCallback } from "react";
import { Question } from "@/modules/placement/placement.schema";
import { TestView } from "./TestView";
import { ResultView } from "./ResultView";
import { submitPlacementAnswerAction, getTestResultAction } from "@/modules/placement/placement.actions";
import { usePlacementSound } from "@/hooks/ui/usePlacementSound";
import { notify } from "@/components/ui/toaster";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type PlacementResult } from "./ResultView";

interface TestEngineProps {
  initialQuestion: Question;
  testId: number;
  initialAnsweredCount: number;
  languageName: string;
}

const MAX_QUESTIONS = 25;

export function TestEngine({
  initialQuestion,
  testId,
  initialAnsweredCount,
  languageName,
}: TestEngineProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question>(initialQuestion);
  const [answeredCount, setAnsweredCount] = useState(initialAnsweredCount);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<PlacementResult | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer?: string } | null>(null);
  const [nextQuestionData, setNextQuestionData] = useState<Question | null>(null);

  const { playSound } = usePlacementSound();
  const router = useRouter();
  const t = useTranslations("Placement");

  const handleAnswer = useCallback(async () => {
    if (!selectedOption || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const result = await submitPlacementAnswerAction({
        testId,
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
      });

      if (!result?.data) {
        notify.error(t("errorSubmitting") || "Error submitting answer");
        setIsSubmitting(false);
        return;
      }

      const { isCorrect, isFinished, nextQuestion } = result.data;

      // Feedback
      if (isCorrect) {
        playSound("correct");
        if ("vibrate" in navigator) navigator.vibrate(50);
      } else {
        playSound("wrong");
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      }

      // Set feedback state to show result bar
      let correctAnswer = "";
      if (!isCorrect && currentQuestion.options) {
        const options = currentQuestion.options as { text: string, id: string }[];
        const correct = options.find(o => o.id === currentQuestion.correctOptionId);
        correctAnswer = correct?.text || currentQuestion.context || "";
      }

      setFeedback({ isCorrect, correctAnswer });

      if (isFinished) {
        const detailedResult = await getTestResultAction({ testId });
        if (detailedResult?.data) {
          setNextQuestionData(null); // No next question
        }
      } else if (nextQuestion) {
        setNextQuestionData(nextQuestion as Question);
      }
    } catch {
      notify.error(t("error") || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOption, isSubmitting, testId, currentQuestion, playSound, t]);

  const handleContinue = useCallback(async () => {
    if (feedback?.isCorrect === false && !nextQuestionData && !testResult) {
       // Should not happen if logic is correct
    }

    if (!nextQuestionData && answeredCount < MAX_QUESTIONS - 1) {
       // Re-check for results if finished
       const detailedResult = await getTestResultAction({ testId });
       if (detailedResult?.data) {
         setTestResult(detailedResult.data);
         return;
       }
    }

    if (nextQuestionData) {
      setAnsweredCount((prev) => prev + 1);
      setCurrentQuestion(nextQuestionData);
      setNextQuestionData(null);
      setFeedback(null);
      setSelectedOption("");
    } else {
      // If no next question, finish
      const detailedResult = await getTestResultAction({ testId });
      if (detailedResult?.data) {
        setTestResult(detailedResult.data);
      } else {
        router.push("/hub/student/placement");
      }
    }
  }, [feedback, nextQuestionData, testResult, answeredCount, testId, router]);

  const handleSkip = useCallback(async () => {
    if (isSubmitting || feedback) return;
    
    setIsSubmitting(true);
    try {
      const result = await submitPlacementAnswerAction({
        testId,
        questionId: currentQuestion.id,
        selectedOptionId: "", // Empty means skip/wrong
      });

      if (result?.data) {
        const { isFinished, nextQuestion } = result.data;
        
        playSound("wrong");
        
        // Show correct answer in feedback
        let correctAnswer = "";
        if (currentQuestion.options) {
          const options = currentQuestion.options as { text: string, id: string }[];
          const correct = options.find(o => o.id === currentQuestion.correctOptionId);
          correctAnswer = correct?.text || currentQuestion.context || "";
        }
        
        setFeedback({ isCorrect: false, correctAnswer });
        
        if (isFinished) {
          setNextQuestionData(null);
        } else if (nextQuestion) {
          setNextQuestionData(nextQuestion as Question);
        }
      }
    } catch {
      notify.error(t("error") || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, feedback, testId, currentQuestion, playSound, t]);

  const handleExit = useCallback(() => {
    if (confirm(t("exitConfirm") || "Are you sure you want to exit? Your progress will be saved.")) {
      router.push("/hub/student/placement");
    }
  }, [router, t]);

  if (testResult) {
    return (
      <ResultView 
        result={testResult} 
        onBack={() => router.push("/hub/student/placement")} 
      />
    );
  }

  if (!isStarted && answeredCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <Languages className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t("introTitle")}</h1>
          <p className="text-xl text-muted-foreground font-medium">
            {t("introSubtitle", { language: languageName })}
          </p>
          <p className="text-slate-500 max-w-md mx-auto">
            {t("introDesc")}
          </p>
        </div>

        <div className="w-full pt-8 space-y-4">
          <p className="font-bold text-indigo-600 uppercase tracking-widest text-sm">
            {t("introReady")}
          </p>
          <Button 
            size="lg"
            className="w-full h-16 text-xl font-black uppercase tracking-wider rounded-2xl bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all text-white"
            onClick={() => {
              playSound("start");
              setIsStarted(true);
            }}
          >
            {t("startTest")}
          </Button>
          <Button 
            variant="ghost"
            className="w-full text-muted-foreground font-bold uppercase tracking-widest"
            onClick={() => router.push("/hub/student/placement")}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TestView
      currentQuestion={currentQuestion}
      answeredCount={answeredCount}
      totalQuestions={MAX_QUESTIONS}
      selectedOption={selectedOption}
      onOptionSelect={setSelectedOption}
      onAnswer={handleAnswer}
      onContinue={handleContinue}
      onSkip={handleSkip}
      onExit={handleExit}
      isSubmitting={isSubmitting}
      feedback={feedback}
    />
  );
}

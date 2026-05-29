"use client";

import { useEffect, useState, useMemo } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useParams } from "next/navigation";
import { ref, onValue, set, off, type DataSnapshot } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle,  
  Crown, 
  BookOpen, 
  GraduationCap, 
  Info,
  Loader2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { generateNotebookQuizAction, getQuizLimitCountAction } from "@/modules/notebook/notebook.actions";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { QuizQuestion, QuizQuestionOption } from "./quiz.types";

// ─── Normalization Helper ──────────────────────────────────────────────────────
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "") // Remove punctuation
    .replace(/\s+/g, " "); // Collapse spaces
}

export function QuizView({ node, updateAttributes }: NodeViewProps) {
  const nodeId = node.attrs.nodeId as string;
  const questions = useMemo(() => (node.attrs.questions || []) as QuizQuestion[], [node.attrs.questions]);
  const studentAnswers = useMemo(() => (node.attrs.studentAnswers || {}) as Record<string, string>, [node.attrs.studentAnswers]);
  const submitted = !!node.attrs.submitted;
  const params = useParams();
  const notebookId = params?.notebookId as string;
  const t = useTranslations("Quiz");

  const userRole = (globalThis as Record<string, unknown>).__userRole as string ?? "student";
  const myUserId = (globalThis as Record<string, unknown>).__userId as string ?? "anonymous";
  const studentId = (globalThis as Record<string, unknown>).__studentId as string ?? "anonymous";

  // ─── States ──────────────────────────────────────────────────────────────────
  const [nativeLanguage, setNativeLanguage] = useState("Português");
  const [targetLanguage, setTargetLanguage] = useState("Inglês");
  const [level, setLevel] = useState("B1");
  const [isLoading, setIsLoading] = useState(false);
  const [limitCount, setLimitCount] = useState<number | null>(null);

  // Student Gameplay States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [writtenInput, setWrittenInput] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  // Restore student progress from loaded studentAnswers on mount/load
  useEffect(() => {
    if (!questions || questions.length === 0) {
      setHasRestoredProgress(false);
      return;
    }
    if (userRole === "student" && !hasRestoredProgress) {
      const answeredCount = Object.keys(studentAnswers || {}).length;
      const targetIdx = Math.min(answeredCount, questions.length - 1);
      setCurrentIdx(targetIdx);
      setHasRestoredProgress(true);
    }
  }, [questions, studentAnswers, userRole, hasRestoredProgress]);

  // ─── Firebase RTDB Sync ─────────────────────────────────────────────────────
  const publishState = (nextState: { 
    studentAnswers: Record<string, string>; 
    submitted: boolean; 
    currentIndex: number;
  }) => {
    if (!nodeId) return;
    const payload = {
      studentAnswers: nextState.studentAnswers,
      submitted: nextState.submitted,
      currentIndex: nextState.currentIndex,
      lastUpdatedBy: myUserId,
      updatedAt: Date.now(),
    };
    set(ref(rtdb, `interactive-quiz/${nodeId}`), payload).catch(console.error);
  };

  useEffect(() => {
    if (!nodeId) return;

    const syncRef = ref(rtdb, `interactive-quiz/${nodeId}`);

    const handleSnapshot = (snapshot: DataSnapshot) => {
      const state = snapshot.val();
      if (!state) return;

      // Anti-loop: If the update was made by another user, sync our local states
      if (state.lastUpdatedBy !== myUserId) {
        updateAttributes({
          studentAnswers: state.studentAnswers,
          submitted: state.submitted
        });
        
        if (userRole === "student") {
          setCurrentIdx(state.currentIndex);
        }
      }
    };

    onValue(syncRef, handleSnapshot);
    return () => off(syncRef, "value", handleSnapshot);
  }, [nodeId, myUserId, userRole, updateAttributes]);

  // ─── Fetch limit count on render for teacher ─────────────────────────────────
  useEffect(() => {
    if (userRole === "teacher" && studentId && questions.length === 0) {
      getQuizLimitCountAction({ studentId })
        .then((res) => {
          if (res?.data) {
            setLimitCount(res.data.count);
          }
        })
        .catch(console.error);
    }
  }, [userRole, studentId, questions.length]);

  // Derive stats
  const score = useMemo(() => {
    if (!questions || questions.length === 0) return 0;
    let correct = 0;
    questions.forEach((q: QuizQuestion) => {
      const studentAns = studentAnswers[q.id] || "";
      if (q.type === "multiple-choice") {
        if (studentAns === q.correctOptionId) correct++;
      } else {
        if (normalizeText(studentAns) === normalizeText(q.correctWrittenAnswer || "")) correct++;
      }
    });
    return correct;
  }, [questions, studentAnswers]);

  // ─── Teacher: Quiz Generation ───────────────────────────────────────────────
  const handleGenerateQuiz = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Extract editor text safely
      const editorText = document.querySelector(".simple-editor-content")?.textContent || "";
      if (editorText.trim().length < 50) {
        toast.error(t("teacher.alertText") || "O notebook precisa de mais conteúdo de aula para a IA criar o quiz!");
        setIsLoading(false);
        return;
      }

      const res = await generateNotebookQuizAction({
        notebookId,
        studentId,
        content: editorText,
        nativeLanguage,
        targetLanguage,
        level
      });

      if (res?.data?.quizData?.questions) {
        updateAttributes({
          questions: res.data.quizData.questions,
          studentAnswers: {},
          submitted: false
        });
        toast.success(t("teacher.successText") || "Quiz gerado com sucesso pela IA!");
        if (res.data.usageCount !== undefined) {
          setLimitCount(res.data.usageCount);
        }
      } else {
        toast.error(res?.serverError || "Erro ao gerar o quiz. Tente novamente.");
      }
    } catch (error: unknown) {
      console.error(error);
      const err = error as Error;
      toast.error(err.message || "Erro inesperado ao gerar quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Student: Quiz Actions ──────────────────────────────────────────────────
  const activeQuestion = questions[currentIdx];

  const handleCheckAnswer = () => {
    if (!activeQuestion) return;

    if (activeQuestion.type === "multiple-choice" && !selectedOptionId) {
      toast.error(t("gameplay.errors.selectOption") || "Selecione uma das opções!");
      return;
    }
    if (activeQuestion.type === "written" && !writtenInput.trim()) {
      toast.error(t("gameplay.errors.writeInput") || "Escreva a sua resposta!");
      return;
    }

    const currentAnswer = activeQuestion.type === "multiple-choice" ? selectedOptionId! : writtenInput;
    const isCorrect = activeQuestion.type === "multiple-choice" 
      ? currentAnswer === activeQuestion.correctOptionId
      : normalizeText(currentAnswer) === normalizeText(activeQuestion.correctWrittenAnswer || "");

    // Save answer in node attributes
    const nextAnswers = { ...studentAnswers, [activeQuestion.id]: currentAnswer };
    updateAttributes({ studentAnswers: nextAnswers });

    // Publish to RTDB for immediate real-time sync with teacher
    publishState({
      studentAnswers: nextAnswers,
      submitted: false,
      currentIndex: currentIdx
    });

    if (!isCorrect) {
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 500);
      // Play a quick tactile feedback on mobile
      if (navigator.vibrate) navigator.vibrate(80);
    } else {
      if (navigator.vibrate) navigator.vibrate([40, 40]);
    }

    setIsChecked(true);
  };

  const handleContinue = () => {
    setIsChecked(false);
    setSelectedOptionId(null);
    setWrittenInput("");

    if (currentIdx + 1 < questions.length) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      publishState({
        studentAnswers,
        submitted: false,
        currentIndex: nextIdx
      });
    } else {
      updateAttributes({ submitted: true });
      publishState({
        studentAnswers,
        submitted: true,
        currentIndex: currentIdx
      });
    }
  };

  // ─── RENDER ───
  return (
    <NodeViewWrapper className="quiz-container">
      <div className="font-sans select-none bg-background border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 my-6 transition-all duration-200 relative overflow-hidden">
        
        {/* 1. SETUP SCREEN (TEACHER ONLY & EMPTY QUIZ) */}
        {questions.length === 0 && userRole === "teacher" && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{t("generator.title") || "Gerador de Quiz Pedagógico IA"}</h3>
                <p className="text-sm text-muted-foreground">{t("generator.description") || "Crie 10 perguntas baseadas no conteúdo atual desta aula."}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="text-center space-y-1">
                  <h4 className="font-semibold text-foreground">{t("generator.loadingTitle") || "A Inteligência Artificial está trabalhando..."}</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {t("generator.loadingDescription") || "Lendo o conteúdo do notebook, projetando gramática, vocabulário e explicações interativas."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" /> {t("generator.nativeLanguage") || "Idioma Nativo do Aluno"}
                    </label>
                    <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                      <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl">
                        <SelectValue placeholder={t("generator.select") || "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Português">Português</SelectItem>
                        <SelectItem value="Espanhol">Espanhol</SelectItem>
                        <SelectItem value="Inglês">Inglês</SelectItem>
                        <SelectItem value="Francês">Francês</SelectItem>
                        <SelectItem value="Alemão">Alemão</SelectItem>
                        <SelectItem value="Italiano">Italiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-muted-foreground" /> {t("generator.targetLanguage") || "Idioma Aprendido"}
                    </label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl">
                        <SelectValue placeholder={t("generator.select") || "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inglês">Inglês</SelectItem>
                        <SelectItem value="Espanhol">Espanhol</SelectItem>
                        <SelectItem value="Francês">Francês</SelectItem>
                        <SelectItem value="Italiano">Italiano</SelectItem>
                        <SelectItem value="Alemão">Alemão</SelectItem>
                        <SelectItem value="Português">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-muted-foreground" /> {t("generator.targetLevel") || "Nível Alvo (CEFR)"}
                    </label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl">
                        <SelectValue placeholder={t("generator.select") || "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">{t("generator.levels.A1") || "A1 (Iniciante)"}</SelectItem>
                        <SelectItem value="A2">{t("generator.levels.A2") || "A2 (Básico)"}</SelectItem>
                        <SelectItem value="B1">{t("generator.levels.B1") || "B1 (Intermediário)"}</SelectItem>
                        <SelectItem value="B2">{t("generator.levels.B2") || "B2 (Intermediário Avançado)"}</SelectItem>
                        <SelectItem value="C1">{t("generator.levels.C1") || "C1 (Avançado)"}</SelectItem>
                        <SelectItem value="C2">{t("generator.levels.C2") || "C2 (Fluente)"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {limitCount !== null && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      {t("generator.limitWarning", { count: limitCount }) || `Você utilizou ${limitCount} de 3 gerações de quiz IA gratuitas para este aluno.`}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={limitCount !== null && limitCount >= 3}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 text-base font-bold uppercase rounded-xl cursor-pointer transition-all duration-100 border-2 border-transparent bg-primary text-primary-foreground border-b-[4px] border-b-primary/80 hover:brightness-105 active:translate-y-[2px] active:border-b-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                  {t("generator.submitBtn") || "Gerar Quiz Inteligente (10 Perguntas)"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. AWAITING SCREEN (STUDENT ONLY & EMPTY QUIZ) */}
        {questions.length === 0 && userRole === "student" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-lg text-foreground">{t("status.waitingTeacher") || "Aguardando o Professor"}</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("status.waitingTeacherDescription") || "O professor ainda não ativou o quiz interativo para este notebook. Peça para ele gerar o quiz!"}
            </p>
          </div>
        )}

        {/* 3. STUDENT DUOLINGO PLAYGAME (QUESTIONS GENERATED & NOT SUBMITTED) */}
        {questions.length > 0 && !submitted && userRole === "student" && (
          <div className="space-y-6 py-4">
            
            {/* Progress Bar Header */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-bold text-muted-foreground w-12 text-left">
                {currentIdx + 1} / {questions.length}
              </span>
              <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-300 relative after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-[25%] after:bg-white/20" 
                  style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card (using Framer Motion for premium wiggles on wrong answer) */}
            <motion.div 
              className="space-y-6"
              animate={shakeActive ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="space-y-2">
                <div className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-xs font-bold text-primary rounded-full uppercase tracking-wider">
                  {activeQuestion.category || "compreensão"}
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-normal">
                  {activeQuestion.questionText}
                </h2>
              </div>

              {/* MCQ Render */}
              {activeQuestion.type === "multiple-choice" && (
                <div className="space-y-3">
                  {(activeQuestion.options || []).map((opt: QuizQuestionOption) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => !isChecked && setSelectedOptionId(opt.id)}
                        disabled={isChecked}
                        className={`w-full flex items-center p-4 rounded-xl text-base font-semibold text-foreground transition-all outline-none border-2 select-none active:translate-y-[2px] active:border-b-[2px] active:mb-[14px] ${
                          isChecked
                            ? opt.id === activeQuestion.correctOptionId
                              ? "border-green-500 dark:border-green-600 bg-green-500/10 text-green-700 dark:text-green-400 border-b-[2px] mb-[14px]"
                              : selectedOptionId === opt.id
                                ? "border-red-500 dark:border-red-600 bg-red-500/10 text-red-700 dark:text-red-400 border-b-[2px] mb-[14px]"
                                : "border-zinc-200 dark:border-zinc-800 opacity-60 border-b-[4px] mb-3"
                            : isSelected
                              ? "border-primary border-b-[2px] translate-y-[2px] mb-[14px] bg-primary/8 dark:bg-primary/10"
                              : "border-zinc-200 dark:border-zinc-800 border-b-[4px] hover:border-primary/50 hover:bg-primary/2 dark:hover:bg-zinc-800/40 bg-background mb-3"
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center w-7 h-7 mr-3.5 border-2 rounded text-[13px] font-bold bg-background transition-colors ${
                          isChecked
                            ? opt.id === activeQuestion.correctOptionId
                              ? "border-green-500 text-green-500"
                              : selectedOptionId === opt.id
                                ? "border-red-500 text-red-500"
                                : "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                            : isSelected
                              ? "border-primary text-primary"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-500"
                        }`}>{opt.id}</span>
                        <span className="flex-1 pr-2">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Written Fill-in-the-blank Render */}
              {activeQuestion.type === "written" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t("gameplay.inputPlaceholder") || "Escreva a resposta correta aqui..."}
                    value={writtenInput}
                    onChange={(e) => !isChecked && setWrittenInput(e.target.value)}
                    disabled={isChecked}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isChecked) handleCheckAnswer();
                      else if (e.key === "Enter" && isChecked) handleContinue();
                    }}
                    className={`w-full px-5 py-4 bg-background border-2 border-b-[4px] rounded-xl text-lg font-semibold text-foreground transition-all outline-none ${
                      isChecked
                        ? (normalizeText(writtenInput) === normalizeText(activeQuestion.correctWrittenAnswer || ""))
                          ? "border-green-500 dark:border-green-600 focus:border-green-500 dark:focus:border-green-600 bg-green-500/5 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border-red-500 dark:border-red-600 focus:border-red-500 dark:focus:border-red-600 bg-red-500/5 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                        : "border-zinc-200 dark:border-zinc-800 focus:border-primary"
                    }`}
                  />
                </div>
              )}
            </motion.div>

            {/* Persistent check button spacer to keep layout uniform */}
            <div className="h-20" />

            {/* Tactile drawer at bottom */}
            <div 
              className={`absolute bottom-0 left-0 right-0 p-5 z-10 border-t-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                isChecked 
                  ? (activeQuestion.type === "multiple-choice" 
                      ? selectedOptionId === activeQuestion.correctOptionId 
                      : normalizeText(writtenInput) === normalizeText(activeQuestion.correctWrittenAnswer || ""))
                    ? "bg-[#d7ffb8] dark:bg-[#1e3f20] border-[#58cc02] dark:border-[#4cd137] text-[#185c00] dark:text-zinc-100"
                    : "bg-[#ffdfe0] dark:bg-[#3b1d1f] border-[#ea2b2b] dark:border-[#ff4757] text-[#7c0a0a] dark:text-zinc-100"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-foreground"
              }`}
            >
              {isChecked ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 pt-0.5">
                      {(activeQuestion.type === "multiple-choice" 
                        ? selectedOptionId === activeQuestion.correctOptionId 
                        : normalizeText(writtenInput) === normalizeText(activeQuestion.correctWrittenAnswer || "")) ? (
                        <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base leading-tight">
                        {(activeQuestion.type === "multiple-choice" 
                          ? selectedOptionId === activeQuestion.correctOptionId 
                          : normalizeText(writtenInput) === normalizeText(activeQuestion.correctWrittenAnswer || ""))
                          ? (t("gameplay.correctTitle") || "Excelente! Resposta Correta")
                          : (t("gameplay.incorrectTitle") || "Que pena! Resposta Incorreta")}
                      </h4>
                      <p className="text-sm font-medium leading-normal max-w-xl">
                        {activeQuestion.type === "multiple-choice" ? (
                          activeQuestion.explanations[selectedOptionId!] || t("gameplay.explanationNotAvailable") || "Explicação não disponível."
                        ) : (
                          <>
                             {(t("gameplay.correctAnswerLabel", { answer: activeQuestion.correctWrittenAnswer || "" }) || `Resposta correta: ${activeQuestion.correctWrittenAnswer}`)}
                            <br />
                            {activeQuestion.explanations.general || t("gameplay.explanationNotAvailable") || "Explicação não disponível."}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleContinue}
                    className={`inline-flex items-center justify-center px-7 py-3 text-base font-bold uppercase rounded-xl cursor-pointer transition-all duration-100 border-2 border-transparent outline-none active:translate-y-[2px] active:border-b-[2px] ${
                      (activeQuestion.type === "multiple-choice" 
                        ? selectedOptionId === activeQuestion.correctOptionId 
                        : normalizeText(writtenInput) === normalizeText(activeQuestion.correctWrittenAnswer || ""))
                        ? "bg-[#58cc02] hover:bg-[#61e002] text-white border-b-[4px] border-b-[#3c8c01]"
                        : "bg-[#ff4b4b] hover:bg-[#ff6060] text-white border-b-[4px] border-b-[#ea2b2b]"
                    } px-8 shrink-0`}
                  >
                    {t("gameplay.continueBtn") || "Continuar"}
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-end w-full">
                  <button
                    type="button"
                    onClick={handleCheckAnswer}
                    disabled={activeQuestion.type === "multiple-choice" ? !selectedOptionId : !writtenInput.trim()}
                    className="inline-flex items-center justify-center px-7 py-3 text-base font-bold uppercase rounded-xl cursor-pointer transition-all duration-100 border-2 border-transparent bg-primary text-primary-foreground border-b-[4px] border-b-primary/80 hover:brightness-105 active:translate-y-[2px] active:border-b-[2px] disabled:opacity-50 disabled:cursor-not-allowed px-10 shrink-0"
                  >
                    {t("gameplay.checkBtn") || "Verificar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. STUDENT END SCREEN (SUBMITTED & CONGRATULATIONS REVIEW) */}
        {questions.length > 0 && submitted && userRole === "student" && (
          <div className="space-y-8 py-6 text-center">
            
            <div className="inline-flex p-4 bg-amber-500/10 rounded-full text-amber-500 animate-bounce">
              <Crown className="w-16 h-16" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-foreground">{t("end.title") || "Quiz Concluído!"}</h2>
              <p className="text-muted-foreground text-base max-w-sm mx-auto">
                {t("end.description") || "Parabéns! Você completou os exercícios gerados pela inteligência artificial."}
              </p>
            </div>

            {/* Tactile score badge */}
            <div className="max-w-xs mx-auto border-2 border-primary/20 bg-primary/5 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-sm font-bold text-muted-foreground text-left">{t("end.scoreLabel") || "Pontuação Final"}</span>
              <span className="text-2xl font-black text-primary">
                {t("end.hitsLabel", { score, total: questions.length }) || `${score} / ${questions.length} acertos`}
              </span>
            </div>

            {/* Question Recap Review */}
            <div className="text-left space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> {t("end.reviewTitle") || "Revisão dos Exercícios"}
              </h3>

              <div className="space-y-4">
                {questions.map((q: QuizQuestion, idx: number) => {
                  const answer = studentAnswers[q.id] || "";
                  const isCorrect = q.type === "multiple-choice"
                    ? answer === q.correctOptionId
                    : normalizeText(answer) === normalizeText(q.correctWrittenAnswer || "");

                  return (
                    <div key={q.id} className="p-4 border border-zinc-200 dark:border-zinc-800 bg-background rounded-2xl flex flex-col gap-2 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-extrabold text-base text-foreground leading-snug">
                          {idx + 1}. {q.questionText}
                        </h4>
                        <span className={`shrink-0 flex items-center gap-1 text-sm font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          {isCorrect ? (t("end.correctStatus") || "Acertou") : (t("end.incorrectStatus") || "Errou")}
                        </span>
                      </div>

                      <div className="text-sm font-medium space-y-1 text-muted-foreground">
                        <p>
                          {t("end.yourAnswer", { answer: q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === answer)?.text || answer : answer }) || `Sua resposta: ${q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === answer)?.text || answer : answer}`}
                        </p>
                        {!isCorrect && (
                          <p>
                             {t("end.correctAnswer", { answer: (q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === q.correctOptionId)?.text : q.correctWrittenAnswer) || "" }) || `Resposta correta: ${q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === q.correctOptionId)?.text : q.correctWrittenAnswer}`}
                          </p>
                        )}
                        <p className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 mt-1.5 text-xs text-foreground bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-xl font-normal leading-normal">
                          <strong>{t("end.explanationLabel") || "Explicação:"} </strong> 
                          {q.type === "multiple-choice" ? q.explanations[answer || q.correctOptionId || ""] : q.explanations.general}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. TEACHER REAL-TIME DASHBOARD (QUESTIONS GENERATED & VIEWING LIVE STUDENT ANSWERS) */}
        {questions.length > 0 && userRole === "teacher" && (
          <div className="space-y-6 py-4">
            
            <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <GraduationCap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{t("teacher.title") || "Progresso do Aluno (Em Tempo Real)"}</h3>
                  <p className="text-sm text-muted-foreground">{t("teacher.description") || "Acompanhe as respostas e o desempenho do aluno neste quiz."}</p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("teacher.statusLabel") || "Status do Aluno"}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full mt-1 ${
                  submitted 
                    ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300" 
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                }`}>
                  {submitted ? (t("teacher.statusFinished") || "Concluído") : (t("teacher.statusAnswering") || "Respondendo...")}
                </span>
              </div>
            </div>

            {/* Performance Badge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-zinc-250 dark:border-zinc-800 bg-background rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t("teacher.partialScoreLabel") || "Nota Parcial"}</span>
                <h2 className="text-3xl font-black text-primary mt-1">
                  {t("end.hitsLabel", { score, total: questions.length }) || `${score} / ${questions.length} acertos`}
                </h2>
              </div>
              <div className="p-4 border border-zinc-250 dark:border-zinc-800 bg-background rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t("teacher.progressLabel") || "Progresso do Teste"}</span>
                <h2 className="text-3xl font-black text-foreground mt-1">
                  {t("teacher.progressDescription", { count: Object.keys(studentAnswers).length, total: questions.length }) || `${Object.keys(studentAnswers).length} de ${questions.length} respondidas`}
                </h2>
              </div>
            </div>

            {/* List of Questions with Student Selections */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-base text-foreground">{t("teacher.reportTitle") || "Relatório de Questões"}</h4>
              
              <div className="space-y-3">
                {questions.map((q: QuizQuestion, idx: number) => {
                  const answer = studentAnswers[q.id] || "";
                  const hasAnswered = !!answer;
                  const isCorrect = hasAnswered && (q.type === "multiple-choice"
                    ? answer === q.correctOptionId
                    : normalizeText(answer) === normalizeText(q.correctWrittenAnswer || ""));

                  return (
                    <div key={q.id} className="border-b border-zinc-200 dark:border-zinc-800 py-4 last:border-b-0 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="font-bold text-base text-foreground">
                          {idx + 1}. {q.questionText}
                        </h5>
                        {hasAnswered ? (
                          <span className={`shrink-0 flex items-center gap-1 text-xs font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                            {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {isCorrect ? (t("end.correctStatus") || "Acertou") : (t("end.incorrectStatus") || "Errou")}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{t("teacher.waitingAnswer") || "Aguardando resposta..."}</span>
                        )}
                      </div>

                      {hasAnswered && (
                        <div className="text-sm space-y-1 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 text-muted-foreground">
                          <p>
                            {t("end.yourAnswer", { answer: q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === answer)?.text || answer : answer }) || `Resposta do Aluno: ${q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === answer)?.text || answer : answer}`}
                          </p>
                          {!isCorrect && (
                            <p>
                              {t("end.correctAnswer", { answer: (q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === q.correctOptionId)?.text : q.correctWrittenAnswer) || "" }) || `Resposta correta: ${q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === q.correctOptionId)?.text : q.correctWrittenAnswer}`}
                            </p>
                          )}
                          <p className="pt-2 text-xs text-foreground bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-xl font-normal leading-normal">
                            <strong>{t("teacher.explanationLabel") || "Explicação didática fornecida:"} </strong>
                            {q.type === "multiple-choice" ? q.explanations[answer || q.correctOptionId || ""] : q.explanations.general}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t("teacher.resetConfirm") || "Isso apagará o progresso atual do aluno. Tem certeza que deseja reiniciar o quiz?")) {
                    updateAttributes({ questions: [], studentAnswers: {}, submitted: false });
                    publishState({
                      studentAnswers: {},
                      submitted: false,
                      currentIndex: 0
                    });
                    toast.success(t("teacher.resetSuccess") || "Quiz reiniciado com sucesso!");
                  }
                }}
                className="inline-flex items-center justify-center px-7 py-3 text-base font-bold uppercase rounded-xl cursor-pointer transition-all duration-100 border-2 border-transparent bg-[#ff4b4b] hover:bg-[#ff6060] text-white border-b-[4px] border-b-[#ea2b2b] active:translate-y-[2px] active:border-b-[2px] px-6 text-sm"
              >
                {t("teacher.resetBtn") || "Reiniciar / Apagar Quiz"}
              </button>
            </div>
          </div>
        )}

      </div>
    </NodeViewWrapper>
  );
}

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
import { toast } from "sonner";
import type { QuizQuestion, QuizQuestionOption } from "./quiz.types";
import "./quiz.css";

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
        toast.error("O notebook precisa de mais conteúdo de aula para a IA criar o quiz!");
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
        toast.success("Quiz gerado com sucesso pela IA!");
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
      toast.error("Selecione uma das opções!");
      return;
    }
    if (activeQuestion.type === "written" && !writtenInput.trim()) {
      toast.error("Escreva a sua resposta!");
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
      
      {/* 1. SETUP SCREEN (TEACHER ONLY & EMPTY QUIZ) */}
      {questions.length === 0 && userRole === "teacher" && (
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Gerador de Quiz Pedagógico IA</h3>
              <p className="text-sm text-muted-foreground">Crie 10 perguntas baseadas no conteúdo atual desta aula.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center space-y-1">
                <h4 className="font-semibold text-foreground">A Inteligência Artificial está trabalhando...</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Lendo o conteúdo do notebook, projetando gramática, vocabulário e explicações interativas.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" /> Idioma Nativo do Aluno
                  </label>
                  <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                    <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl">
                      <SelectValue placeholder="Selecione" />
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
                    <BookOpen className="w-4 h-4 text-muted-foreground" /> Idioma Aprendido
                  </label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl">
                      <SelectValue placeholder="Selecione" />
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
                    <Info className="w-4 h-4 text-muted-foreground" /> Nível Alvo (CEFR)
                  </label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 (Iniciante)</SelectItem>
                      <SelectItem value="A2">A2 (Básico)</SelectItem>
                      <SelectItem value="B1">B1 (Intermediário)</SelectItem>
                      <SelectItem value="B2">B2 (Intermediário Avançado)</SelectItem>
                      <SelectItem value="C1">C1 (Avançado)</SelectItem>
                      <SelectItem value="C2">C2 (Fluente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {limitCount !== null && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Você utilizou <strong>{limitCount} de 3</strong> gerações de quiz IA gratuitas para este aluno.
                  </span>
                </div>
              )}

              <button
                onClick={handleGenerateQuiz}
                disabled={limitCount !== null && limitCount >= 3}
                className="quiz-btn-duo primary w-full flex items-center justify-center gap-2 h-12"
              >
                <Sparkles className="w-5 h-5" />
                Gerar Quiz Inteligente (10 Perguntas)
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
          <h4 className="font-bold text-lg text-foreground">Aguardando o Professor</h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            O professor ainda não ativou o quiz interativo para este notebook. Peça para ele gerar o quiz!
          </p>
        </div>
      )}

      {/* 3. STUDENT DUOLINGO PLAYGAME (QUESTIONS GENERATED & NOT SUBMITTED) */}
      {questions.length > 0 && !submitted && userRole === "student" && (
        <div className="space-y-6 py-4">
          
          {/* Progress Bar Header */}
          <div className="quiz-progress-container">
            <span className="text-sm font-bold text-muted-foreground w-12 text-left">
              {currentIdx + 1} / {questions.length}
            </span>
            <div className="quiz-progress-bar">
              <div 
                className="quiz-progress-fill" 
                style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className={`space-y-6 ${shakeActive ? "animate-shake" : ""}`}>
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
                      onClick={() => !isChecked && setSelectedOptionId(opt.id)}
                      disabled={isChecked}
                      className={`quiz-option-card ${isSelected ? "selected" : ""}`}
                    >
                      <span className="quiz-option-badge">{opt.id}</span>
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
                  placeholder="Escreva a resposta correta aqui..."
                  value={writtenInput}
                  onChange={(e) => !isChecked && setWrittenInput(e.target.value)}
                  disabled={isChecked}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isChecked) handleCheckAnswer();
                    else if (e.key === "Enter" && isChecked) handleContinue();
                  }}
                  className="quiz-written-input"
                />
              </div>
            )}
          </div>

          {/* Persistent check button spacer to keep layout uniform */}
          <div className="h-20" />

          {/* Tactile drawer at bottom */}
          <div 
            className={`quiz-feedback-drawer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isChecked 
                ? (activeQuestion.type === "multiple-choice" 
                    ? selectedOptionId === activeQuestion.correctOptionId 
                    : normalizeText(writtenInput) === normalizeText(activeQuestion.correctWrittenAnswer || ""))
                  ? "correct"
                  : "incorrect"
                : "border-t border-muted bg-zinc-50 dark:bg-zinc-900"
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
                        ? "Excelente! Resposta Correta"
                        : "Que pena! Resposta Incorreta"}
                    </h4>
                    <p className="text-sm font-medium leading-normal max-w-xl">
                      {activeQuestion.type === "multiple-choice" ? (
                        activeQuestion.explanations[selectedOptionId!] || "Explicação não disponível."
                      ) : (
                        <>
                          Resposta correta: <strong className="underline">{activeQuestion.correctWrittenAnswer}</strong>.
                          <br />
                          {activeQuestion.explanations.general || "Explicação não disponível."}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className={`quiz-btn-duo ${
                    (activeQuestion.type === "multiple-choice" 
                      ? selectedOptionId === activeQuestion.correctOptionId 
                      : normalizeText(writtenInput) === normalizeText(activeQuestion.correctWrittenAnswer || ""))
                      ? "correct-btn"
                      : "incorrect-btn"
                  } px-8 shrink-0`}
                >
                  Continuar
                </button>
              </>
            ) : (
              <div className="flex items-center justify-end w-full">
                <button
                  onClick={handleCheckAnswer}
                  disabled={activeQuestion.type === "multiple-choice" ? !selectedOptionId : !writtenInput.trim()}
                  className="quiz-btn-duo primary px-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verificar
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
            <h2 className="text-3xl font-extrabold text-foreground">Quiz Concluído!</h2>
            <p className="text-muted-foreground text-base max-w-sm mx-auto">
              Parabéns! Você completou os exercícios gerados pela inteligência artificial.
            </p>
          </div>

          {/* Tactile duolingo score badge */}
          <div className="max-w-xs mx-auto border-2 border-primary/20 bg-primary/5 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm font-bold text-muted-foreground text-left">Pontuação Final</span>
            <span className="text-2xl font-black text-primary">{score} / {questions.length} acertos</span>
          </div>

          {/* Question Recap Review */}
          <div className="text-left space-y-4 pt-4 border-t">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Revisão dos Exercícios
            </h3>

            <div className="space-y-4">
              {questions.map((q: QuizQuestion, idx: number) => {
                const answer = studentAnswers[q.id] || "";
                const isCorrect = q.type === "multiple-choice"
                  ? answer === q.correctOptionId
                  : normalizeText(answer) === normalizeText(q.correctWrittenAnswer || "");

                return (
                  <div key={q.id} className="card p-4 border border-muted bg-background rounded-2xl flex flex-col gap-2 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-extrabold text-base text-foreground leading-snug">
                        {idx + 1}. {q.questionText}
                      </h4>
                      <span className={`shrink-0 flex items-center gap-1 text-sm font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {isCorrect ? "Acertou" : "Errou"}
                      </span>
                    </div>

                    <div className="text-sm font-medium space-y-1 text-muted-foreground">
                      <p>
                        Sua resposta: <strong className={isCorrect ? "text-green-600" : "text-red-600"}>{q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === answer)?.text || answer : answer}</strong>
                      </p>
                      {!isCorrect && (
                        <p>
                          Resposta correta: <strong className="text-green-600">{q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === q.correctOptionId)?.text : q.correctWrittenAnswer}</strong>
                        </p>
                      )}
                      <p className="pt-1.5 border-t mt-1.5 text-xs text-foreground bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-xl font-normal leading-normal">
                        <strong>Explicação: </strong> 
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
          
          <div className="flex items-start justify-between border-b pb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <GraduationCap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Progresso do Aluno (Em Tempo Real)</h3>
                <p className="text-sm text-muted-foreground">Acompanhe as respostas e o desempenho do aluno neste quiz.</p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status do Aluno</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full mt-1 ${
                submitted 
                  ? "bg-green-100 text-green-700" 
                  : "bg-amber-100 text-amber-700"
              }`}>
                {submitted ? "Concluído" : "Respondendo..."}
              </span>
            </div>
          </div>

          {/* Performance Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4 border border-muted bg-background rounded-2xl flex flex-col justify-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Nota Parcial</span>
              <h2 className="text-3xl font-black text-primary mt-1">{score} / {questions.length} acertos</h2>
            </div>
            <div className="card p-4 border border-muted bg-background rounded-2xl flex flex-col justify-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Progresso do Teste</span>
              <h2 className="text-3xl font-black text-foreground mt-1">
                {Object.keys(studentAnswers).length} de {questions.length} respondidas
              </h2>
            </div>
          </div>

          {/* List of Questions with Student Selections */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-base text-foreground">Relatório de Questões</h4>
            
            <div className="space-y-3">
              {questions.map((q: QuizQuestion, idx: number) => {
                const answer = studentAnswers[q.id] || "";
                const hasAnswered = !!answer;
                const isCorrect = hasAnswered && (q.type === "multiple-choice"
                  ? answer === q.correctOptionId
                  : normalizeText(answer) === normalizeText(q.correctWrittenAnswer || ""));

                return (
                  <div key={q.id} className="quiz-teacher-question-row flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h5 className="font-bold text-base text-foreground">
                        {idx + 1}. {q.questionText}
                      </h5>
                      {hasAnswered ? (
                        <span className={`shrink-0 flex items-center gap-1 text-xs font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {isCorrect ? "Acertou" : "Errou"}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">Aguardando resposta...</span>
                      )}
                    </div>

                    {hasAnswered && (
                      <div className="text-sm space-y-1 pl-4 border-l-2 border-muted text-muted-foreground">
                        <p>
                          Resposta do Aluno: <strong className={isCorrect ? "text-green-600" : "text-red-600"}>
                            {q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === answer)?.text || answer : answer}
                          </strong>
                        </p>
                        {!isCorrect && (
                          <p>
                            Resposta correta: <strong className="text-green-600">
                              {q.type === "multiple-choice" ? q.options?.find((o: QuizQuestionOption) => o.id === q.correctOptionId)?.text : q.correctWrittenAnswer}
                            </strong>
                          </p>
                        )}
                        <p className="pt-2 text-xs text-foreground bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-xl font-normal leading-normal">
                          <strong>Explicação didática fornecida: </strong>
                          {q.type === "multiple-choice" ? q.explanations[answer || q.correctOptionId || ""] : q.explanations.general}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end gap-3">
            <button
              onClick={() => {
                if (window.confirm("Isso apagará o progresso atual do aluno. Tem certeza que deseja reiniciar o quiz?")) {
                  updateAttributes({ questions: [], studentAnswers: {}, submitted: false });
                  publishState({
                    studentAnswers: {},
                    submitted: false,
                    currentIndex: 0
                  });
                  toast.success("Quiz reiniciado com sucesso!");
                }
              }}
              className="quiz-btn-duo incorrect-btn px-6 text-sm"
            >
              Reiniciar / Apagar Quiz
            </button>
          </div>
        </div>
      )}

    </NodeViewWrapper>
  );
}

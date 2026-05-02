"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Lesson, LessonContentBlock, Quiz, QuizQuestion } from "@/modules/course/course.types";
import { updateLessonAction, createQuizAction } from "@/modules/course/course.actions";
import { notify } from "@/components/ui/toaster";
import {
  Plus,
  Video,
  FileText,
  Trash2,
  Save,
  PlayCircle,
  HardDrive,
  Eye,
  HelpCircle,
  X,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/ui/video-player";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type JSONContent } from "@tiptap/core";
import { z } from "zod";
import { Field } from "@/components/ui/field";

const lessonFormSchema = z.object({
  title: z.string().min(1, "titleRequired"),
  duration: z.string().nullable().optional(),
  contentBlocks: z.array(z.any()),
  quizId: z.string().uuid().nullable().optional(),
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

interface LessonEditorClientProps {
  initialLesson: Lesson;
  courseId: string;
  availableQuizzes: Quiz[];
}

export function LessonEditorClient({ initialLesson, courseId, availableQuizzes }: LessonEditorClientProps) {
  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  // Tabs State
  const [activeTab, setActiveTab] = useState("content");

  // Lesson Form
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: initialLesson.title,
      duration: initialLesson.duration || "0",
      contentBlocks: initialLesson.contentBlocks || [],
      quizId: initialLesson.quizId || null,
    }
  });

  const { handleSubmit, formState: { isDirty, isSubmitting, errors } } = form;

  // Blocks Local State (for easier manipulation before form commit if needed, or use field array)
  // For simplicity here, we'll sync with form directly or use form.watch
  const title = form.watch("title");
  const duration = form.watch("duration");
  const blocks = form.watch("contentBlocks") || [];
  const selectedQuizId = form.watch("quizId");

  // Quiz Editor State
  const currentQuiz = availableQuizzes.find(q => q.id === selectedQuizId);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(currentQuiz?.questions || []);
  const [passingScore, setPassingScore] = useState(currentQuiz?.passingScore || 70);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

  // Quiz Player State (Preview)
  const [isPreviewingQuiz, setIsPreviewingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);

  const handleSave = async (values: LessonFormValues) => {
    let finalQuizId = selectedQuizId;

    const promise = (async () => {
      // If we are editing questions but haven't saved the quiz yet, or if we want to update it
      if (isCreatingQuiz || (quizQuestions.length > 0 && !selectedQuizId)) {
        const quizResult = await createQuizAction({
          courseId,
          title: `Quiz: ${values.title}`,
          questions: quizQuestions,
          passingScore,
        });

        if (quizResult?.data?.success && quizResult.data.data) {
          finalQuizId = quizResult.data.data.id;
        } else {
          throw new Error(quizResult?.data?.error || t('quizSaveError') || "Erro ao salvar quiz");
        }
      }

      const result = await updateLessonAction({
        courseId,
        lessonId: initialLesson.id,
        data: {
          title: values.title,
          duration: values.duration ?? undefined,
          contentBlocks: values.contentBlocks,
          quizId: finalQuizId,
        },
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || tCommon("error"));
      }

      return result;
    })();

    notify.promise(promise, {
      loading: t('savingLesson') || "Salvando aula...",
      success: () => {
        form.reset(values);
        setIsCreatingQuiz(false);
        router.refresh();
        return t('lessonUpdatedSuccess') || "Aula atualizada com sucesso!";
      },
      error: (err: unknown) => (err as Error)?.message || tCommon('error') || "Ocorreu um erro"
    });
  };

  const addBlock = (type: "text" | "video") => {
    const currentBlocks = form.getValues("contentBlocks") || [];
    const newBlock: LessonContentBlock = type === "video"
      ? { type: "video", url: "", provider: "youtube" }
      : { type: "text", content: { type: "doc", content: [] } };

    form.setValue("contentBlocks", [...currentBlocks, newBlock], { shouldDirty: true });
  };

  const removeBlock = (index: number) => {
    const currentBlocks = form.getValues("contentBlocks") || [];
    form.setValue("contentBlocks", currentBlocks.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const updateTextBlock = (index: number, content: JSONContent) => {
    const currentBlocks = [...(form.getValues("contentBlocks") || [])];
    currentBlocks[index] = { type: "text", content };
    form.setValue("contentBlocks", currentBlocks, { shouldDirty: true });
  };

  const updateVideoBlock = (index: number, url: string) => {
    const currentBlocks = [...(form.getValues("contentBlocks") || [])];
    let provider: "youtube" | "drive" | "storage" = "storage";
    if (url.includes("youtube.com") || url.includes("youtu.be")) provider = "youtube";
    else if (url.includes("drive.google.com")) provider = "drive";
    currentBlocks[index] = { type: "video", url, provider };
    form.setValue("contentBlocks", currentBlocks, { shouldDirty: true });
  };

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      id: crypto.randomUUID(),
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
    }]);
    setIsCreatingQuiz(true);
    form.setValue("quizId", null, { shouldDirty: true }); // Reset selected quiz to force create new one or handle update
  };

  return (
    <div>
      <Header
        title={initialLesson.title}
        showSubHeader={false}
        backHref={`/hub/admin/courses/${courseId}`}
      />

      <main className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Lesson Settings & Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6 lg:sticky lg:top-24"
          >
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">{t('settings') || "Configurações"}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('lessonAndNavigation') || "Aula e Navegação"}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                <Field label={t('lessonTitle') || "Título da Aula"} required error={errors.title?.message === "titleRequired" ? (t('titleRequired') || "O título é obrigatório") : errors.title?.message}>
                  <Input {...form.register("title")} placeholder={t('lessonTitlePlaceholder') || "Ex: Introdução ao Verbo To Be"} />
                </Field>

                <Field label={t('durationMinutes') || "Duração (minutos)"} error={errors.duration?.message}>
                  <Input {...form.register("duration")} placeholder={t('durationPlaceholder') || "Ex: 15"} />
                </Field>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl gap-2 font-bold"
                    disabled={(!isDirty && !isCreatingQuiz) || isSubmitting}
                  >
                    {isSubmitting ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<div className="flex items-center gap-2"><Save className="h-4 w-4" /> {t('saveChanges') || "Salvar Alterações"}</div>)}
                  </Button>
                </div>
              </form>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("content")}
                  className={cn(
                    "w-full h-14 flex items-center gap-4 px-4 rounded-2xl transition-all group",
                    activeTab === "content"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "content" ? "bg-white/20" : "bg-slate-100 dark:bg-slate-900 group-hover:bg-slate-200"
                  )}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm leading-tight">{t('content') || "Conteúdo"}</span>
                    <span className={cn("text-[10px] uppercase tracking-widest font-black", activeTab === "content" ? "text-white/60" : "text-muted-foreground")}>{t('lesson') || "Aula"}</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("quiz")}
                  className={cn(
                    "w-full h-14 flex items-center gap-4 px-4 rounded-2xl transition-all group",
                    activeTab === "quiz"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "quiz" ? "bg-white/20" : "bg-slate-100 dark:bg-slate-900 group-hover:bg-slate-200"
                  )}>
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm leading-tight">{t('assessment') || "Avaliação"}</span>
                    <span className={cn("text-[10px] uppercase tracking-widest font-black", activeTab === "quiz" ? "text-white/60" : "text-muted-foreground")}>{t('quiz') || "Quiz"}</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "w-full h-14 flex items-center gap-4 px-4 rounded-2xl transition-all group",
                    activeTab === "preview"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-900"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                    activeTab === "preview" ? "bg-white/20" : "bg-slate-100 dark:bg-slate-900 group-hover:bg-slate-200"
                  )}>
                    <Eye className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm leading-tight">{t('preview') || "Visualizar"}</span>
                    <span className={cn("text-[10px] uppercase tracking-widest font-black", activeTab === "preview" ? "text-white/60" : "text-muted-foreground")}>{t('demo') || "Demo"}</span>
                  </div>
                </button>
              </div>
            </Card>

            {/* Status Info */}
            <Card className="p-6 bg-primary/5 border-primary/10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm">
                  {blocks.length}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{t('contentBlocks') || "Blocos de Conteúdo"}</h4>
                  <p className="text-xs text-muted-foreground">{t('videosAndTexts', { videos: blocks.filter(b => b.type === "video").length, texts: blocks.filter(b => b.type === "text").length }) || `${blocks.filter(b => b.type === "video").length} Vídeos e ${blocks.filter(b => b.type === "text").length} Textos`}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: Tab Contents */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8"
          >
            <AnimatePresence mode="wait">
              {activeTab === "content" && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {blocks.map((block, index) => (
                    <Card key={index} className="relative group border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {block.type === "video" ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{t('blockNumber', { number: index + 1 }) || `Bloco ${index + 1}`}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{block.type === "video" ? (t('videoLesson') || "Vídeo Aula") : (t('textContent') || "Conteúdo de Texto")}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:bg-destructive/10" onClick={() => removeBlock(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {block.type === "video" ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {block.provider === "youtube" ? <PlayCircle className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
                            </div>
                            <Input
                              className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-base"
                              placeholder={t('videoLinkPlaceholder') || "Link do YouTube ou Google Drive..."}
                              value={block.url}
                              onChange={(e) => updateVideoBlock(index, e.target.value)}
                            />
                          </div>
                          {block.url && (
                            <div className="aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
                              <VideoPlayer url={block.url} provider={block.provider} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <RichTextEditor content={block.content} onChange={(content) => updateTextBlock(index, content)} />
                      )}
                    </Card>
                  ))}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="h-24 rounded-3xl border-dashed border-2 flex flex-col gap-2 transition-all hover:bg-primary/5 hover:border-primary"
                      onClick={() => addBlock("video")}
                    >
                      <Video className="h-6 w-6 text-primary mr-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">{t('addVideo') || "Adicionar Vídeo"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 rounded-3xl border-dashed border-2 flex flex-col gap-2 transition-all hover:bg-primary/5 hover:border-primary"
                      onClick={() => addBlock("text")}
                    >
                      <FileText className="h-6 w-6 text-primary mr-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">{t('addText') || "Adicionar Texto"}</span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "quiz" && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold">{t('lessonAssessment') || "Avaliação da Aula"}</h3>
                        <p className="text-sm text-muted-foreground">{t('configureQuestionsDesc') || "Configure as questões que o aluno deve responder ao final da aula."}</p>
                      </div>
                      {quizQuestions.length > 0 && (
                        <Button variant="outline" className="rounded-xl" onClick={addQuestion}>
                          <Plus className="h-4 w-4 mr-2" />
                          {t('newQuestion') || "Nova Questão"}
                        </Button>
                      )}
                    </div>

                    <div className="max-w-xs mb-8">
                      <Field label={t('passingScore') || "Nota de Corte (%)"}>
                        <Input
                          type="number"
                          value={passingScore}
                          onChange={(e) => {
                            setPassingScore(Number(e.target.value));
                            setIsCreatingQuiz(true);
                          }}
                          className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50"
                          min={0} max={100}
                        />
                      </Field>
                    </div>

                    <div className="space-y-6">
                      {quizQuestions.map((q, idx) => (
                        <div key={q.id || `q-${idx}`} className="p-6 border rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-6 relative group">
                          <Button
                            variant="ghost" size="icon"
                            className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-destructive"
                            onClick={() => {
                              setQuizQuestions(quizQuestions.filter(item => item.id !== q.id));
                              setIsCreatingQuiz(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('questionStatement', { number: idx + 1 }) || `Enunciado ${idx + 1}`}</label>
                            <Input
                              placeholder={t('typeQuestionPlaceholder') || "Digite a pergunta aqui..."}
                              value={q.text}
                              onChange={(e) => {
                                setQuizQuestions(quizQuestions.map(item => item.id === q.id ? { ...item, text: e.target.value } : item));
                                setIsCreatingQuiz(true);
                              }}
                              className="h-12 rounded-xl bg-white dark:bg-slate-900"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuizQuestions(quizQuestions.map(item => item.id === q.id ? { ...item, correctAnswer: opt } : item));
                                    setIsCreatingQuiz(true);
                                  }}
                                  className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    q.correctAnswer === opt && opt !== "" ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-muted-foreground"
                                  )}
                                >
                                  {q.correctAnswer === opt && opt !== "" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                </button>
                                <Input
                                  placeholder={t('optionNumber', { number: optIdx + 1 }) || `Opção ${optIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...q.options];
                                    newOptions[optIdx] = e.target.value;
                                    setQuizQuestions(quizQuestions.map(item => item.id === q.id ? { ...item, options: newOptions } : item));
                                    setIsCreatingQuiz(true);
                                  }}
                                  className="h-12 rounded-xl bg-white dark:bg-slate-900"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {quizQuestions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/20">
                          <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                            <HelpCircle className="h-8 w-8 text-primary opacity-50" />
                          </div>
                          <h4 className="font-bold">{t('noQuizCreated') || "Nenhum Quiz Criado"}</h4>
                          <p className="text-sm text-muted-foreground mb-6">{t('noAssessmentForLesson') || "Esta aula ainda não possui uma avaliação."}</p>
                          <Button onClick={addQuestion} className="rounded-2xl h-12 px-8">
                            <Plus className="h-5 w-5 mr-2" />
                            {t('createFirstQuestion') || "Criar Primeira Questão"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl p-8"
                >
                  <div className="max-w-3xl mx-auto space-y-12">
                    {isPreviewingQuiz ? (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {quizResult ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                            <div className={cn(
                              "h-24 w-24 rounded-full flex items-center justify-center shadow-lg",
                              quizResult.passed ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                            )}>
                              {quizResult.passed ? <CheckCircle2 className="h-12 w-12" /> : <AlertCircle className="h-12 w-12" />}
                            </div>
                            <div>
                              <h2 className="text-3xl font-bold mb-2">
                                {quizResult.passed ? (t('excellentWork') || "Excelente Trabalho!") : (t('almostThere') || "Quase lá!")}
                              </h2>
                              <p className="text-muted-foreground max-w-sm mx-auto">
                                {quizResult.passed
                                  ? (t('assessmentPassedMsg', { score: quizResult.score }) || `Você completou a avaliação com sucesso atingindo ${quizResult.score}% de acerto.`)
                                  : (t('assessmentFailedMsg', { score: quizResult.score, passingScore }) || `Você atingiu ${quizResult.score}%, mas precisa de pelo menos ${passingScore}% para passar.`)}
                              </p>
                            </div>
                            <div className="flex gap-4 pt-4">
                              <Button variant="outline" className="rounded-2xl h-12 px-8" onClick={() => {
                                setQuizResult(null);
                                setCurrentQuestionIndex(0);
                                setUserAnswers({});
                              }}>
                                {t('tryAgain') || "Tentar Novamente"}
                              </Button>
                              <Button className="rounded-2xl h-12 px-8" onClick={() => {
                                setIsPreviewingQuiz(false);
                                setQuizResult(null);
                                setCurrentQuestionIndex(0);
                                setUserAnswers({});
                              }}>
                                {t('backToLesson') || "Voltar para Aula"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between pb-6 border-b">
                              <div>
                                <Badge variant="outline" className="mb-2 uppercase tracking-widest text-[10px]">{t('lessonTitleBadge', { title }) || `AULA: ${title}`}</Badge>
                                <h2 className="text-2xl font-bold">{t('knowledgeAssessment') || "Avaliação de Conhecimento"}</h2>
                              </div>
                              <Button variant="ghost" className="rounded-xl h-10 w-10 p-0" onClick={() => setIsPreviewingQuiz(false)}>
                                <X className="h-5 w-5" />
                              </Button>
                            </div>

                            <div className="space-y-8 py-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {t('questionOf', { current: currentQuestionIndex + 1, total: quizQuestions.length }) || `Questão ${currentQuestionIndex + 1} de ${quizQuestions.length}`}
                                </span>
                                <div className="flex gap-1">
                                  {quizQuestions.map((_, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "h-1.5 w-8 rounded-full transition-all",
                                        i === currentQuestionIndex ? "bg-primary" : i < currentQuestionIndex ? "bg-primary/40" : "bg-slate-200 dark:bg-slate-800"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>

                              <h3 className="text-2xl font-semibold leading-tight">
                                {quizQuestions[currentQuestionIndex].text}
                              </h3>

                              <div className="grid grid-cols-1 gap-3">
                                {quizQuestions[currentQuestionIndex].options.filter(opt => opt !== "").map((opt, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setUserAnswers({ ...userAnswers, [quizQuestions[currentQuestionIndex].id]: opt })}
                                    className={cn(
                                      "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                      userAnswers[quizQuestions[currentQuestionIndex].id] === opt
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-100 dark:border-slate-800"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                                      userAnswers[quizQuestions[currentQuestionIndex].id] === opt ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"
                                    )}>
                                      {userAnswers[quizQuestions[currentQuestionIndex].id] === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                    <span className="font-medium">{opt}</span>
                                  </button>
                                ))}
                              </div>

                              <div className="flex justify-between pt-8 border-t">
                                <Button
                                  variant="ghost"
                                  className="rounded-xl h-12 px-6"
                                  disabled={currentQuestionIndex === 0}
                                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                                >
                                  {t('previous') || "Anterior"}
                                </Button>

                                {currentQuestionIndex === quizQuestions.length - 1 ? (
                                  <Button
                                    className="rounded-2xl h-12 px-10 font-bold"
                                    disabled={!userAnswers[quizQuestions[currentQuestionIndex].id]}
                                    onClick={() => {
                                      let correct = 0;
                                      quizQuestions.forEach(q => {
                                        if (userAnswers[q.id] === q.correctAnswer) correct++;
                                      });
                                      const score = Math.round((correct / quizQuestions.length) * 100);
                                      setQuizResult({ score, passed: score >= passingScore });
                                    }}
                                  >
                                    {t('finishAndSeeResult') || "Finalizar e Ver Resultado"}
                                  </Button>
                                ) : (
                                  <Button
                                    className="rounded-2xl h-12 px-10 font-bold"
                                    disabled={!userAnswers[quizQuestions[currentQuestionIndex].id]}
                                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                  >
                                    {t('nextQuestion') || "Próxima Questão"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">{title}</h1>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <Badge variant="secondary" className="rounded-lg">{duration || "0"} min</Badge>
                            <span className="text-xs uppercase font-bold tracking-widest">{t('contentBlocksCount', { count: blocks.length }) || `${blocks.length} Blocos de conteúdo`}</span>
                          </div>
                        </div>

                        <div className="space-y-12">
                          {blocks.map((block, i) => (
                            <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                              {block.type === "video" ? (
                                <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                                  <VideoPlayer url={block.url} provider={block.provider} />
                                </div>
                              ) : (
                                <div className="prose prose-slate dark:prose-invert max-w-none px-2">
                                  <RichTextEditor content={block.content} onChange={() => { }} editable={false} />
                                </div>
                              )}
                            </div>
                          ))}

                          {quizQuestions.length > 0 && (
                            <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{t('finalAssessmentAvailable') || "AVALIAÇÃO FINAL DISPONÍVEL"}</Badge>
                              <h3 className="text-2xl font-bold mb-6">{t('testYourKnowledge') || "Teste seus conhecimentos"}</h3>
                              <Card className="p-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center text-center shadow-inner">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                                  <HelpCircle className="h-10 w-10" />
                                </div>
                                <p className="text-muted-foreground mb-8 max-w-md">{t('readyForQuizDesc', { count: quizQuestions.length }) || `Ao completar todos os blocos de conteúdo acima, você estará pronto para o quiz de ${quizQuestions.length} questões.`}</p>
                                <Button className="rounded-3xl h-14 px-12 font-black text-lg shadow-xl shadow-primary/20 transition-transform hover:scale-105 active:scale-95" onClick={() => setIsPreviewingQuiz(true)}>
                                  {t('startQuizPreview') || "Iniciar Visualização do Quiz"}
                                </Button>
                              </Card>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { QuizQuestion, Language, Lesson } from "@/modules/curriculum/curriculum.types";
import { upsertRecessActivityAction } from "@/modules/curriculum/curriculum.actions";
import { notify } from "@/components/ui/toaster";
import {
  Save,
  FileText,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

const activityFormSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  languageId: z.string().uuid("Selecione um idioma"),
  nativeLanguageId: z.string().uuid("Selecione o idioma nativo"),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  contentJson: z.any().optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface RecessActivityEditorClientProps {
  initialActivity?: Lesson | null;
  languages: Language[];
}

export function RecessActivityEditorClient({ initialActivity, languages }: RecessActivityEditorClientProps) {
  const t = useTranslations("Recess");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("content");

  // Quiz Local State (Since it's embedded in Recess Activity)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(
    (initialActivity?.quizData?.questions || []).map((q: QuizQuestion) => ({
      ...q,
      id: q.id || crypto.randomUUID()
    }))
  );
  const [passingScore, setPassingScore] = useState(initialActivity?.quizData?.passingScore || 70);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: initialActivity?.title || "",
      languageId: initialActivity?.languageId || "",
      nativeLanguageId: initialActivity?.nativeLanguageId || "",
      difficulty: (initialActivity?.difficulty as ActivityFormValues["difficulty"]) || "A1",
      contentJson: initialActivity?.contentJson || { type: "doc", content: [] },
    } as ActivityFormValues
  });

  const { handleSubmit, formState: { isSubmitting, errors } } = form;

  const handleSave: SubmitHandler<ActivityFormValues> = async (values) => {
    const response = await upsertRecessActivityAction({
      id: initialActivity?.id,
      ...values,
      quizData: quizQuestions.length > 0 ? { questions: quizQuestions, passingScore } : null
    });

    if (response?.data?.success) {
      notify.success(initialActivity ? (t('activityUpdated') || "Atividade atualizada!") : (t('activityCreated') || "Atividade criada!"));
      router.push("/hub/teacher/recess");
      router.refresh();
    } else {
      notify.error(response?.data?.error || response?.serverError || (tCommon('error') || "Erro ao salvar atividade"));
    }
  };

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      id: crypto.randomUUID(),
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
    }]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={initialActivity ? (t('editActivity') || "Editar Atividade") : (t('newRecessActivity') || "Nova Atividade de Recesso")}
        subtitle={t('recessActivitySubtitle') || "As atividades de recesso são lições de fallback para seus alunos"}
      >
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          {tCommon('back') || "Voltar"}
        </Button>
      </Header>

      <main className="flex-1 p-4 md:p-6 container max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Settings */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card p-6 space-y-6">
              <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                <Field label={t('title') || "Título"} required error={errors.title?.message}>
                  <Input {...form.register("title")} placeholder={t('titlePlaceholder') || "Ex: Prática de Conversação"} />
                </Field>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={tCommon('language') || "Idioma Alvo"} required error={errors.languageId?.message}>
                      <Select 
                        onValueChange={(val) => form.setValue("languageId", val, { shouldDirty: true })}
                        defaultValue={form.getValues("languageId")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={tCommon('select') || "Selecione"} />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map(lang => (
                            <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label={tCommon('level') || "Nível"} required error={errors.difficulty?.message}>
                      <Select 
                        onValueChange={(val: ActivityFormValues["difficulty"]) => form.setValue("difficulty", val, { shouldDirty: true })}
                        defaultValue={form.getValues("difficulty")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={tCommon('select') || "Selecione"} />
                        </SelectTrigger>
                        <SelectContent>
                          {["A1", "A2", "B1", "B2", "C1", "C2"].map(lvl => (
                            <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label={tCommon('native_language') || "Idioma Nativo"} required error={errors.nativeLanguageId?.message}>
                    <Select 
                      onValueChange={(val) => form.setValue("nativeLanguageId", val, { shouldDirty: true })}
                      defaultValue={form.getValues("nativeLanguageId")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={tCommon('select') || "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2 font-bold h-12 rounded-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {initialActivity ? (tCommon('saveChanges') || "Salvar Alterações") : (t('createActivity') || "Criar Atividade")}
                </Button>
              </form>

              <div className="pt-6 border-t space-y-2">
                <Button
                  variant={activeTab === "content" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 h-12 rounded-md"
                  onClick={() => setActiveTab("content")}
                >
                  <FileText className="w-4 h-4" />
                  {t('activityContent') || "Conteúdo da Atividade"}
                </Button>
                <Button
                  variant={activeTab === "quiz" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 h-12 rounded-md"
                  onClick={() => setActiveTab("quiz")}
                >
                  <HelpCircle className="w-4 h-4" />
                  {t('quizEvaluation') || "Avaliação (Quiz)"}
                  {quizQuestions.length > 0 && <Badge className="ml-auto">{quizQuestions.length}</Badge>}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeTab === "content" ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {t('activityText') || "Texto da Atividade"}
                    </h3>
                    <RichTextEditor 
                      content={form.getValues("contentJson")} 
                      onChange={(val) => form.setValue("contentJson", val, { shouldDirty: true })}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold">{t('evaluation') || "Avaliação"}</h3>
                        <p className="text-sm text-muted-foreground">{t('addQuestionsSubtitle') || "Adicione questões para verificar o aprendizado."}</p>
                      </div>
                      <Button variant="outline" className="rounded-md" onClick={addQuestion}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('newQuestion') || "Nova Questão"}
                      </Button>
                    </div>

                    <div className="max-w-xs mb-8">
                      <Field label={t('passingScore') || "Nota de Corte (%)"}>
                        <Input
                          type="number"
                          value={passingScore}
                          onChange={(e) => setPassingScore(Number(e.target.value))}
                          className="h-12 rounded-md"
                          min={0} max={100}
                        />
                      </Field>
                    </div>

                    <div className="space-y-6">
                      {quizQuestions.map((q, idx) => (
                        <div key={q.id || `q-${idx}`} className="p-6 border rounded-2xl bg-muted/30 space-y-6 relative group">
                          <Button
                            variant="ghost" size="icon"
                            className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-destructive"
                            onClick={() => setQuizQuestions(quizQuestions.filter(item => item.id !== q.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{(t('question') || "Pergunta")} {idx + 1}</label>
                            <Input
                              placeholder={t('typeQuestionPlaceholder') || "Digite a pergunta..."}
                              value={q.text}
                              onChange={(e) => {
                                setQuizQuestions(quizQuestions.map(item => item.id === q.id ? { ...item, text: e.target.value } : item));
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuizQuestions(quizQuestions.map(item => item.id === q.id ? { ...item, correctAnswer: opt } : item));
                                  }}
                                  className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                                    q.correctAnswer === opt && opt !== "" ? "bg-primary text-white" : "bg-background border text-muted-foreground"
                                  )}
                                >
                                  {q.correctAnswer === opt && opt !== "" ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </button>
                                <Input
                                  placeholder={`${t('option') || "Opção"} ${optIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...q.options];
                                    newOptions[optIdx] = e.target.value;
                                    setQuizQuestions(quizQuestions.map(item => item.id === q.id ? { ...item, options: newOptions } : item));
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {quizQuestions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-3xl opacity-60">
                          <HelpCircle className="h-8 w-8 mb-2" />
                          <p className="text-sm font-medium">{t('noQuestionsAdded') || "Nenhuma questão adicionada"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

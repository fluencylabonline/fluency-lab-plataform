"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  studentProfileSurveySchema,
  type StudentProfileSurveyInput
} from "@/modules/learning/learning.schema";
import { notify } from "@/components/ui/toaster";
import { saveProfileSurveyAction, finalizeProfileAction } from "@/modules/learning/learning.actions";
import {
  User, History, Target, Calendar, Briefcase,
  Heart, Lightbulb, AlertTriangle, Settings,
  CheckCircle2, ChevronLeft, ChevronRight, Trash2
} from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton
} from "@/components/ui/vault";
import { archiveProfileAction } from "@/modules/learning/learning.actions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

interface StudentProfileSurveyProps {
  profileId?: string;
  studentId?: string;
  initialData?: StudentProfileSurveyInput;
  initialStep?: number;
  onComplete?: (profileId: string) => void;
}

export function StudentProfileSurvey({
  profileId: propProfileId,
  studentId,
  initialData,
  initialStep = 0,
  onComplete
}: StudentProfileSurveyProps) {
  const [profileId, setProfileId] = useState(propProfileId);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const [showDiscardVault, setShowDiscardVault] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Survey");

  const methods = useForm<StudentProfileSurveyInput>({
    resolver: zodResolver(studentProfileSurveySchema),
    defaultValues: initialData || {
      step1: { fullName: "", occupation: "", isMinor: false, birthDate: new Date().toISOString().split('T')[0] } as StudentProfileSurveyInput["step1"],
      step2: { selfAssessedLevel: "A1", previousStudy: false } as StudentProfileSurveyInput["step2"],
      step3: { mainGoals: [], commitmentLevel: 5 } as StudentProfileSurveyInput["step3"],
      step4: { weeklyFrequency: 2, dailyStudyTime: "none" } as StudentProfileSurveyInput["step4"],
      step5: { professionalArea: "", technicalVocabNeeded: false, usageType: "balanced", employmentStatus: "employed" } as StudentProfileSurveyInput["step5"],
      step6: { conversationTopics: "" } as StudentProfileSurveyInput["step6"],
      step7: { preferredMethods: [], activityPreferences: {} } as StudentProfileSurveyInput["step7"],
      step8: { mainDifficulties: [], speakingAnxiety: "none" } as StudentProfileSurveyInput["step8"],
      step9: { classExpectations: [], learningPace: "moderate", accentGoal: "intelligible", correctionStyle: "end_of_lesson" } as StudentProfileSurveyInput["step9"],
      step10: { generalObservations: "" } as StudentProfileSurveyInput["step10"],
    },
    mode: "onChange"
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("step", currentStep.toString());
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    }
  }, [currentStep, router]);

  useEffect(() => {
    const saved = localStorage.getItem(`survey_${profileId || "new"}`);
    if (saved && !initialData) {
      methods.reset(JSON.parse(saved) as StudentProfileSurveyInput);
    }
  }, [profileId, methods, initialData]);

  const saveDraft = async (data: StudentProfileSurveyInput, targetStep?: number) => {
    setIsSaving(true);
    try {
      const result = await saveProfileSurveyAction({
        id: profileId,
        studentId: studentId,
        responses: data
      });
      if (result?.data?.profile?.id) {
        const newId = result.data.profile.id;
        setProfileId(newId);
        localStorage.setItem(`survey_${newId}`, JSON.stringify(data));

        if (!propProfileId) {
          const params = new URLSearchParams(window.location.search);
          const stepToRedirect = targetStep !== undefined ? targetStep : currentStep;
          params.set("step", stepToRedirect.toString());
          router.replace(`${pathname.replace("/new", "")}/${newId}?${params.toString()}`);
        }
      }
    } catch (e) {
      console.error("Failed to save draft", e);
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async () => {
    const stepKey = `step${currentStep + 1}` as keyof StudentProfileSurveyInput;
    const isValid = await methods.trigger(stepKey);

    if (!isValid) {
      notify.error("Por favor, preencha os campos obrigatórios desta etapa.");
      return;
    }

    if (currentStep < 9) {
      const next = currentStep + 1;
      setDirection(1);
      setCurrentStep(next);
      saveDraft(methods.getValues(), next);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setDirection(-1);
      setCurrentStep(prev);
      saveDraft(methods.getValues(), prev);
    }
  };

  const handleComplete = async () => {
    if (!profileId) {
      notify.error("Erro: Perfil não identificado.");
      return;
    }

    setIsSaving(true);
    const result = await finalizeProfileAction({ profileId });
    if (result?.data?.success) {
      notify.success("Perfil finalizado com sucesso!");
      onComplete?.(profileId);
    } else {
      notify.error(result?.data?.error || "Erro ao finalizar perfil");
    }
    setIsSaving(false);
  };

  const handleDiscard = async () => {
    if (!profileId) {
      router.push("/hub/manager/students/onboarding");
      return;
    }

    setIsDiscarding(true);
    try {
      const result = await archiveProfileAction({ profileId });
      if (result?.data?.success) {
        notify.success("Rascunho descartado");
        localStorage.removeItem(`survey_${profileId}`);
        localStorage.removeItem(`survey_new`);
        router.push("/hub/manager/students/onboarding");
      } else {
        notify.error(result?.data?.error || "Erro ao descartar");
      }
    } catch {
      notify.error("Erro ao processar solicitação");
    } finally {
      setIsDiscarding(false);
      setShowDiscardVault(false);
    }
  };

  const steps = [
    {
      title: "Informações Básicas",
      icon: User,
      accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      content: (
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Nome Completo</Label>
            <Input
              {...methods.register("step1.fullName")}
              placeholder="Nome completo do aluno"
              className="h-11 text-base border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 bg-background/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Nascimento</Label>
              <Input type="date" {...methods.register("step1.birthDate")} className="h-11 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 bg-background/60" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Ocupação</Label>
              <Input {...methods.register("step1.occupation")} placeholder="Ex: Engenheiro..." className="h-11 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 bg-background/60" />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Histórico de Estudo",
      icon: History,
      accent: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      dot: "bg-indigo-500",
      content: (
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('selfDeclaredLevel') || "Nível autodeclarado"}</Label>
            <Controller
              name="step2.selfAssessedLevel"
              control={methods.control}
              render={({ field }) => (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map(lvl => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => field.onChange(lvl)}
                      className={cn(
                        "flex flex-col items-center justify-center py-4 rounded-md border transition-all duration-150 font-bold text-xl",
                        field.value === lvl
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/50 bg-background/60 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-md border border-border/40">
            <Controller
              name="step2.previousStudy"
              control={methods.control}
              render={({ field }) => (
                <Checkbox
                  id="previousStudy"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="previousStudy" className="text-sm cursor-pointer leading-snug">O aluno já estudou este idioma antes?</Label>
          </div>
        </div>
      )
    },
    {
      title: "Objetivos Principais",
      icon: Target,
      accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
      content: (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">O que o aluno deseja alcançar?</Label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "fluency", label: "Fluência Geral", emoji: "🗣️" },
              { id: "travel", label: "Viagens", emoji: "✈️" },
              { id: "work", label: "Trabalho", emoji: "💼" },
              { id: "exams", label: "Certificações", emoji: "📜" },
              { id: "hobby", label: "Hobby", emoji: "🎯" },
              { id: "moving", label: "Morar Fora", emoji: "🌍" }
            ].map(goal => (
              <Controller
                key={goal.id}
                name="step3.mainGoals"
                control={methods.control}
                render={({ field }) => {
                  const checked = field.value?.includes(goal.id);
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const current = field.value || [];
                        if (checked) field.onChange(current.filter((g: string) => g !== goal.id));
                        else field.onChange([...current, goal.id]);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-md border text-left transition-all duration-150",
                        checked
                          ? "border-primary/60 bg-primary/5 text-foreground"
                          : "border-border/50 bg-background/60 text-muted-foreground hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <span className="text-lg">{goal.emoji}</span>
                      <span className={cn("text-sm font-medium", checked && "text-primary")}>{goal.label}</span>
                    </button>
                  );
                }}
              />
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Tempo Disponível",
      icon: Calendar,
      accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      dot: "bg-orange-500",
      content: (
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('classesPerWeek') || "Aulas por semana"}</Label>
            <Input
              type="number"
              {...methods.register("step4.weeklyFrequency", { valueAsNumber: true })}
              className="h-11 text-base w-32 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 bg-background/60"
              min={1} max={7}
            />
          </div>
          <div className="grid gap-3">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Estudo autônomo diário</Label>
            <Controller
              name="step4.dailyStudyTime"
              control={methods.control}
              render={({ field }) => (
                <div className="grid gap-2">
                  {[
                    { id: "none", label: "Apenas aulas" },
                    { id: "5_30min", label: "5 a 30 minutos" },
                    { id: "30_60min", label: "30 a 60 minutos" },
                    { id: "1h_plus", label: "Mais de 1 hora" }
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => field.onChange(opt.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all duration-150",
                        field.value === opt.id
                          ? "border-primary/60 bg-primary/5"
                          : "border-border/50 bg-background/60 hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <div className={cn(
                        "size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        field.value === opt.id ? "border-primary" : "border-muted-foreground/40"
                      )}>
                        {field.value === opt.id && <div className="size-2 rounded-full bg-primary" />}
                      </div>
                      <span className={cn("text-sm font-medium", field.value === opt.id ? "text-foreground" : "text-muted-foreground")}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>
      )
    },
    {
      title: "Carreira",
      icon: Briefcase,
      accent: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      dot: "bg-cyan-500",
      content: (
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('professionalArea') || "Área profissional"}</Label>
            <Input {...methods.register("step5.professionalArea")} placeholder="Ex: Tecnologia..." className="h-11 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 bg-background/60" />
          </div>
          <div className="grid gap-3">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('usageAtWork') || "Uso do idioma no trabalho"}</Label>
            <Controller
              name="step5.usageType"
              control={methods.control}
              render={({ field }) => (
                <div className="flex gap-2.5 flex-wrap">
                  {[
                    { id: "writing", label: "Escrita" },
                    { id: "speaking", label: "Fala" },
                    { id: "balanced", label: "Equilibrado" }
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => field.onChange(opt.id)}
                      className={cn(
                        "px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-150",
                        field.value === opt.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/50 bg-background/60 text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>
      )
    },
    {
      title: "Interesses",
      icon: Heart,
      accent: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      dot: "bg-pink-500",
      content: (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('favoriteTopics') || "Temas favoritos de conversa"}</Label>
          <Textarea
            {...methods.register("step6.conversationTopics" as keyof StudentProfileSurveyInput)}
            placeholder="Ex: Cinema, Esportes, Política, Tecnologia..."
            className="min-h-[160px] border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 bg-background/60 text-base resize-none"
          />
          <p className="text-xs text-muted-foreground/60">Quanto mais detalhes, mais personalizado será o perfil.</p>
        </div>
      )
    },
    {
      title: "Estilo de Aprendizado",
      icon: Lightbulb,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      content: (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Métodos mais eficazes (até 3)</Label>
          <div className="grid gap-2">
            {[
              { id: "visual", label: "Visual", sub: "Vídeos, Imagens" },
              { id: "auditory", label: "Auditivo", sub: "Áudio, Podcasts" },
              { id: "reading", label: "Leitura e Escrita", sub: "Textos, Exercícios" },
              { id: "practical", label: "Prática Oral", sub: "Conversação imediata" },
              { id: "grammar", label: "Gramática", sub: "Explicação estrutural" }
            ].map(method => (
              <Controller
                key={method.id}
                name="step7.preferredMethods"
                control={methods.control}
                render={({ field }) => {
                  const checked = field.value?.includes(method.id);
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const current = field.value || [];
                        if (checked) field.onChange(current.filter((m: string) => m !== method.id));
                        else field.onChange([...current, method.id]);
                      }}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-md border text-left transition-all duration-150",
                        checked
                          ? "border-primary/60 bg-primary/5"
                          : "border-border/50 bg-background/60 hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-medium", checked ? "text-foreground" : "text-muted-foreground")}>{method.label}</p>
                        <p className="text-xs text-muted-foreground/60">{method.sub}</p>
                      </div>
                      <div className={cn(
                        "size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {checked && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                    </button>
                  );
                }}
              />
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Bloqueios",
      icon: AlertTriangle,
      accent: "bg-red-500/10 text-red-600 dark:text-red-400",
      dot: "bg-red-500",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('mainDifficulties') || "Principais dificuldades"}</Label>
            <div className="flex flex-wrap gap-2">
              {["Pronúncia", "Gramática", "Vocabulário", "Escuta", "Falar em público"].map(d => (
                <Controller
                  key={d}
                  name="step8.mainDifficulties"
                  control={methods.control}
                  render={({ field }) => {
                    const checked = field.value?.includes(d);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const current = field.value || [];
                          if (checked) field.onChange(current.filter((v: string) => v !== d));
                          else field.onChange([...current, d]);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150",
                          checked
                            ? "border-destructive/60 bg-destructive/10 text-destructive dark:text-red-400"
                            : "border-border/50 bg-background/60 text-muted-foreground hover:border-destructive/30"
                        )}
                      >
                        {d}
                      </button>
                    );
                  }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('speakingAnxiety') || "Ansiedade ao falar"}</Label>
            <Controller
              name="step8.speakingAnxiety"
              control={methods.control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {[
                    { v: "none", label: "Zero" },
                    { v: "low", label: "Baixa" },
                    { v: "medium", label: "Média" },
                    { v: "high", label: "Alta" },
                    { v: "very_high", label: "Máxima" }
                  ].map(({ v, label }) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => field.onChange(v)}
                      className={cn(
                        "flex-1 py-2.5 rounded-md border text-xs font-semibold transition-all duration-150",
                        field.value === v
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/50 bg-background/60 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>
      )
    },
    {
      title: "Personalização",
      icon: Settings,
      accent: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
      dot: "bg-zinc-500",
      content: (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('preferredPace') || "Ritmo de aula preferido"}</Label>
          <Controller
            name="step9.learningPace"
            control={methods.control}
            render={({ field }) => (
              <div className="grid gap-3">
                {[
                  { id: "intense", label: "Intenso e Focado", sub: "Máximo aproveitamento, mínima distração", icon: "⚡" },
                  { id: "moderate", label: "Moderado e Constante", sub: "Ritmo estável com variação de atividades", icon: "🎯" },
                  { id: "relaxed", label: "Relaxado e sem Pressão", sub: "Aprendizado leve e sem cobranças", icon: "🌿" }
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => field.onChange(opt.id)}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-md border-2 text-left transition-all duration-150",
                      field.value === opt.id
                        ? "border-primary/60 bg-primary/5"
                        : "border-border/40 bg-background/60 hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className={cn("font-semibold text-sm", field.value === opt.id ? "text-foreground" : "text-muted-foreground")}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{opt.sub}</p>
                    </div>
                    <div className={cn(
                      "ml-auto size-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      field.value === opt.id ? "border-primary" : "border-muted-foreground/30"
                    )}>
                      {field.value === opt.id && <div className="size-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      )
    },
    {
      title: "Finalização",
      icon: CheckCircle2,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      content: (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/60 dark:bg-emerald-950/20">
            <div className="size-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-emerald-800 dark:text-emerald-300">Perfil Quase Pronto!</h3>
              <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70 mt-1 max-w-xs">
                Nossa IA irá processar as respostas para criar o perfil único do aluno.
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{t('finalNotes') || "Observações finais"}</Label>
            <Textarea
              {...methods.register("step10.generalObservations")}
              placeholder="Ex: Aluno tem pressa para uma entrevista mês que vem..."
              className="min-h-[120px] border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 bg-background/60 resize-none"
            />
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="relative flex flex-col min-h-screen">
      <Header
        title="Montar Perfil do Aluno"
        showSubHeader={false}
      />

      <main className="flex-1 container max-w-2xl py-8 pb-32">
        {/* Step pills nav */}
        <div className="flex items-center gap-1.5 mb-8 px-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === currentStep
                  ? "flex-4 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                  : i < currentStep
                    ? "flex-1 bg-primary/40"
                    : "flex-1 bg-border/40"
              )}
            />
          ))}
        </div>

        <div className="space-y-10">
          {/* Step header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-sm", currentStepData.accent)}>
                <currentStepData.icon className="size-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  Passo {currentStep + 1} de {steps.length}
                </p>
                <h2 className="text-2xl font-bold tracking-tight">{currentStepData.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isSaving && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Spinner />
                  <span className="hidden sm:inline">Salvando...</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiscardVault(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="text-xs font-semibold hidden md:inline uppercase tracking-wider">Descartar</span>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                initial={{ x: direction * 30, opacity: 0, filter: "blur(10px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: -direction * 30, opacity: 0, filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <FormProvider {...methods}>
                  {currentStepData.content}
                </FormProvider>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Navigation - Sticky at bottom of content area */}
      <footer className="sticky bottom-0 z-20 w-full bg-background/40 backdrop-blur-xl border-t border-border/40 py-4 px-6 mt-auto">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={prevStep}
            disabled={currentStep === 0 || isSaving}
          >
            <ChevronLeft className="size-5" />
            Anterior
          </Button>

          <Button
            size="lg"
            onClick={nextStep}
            disabled={isSaving}
          >
            {currentStep === 9 ? (
              <>
                Finalizar Perfil
                <CheckCircle2 className="size-5" />
              </>
            ) : (
              <>
                Próximo Passo
                <ChevronRight className="size-5" />
              </>
            )}
          </Button>
        </div>
      </footer>

      <Vault open={showDiscardVault} onOpenChange={setShowDiscardVault}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>Descartar Rascunho?</VaultTitle>
            <VaultDescription>
              Isso irá interromper a montagem do perfil e arquivar este rascunho. Esta ação não pode ser desfeita.
            </VaultDescription>
          </VaultHeader>

          <VaultBody>
            <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/8 border border-destructive/20 text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                O progresso atual será perdido e o perfil será movido para o arquivo.
              </p>
            </div>
          </VaultBody>

          <VaultFooter>
            <VaultSecondaryButton onClick={() => setShowDiscardVault(false)} disabled={isDiscarding}>
              Continuar Editando
            </VaultSecondaryButton>
            <VaultPrimaryButton variant="destructive" onClick={handleDiscard} disabled={isDiscarding}>
              {isDiscarding ? "Descartando..." : "Sim, Descartar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
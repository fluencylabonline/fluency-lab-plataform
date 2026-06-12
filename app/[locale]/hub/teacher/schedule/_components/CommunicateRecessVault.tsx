"use client";

import { useState, useTransition } from "react";
import {
  Vault, VaultContent, VaultHeader, VaultTitle, VaultDescription,
  VaultBody, VaultFooter, VaultPrimaryButton, VaultSecondaryButton, VaultIcon,
  VaultTrigger
} from "@/components/ui/vault";
import { Calendar } from "@/components/ui/calendar";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  validateRecessSLAAction,
  getRecessImpactAction,
  confirmRecessAction,
  getTeacherRecessesAction
} from "@/modules/scheduling/scheduling.actions";
import { getRecessActivitiesAction } from "@/modules/curriculum/curriculum.actions";
import { notify } from "@/components/ui/toaster";
import { AlertCircle, CheckCircle2, ChevronRight, Users, BookOpen, Loader2, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RecessRequest } from "@/modules/scheduling/scheduling.types";

interface CommunicateRecessVaultProps {
  teacherId: string;
  iconOnly?: boolean;
}

type Step = "dates" | "impact" | "fallback" | "review" | "success";

interface SLAResult {
  isAutomatic: boolean;
  daysAdvance: number;
  duration: number;
  requiresReview: boolean;
}

interface StudentImpact {
  id: string;
  name: string;
  language: string;
  classesCount: number;
}

interface ImpactData {
  totalClasses: number;
  totalStudents: number;
  studentsAffected: StudentImpact[];
  affectedClasses: Array<{
    id: string;
    studentId: string;
    studentName: string;
    startAt: Date;
    endAt: Date;
    language: string;
  }>;
}



const fallbackSchema = z.object({
  config: z.record(z.string(), z.object({
    lessonId: z.string().min(1, "Campo obrigatório"),
    message: z.string().optional()
  }))
});

type FallbackFormValues = z.infer<typeof fallbackSchema>;


export function CommunicateRecessVault({ teacherId, iconOnly }: CommunicateRecessVaultProps) {
  const t = useTranslations("Recess");
  const tCommon = useTranslations("Common");
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("dates");
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), 21), // Default to 21 days ahead for SLA
    to: addDays(new Date(), 28),
  });

  const [isPending, startTransition] = useTransition();
  const [slaResult, setSlaResult] = useState<SLAResult | null>(null);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);

  // SWR for activities
  const { data: recessActivities, isLoading: isLoadingActivities } = useSWR(
    isOpen ? ["recess-activities", teacherId] : null,
    () => getRecessActivitiesAction({ teacherId }).then(res => res?.data?.data || [])
  );

  // SWR for existing recesses
  const { data: rawExistingRecesses } = useSWR(
    isOpen ? ["teacher-recesses", teacherId] : null,
    () => getTeacherRecessesAction({ teacherId }).then(res => res?.data?.data || [])
  );

  const existingRecesses = (rawExistingRecesses || []).map((r: RecessRequest) => ({
    startDate: new Date(r.startDate),
    endDate: new Date(r.endDate)
  }));

  const form = useForm<FallbackFormValues>({
    resolver: zodResolver(fallbackSchema),
    defaultValues: { config: {} }
  });


  const hasOverlap = date?.from && date?.to && existingRecesses.some(r => {
    return (date.from! <= r.endDate && date.to! >= r.startDate);
  });

  const handleNextToImpact = () => {
    if (!date?.from || !date?.to) {
      notify.error("Selecione um período válido.");
      return;
    }

    startTransition(async () => {
      // 1. Validate SLA
      const slaRes = await validateRecessSLAAction({
        startDate: date.from!,
        endDate: date.to!,
        teacherId
      });
      if (slaRes?.serverError || slaRes?.data?.success === false) {
        notify.error(slaRes?.serverError || (slaRes?.data as { error?: string })?.error || "Erro ao validar SLA");
        return;
      }
      const slaResultData = slaRes?.data;
      if (slaResultData?.success && slaResultData.data) {
        setSlaResult(slaResultData.data);
      }

      // 2. Get Impact
      const impactRes = await getRecessImpactAction({
        startDate: date.from!,
        endDate: date.to!,
        teacherId
      });
      if (impactRes?.serverError || impactRes?.data?.success === false) {
        notify.error(impactRes?.serverError || (impactRes?.data as { error?: string })?.error || "Erro ao carregar impacto");
        return;
      }
      const impactResult = impactRes?.data;
      if (impactResult?.success && impactResult.data) {
        setImpactData(impactResult.data);

        // Initialize fallback config with classId as key
        const initialFallback: Record<string, { lessonId: string }> = {};
        impactResult.data.affectedClasses.forEach((cls) => {
          initialFallback[cls.id] = { lessonId: recessActivities?.[0]?.id || "" };
        });
        form.reset({ config: initialFallback });
        setStep("impact");
      }
    });
  };

  const handleConfirm = form.handleSubmit((data) => {
    startTransition(async () => {
      const res = await confirmRecessAction({
        startDate: date!.from!,
        endDate: date!.to!,
        fallbackConfig: data.config
      });

      if (res?.data?.success) {
        setStep("success");
        notify.success(t('recessScheduled') || "Recesso agendado com sucesso!");
      } else {
        const errorMsg = res?.serverError || (res?.data as { error?: string })?.error || "Erro ao confirmar recesso";
        notify.error(errorMsg);
      }
    });
  });

  const reset = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep("dates");
      setSlaResult(null);
      setImpactData(null);
      form.reset();
    }, 300);
  };

  return (
    <Vault open={isOpen} onOpenChange={setIsOpen}>
      <VaultTrigger asChild>
        {iconOnly ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="sr-only">{t('communicateRecess') || "Comunicar Recesso"}</span>
          </Button>
        ) : (
          <Button variant="outline" className="gap-2 font-bold">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {t('communicateRecess') || "Comunicar Recesso"}
          </Button>
        )}
      </VaultTrigger>

      <VaultContent className="sm:max-w-xl">
        <AnimatePresence mode="wait">
          {step === "dates" && (
            <motion.div key="step-dates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <VaultHeader>
                <VaultIcon type="calendar" />
                <VaultTitle>{t('recessPeriod') || "Período de Recesso"}</VaultTitle>
                <VaultDescription>
                  {t('recessPeriodDesc') || "Selecione as datas de início e fim. O sistema validará automaticamente seu SLA de 20 dias de aviso prévio."}
                </VaultDescription>
              </VaultHeader>
              <VaultBody className="flex flex-col items-center">
                <Calendar
                  mode="range"
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                  locale={ptBR}
                  disabled={[
                    { before: addDays(new Date(), 1) },
                    ...existingRecesses.map(r => ({ from: r.startDate, to: r.endDate }))
                  ]}
                  className="rounded-md border shadow-sm scale-110 my-4"
                />

                {date?.from && date?.to && (
                  <div className="w-full p-4 bg-muted/50 rounded-md border border-border/50 text-sm flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('start') || "Início"}</span>
                      <span className="font-bold">{format(date.from, "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('end') || "Fim"}</span>
                      <span className="font-bold">{format(date.to, "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                  </div>
                )}

                {date?.from && (
                  <div className="w-full mt-4">
                    {(() => {
                      const daysAdvance = differenceInCalendarDays(date.from, new Date());
                      const duration = date.to ? differenceInCalendarDays(date.to, date.from) : 0;
                      const isAutomatic = daysAdvance >= 20 && duration <= 15;

                      if (hasOverlap) {
                        return (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex gap-3 items-center">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <p className="text-[10px] text-red-600 font-bold">
                              {t('overlapDetected') || "Sobreposição detectada: Você já tem um recesso neste período."}
                            </p>
                          </div>
                        );
                      }

                      if (isAutomatic) {
                        return (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex gap-3 items-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <p className="text-[10px] text-emerald-600 font-medium">
                              {t('withinSLA') || "Dentro do prazo: Seu recesso será validado automaticamente."}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex gap-3 items-center">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <div className="flex flex-col">
                            <p className="text-[10px] text-amber-600 font-bold">
                              {t('manualReviewWarning') || "Atenção: Requer revisão manual"}
                            </p>
                            <p className="text-[9px] text-amber-600/80">
                              {daysAdvance < 20 && "• Aviso prévio inferior a 20 dias"}
                              {daysAdvance < 20 && duration > 15 && <br />}
                              {duration > 15 && "• Duração superior a 15 dias"}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </VaultBody>
              <VaultFooter>
                <VaultSecondaryButton onClick={() => setIsOpen(false)}>{tCommon('cancel') || "Cancelar"}</VaultSecondaryButton>
                <VaultPrimaryButton onClick={handleNextToImpact} disabled={!date?.from || !date?.to || isPending || hasOverlap}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('verifyImpact') || "Verificar Impacto")}
                </VaultPrimaryButton>
              </VaultFooter>
            </motion.div>
          )}

          {step === "impact" && (
            <motion.div key="step-impact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <VaultHeader>
                <VaultIcon type={slaResult?.isAutomatic ? "success" : "warning"} />
                <VaultTitle>{t('recessImpact') || "Impacto do Recesso"}</VaultTitle>
                <VaultDescription>
                  {slaResult?.isAutomatic
                    ? (t('impactSLAOk') || "Seu pedido atende aos requisitos de SLA e será validado automaticamente.")
                    : (t('impactSLANok') || "Atenção: Seu pedido não atende ao SLA padrão e precisará de revisão manual.")}
                </VaultDescription>
              </VaultHeader>
              <VaultBody className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-md border border-border/50">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">{t('students') || "Alunos"}</span>
                    </div>
                    <p className="text-2xl font-black">{impactData?.totalStudents}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md border border-border/50">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">{t('classes') || "Aulas"}</span>
                    </div>
                    <p className="text-2xl font-black">{impactData?.totalClasses}</p>
                  </div>
                </div>

                {!slaResult?.isAutomatic && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-md flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-400">{t('insufficientNotice') || "Aviso Prévio Insuficiente"}</p>
                      <p className="text-xs text-amber-800 dark:text-amber-500 leading-relaxed">
                        {t('daysLeftNotice', { days: slaResult?.daysAdvance || 0 }) || `Faltam ${slaResult?.daysAdvance || 0} dias para o início. O contrato prevê 20 dias para validação automática.`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-bold px-1">{t('affectedStudents') || "Alunos Afetados"}</h4>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {impactData?.studentsAffected.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg border border-border/30">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{student.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{student.classesCount} {t('classes_lower') || "aulas"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </VaultBody>
              <VaultFooter>
                <VaultSecondaryButton onClick={() => setStep("dates")} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> {tCommon('back') || "Voltar"}
                </VaultSecondaryButton>
                <VaultPrimaryButton onClick={() => setStep("fallback")}>
                  {t('configActivities') || "Configurar Atividades"} <ChevronRight className="w-4 h-4" />
                </VaultPrimaryButton>
              </VaultFooter>
            </motion.div>
          )}

          {step === "fallback" && (
            <motion.div key="step-fallback" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <VaultHeader>
                <VaultIcon type="confirm" />
                <VaultTitle>{t('fallbackActivities') || "Atividades de Fallback"}</VaultTitle>
                <VaultDescription>
                  {t('fallbackActivitiesDesc') || "Selecione uma atividade para cada aluno realizar durante sua ausência."}
                </VaultDescription>
              </VaultHeader>
              <VaultBody className="space-y-4">
                <div className="max-h-[350px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  <form onSubmit={handleConfirm} id="fallback-form" className="space-y-4">
                    {isLoadingActivities ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      impactData?.affectedClasses.map((cls) => (
                        <div key={cls.id} className="space-y-2 p-4 bg-muted/30 rounded-2xl border border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{cls.studentName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(cls.startAt), "eeee, dd/MM - HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5">{cls.language}</Badge>
                          </div>

                          <Controller
                            control={form.control}
                            name={`config.${cls.id}.lessonId`}
                            render={({ field, fieldState }) => (
                              <div className="space-y-1">
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                  <SelectTrigger className={`h-11 rounded-md ${fieldState.error ? "border-destructive focus:ring-destructive" : ""}`}>
                                    <SelectValue placeholder={t('selectLesson') || "Selecione a lição..."} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {recessActivities?.map((activity) => (
                                      <SelectItem key={activity.id} value={activity.id}>
                                        {activity.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {fieldState.error && (
                                  <p className="text-xs text-destructive font-medium">{fieldState.error.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      ))
                    )}
                  </form>
                </div>
              </VaultBody>
              <VaultFooter>
                <VaultSecondaryButton onClick={() => setStep("impact")}>{tCommon('back') || "Voltar"}</VaultSecondaryButton>
                <VaultPrimaryButton type="submit" form="fallback-form" disabled={isPending || isLoadingActivities}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (t('finishScheduling') || "Finalizar Agendamento")}
                </VaultPrimaryButton>
              </VaultFooter>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="step-success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <VaultHeader>
                <VaultIcon type="success" className="scale-150 mb-6" />
                <VaultTitle className="text-2xl">{t('allSet') || "Tudo pronto!"}</VaultTitle>
                <VaultDescription className="text-base px-4">
                  {t('allSetDesc') || "Seu recesso foi agendado e as atividades de fallback configuradas. Os alunos serão notificados em breve."}
                </VaultDescription>
              </VaultHeader>
              <VaultBody className="flex flex-col items-center gap-4 py-8">
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 w-full max-w-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{t('scheduleUpdated') || "Cronograma atualizado"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{t('fallbackConfiguredFor', { count: impactData?.totalStudents || 0 }) || `Fallback configurado para ${impactData?.totalStudents || 0} alunos`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{t('managersNotified') || "Managers notificados"}</span>
                  </div>
                </div>
              </VaultBody>
              <VaultFooter>
                <VaultPrimaryButton onClick={reset} className="w-full">
                  {tCommon('close') || "Fechar"}
                </VaultPrimaryButton>
              </VaultFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </VaultContent>
    </Vault>
  );
}

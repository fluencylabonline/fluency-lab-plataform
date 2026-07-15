"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultForm,
  VaultField,
  VaultInput,
  VaultFooter,
  VaultIcon,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarVault } from "@/components/ui/calendar";
import { VaultLoadingOverlay } from "@/components/ui/vault-loading-overlay";

import { createRecurrenceRuleSchema, type CreateRecurrenceRuleValues } from "../scheduling.schema";
import {
  createRecurrenceRuleAction,
  checkSlotConflictAction,
  createRecurrenceRulesBatchAction,
  checkSlotsConflictBatchAction
} from "../scheduling.actions";

interface CreateSlotVaultProps {
  teacherId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDate?: Date;
  onOptimisticCreate?: (data: {
    startDate: Date;
    startTime: string;
    endTime: string;
    type: string;
    frequency: string;
    endDate?: Date | null;
  }) => void;
  onOptimisticCreateBatch?: (data: {
    startDate: Date;
    startTime: string;
    endTime: string;
    type: string;
    frequency: string;
    endDate?: Date | null;
  }[]) => void;
  onOptimisticCancel?: () => void;
}

export function CreateSlotVault({
  teacherId,
  isOpen,
  onOpenChange,
  onSuccess,
  initialDate,
  onOptimisticCreate,
  onOptimisticCreateBatch,
  onOptimisticCancel,
}: CreateSlotVaultProps) {
  const t = useTranslations("UserManagement");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflict, setConflict] = useState<{ startAt: Date; endAt: Date } | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const [restPeriod, setRestPeriod] = useState<number>(0);
  const [batchConflicts, setBatchConflicts] = useState<{
    [index: number]: {
      hasConflict: boolean;
      conflict?: { startAt: Date; endAt: Date } | null;
    };
  }>({});
  const [isCheckingBatchConflicts, setIsCheckingBatchConflicts] = useState(false);
  const [selectedBatchIndexes, setSelectedBatchIndexes] = useState<Set<number>>(new Set());

  // Overlay loading animation states
  const [overlayState, setOverlayState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<CreateRecurrenceRuleValues>({
    resolver: zodResolver(createRecurrenceRuleSchema),
    defaultValues: {
      teacherId,
      type: "NORMAL",
      frequency: "NONE",
      startTime: "09:00",
      endTime: "09:45",
      startDate: initialDate || new Date(),
      studentId: null,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const frequency = watch("frequency");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  // Sync selected date from calendar when vault opens
  React.useEffect(() => {
    if (isOpen && initialDate) {
      setValue("startDate", initialDate);
    }
  }, [isOpen, initialDate, setValue]);

  const dayOfWeekName = React.useMemo(() => {
    if (!startDate) return "";
    return format(new Date(startDate), "EEEE", { locale: dateLocale });
  }, [startDate, dateLocale]);

  const getFrequencyLabel = (freq: "WEEKLY" | "BIWEEKLY" | "MONTHLY") => {
    if (locale === "pt") {
      if (!dayOfWeekName) {
        if (freq === "WEEKLY") return "Semanal";
        if (freq === "BIWEEKLY") return "Quinzenal";
        return "Mensal";
      }
      
      const isMasculine = dayOfWeekName === "sábado" || dayOfWeekName === "domingo";
      const determiner = isMasculine ? "todo" : "toda";
      const preposition = isMasculine ? "no" : "na";
      
      if (freq === "WEEKLY") return `Semanal (${determiner} ${dayOfWeekName})`;
      if (freq === "BIWEEKLY") return `Quinzenal (${determiner} ${dayOfWeekName})`;
      return `Mensal (${preposition} ${dayOfWeekName})`;
    } else {
      if (!dayOfWeekName) {
        if (freq === "WEEKLY") return "Weekly";
        if (freq === "BIWEEKLY") return "Biweekly";
        return "Monthly";
      }
      if (freq === "WEEKLY") return `Weekly on ${dayOfWeekName}`;
      if (freq === "BIWEEKLY") return `Biweekly on ${dayOfWeekName}`;
      return `Monthly on ${dayOfWeekName}`;
    }
  };

  // Helper effect: Automatically set end time to start time + 45 minutes when start time is adjusted.
  const prevStartTimeRef = React.useRef(startTime);
  React.useEffect(() => {
    if (startTime && startTime !== prevStartTimeRef.current) {
      try {
        const [h, m] = startTime.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m + 45, 0, 0);
        const nextH = String(date.getHours()).padStart(2, "0");
        const nextM = String(date.getMinutes()).padStart(2, "0");
        setValue("endTime", `${nextH}:${nextM}`);
      } catch (err) {
        console.error("Error setting default end time:", err);
      }
      prevStartTimeRef.current = startTime;
    }
  }, [startTime, setValue]);

  const totalDuration = React.useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    if (endMin <= startMin) return 0;
    return endMin - startMin;
  }, [startTime, endTime]);

  const isBatchMode = totalDuration > 45;

  const candidateSlots = React.useMemo(() => {
    if (!isBatchMode || !startTime || !endTime || !startDate) return [];
    
    const candidates = [];
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    
    let currentMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    
    while (currentMin + 45 <= endMin) {
      const startHour = Math.floor(currentMin / 60);
      const startMin = currentMin % 60;
      const endHour = Math.floor((currentMin + 45) / 60);
      const endMinVal = (currentMin + 45) % 60;
      
      const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
      const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMinVal).padStart(2, "0")}`;
      
      candidates.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
      
      currentMin += 45 + restPeriod;
    }
    
    return candidates;
  }, [isBatchMode, startTime, endTime, startDate, restPeriod]);

  // Query conflict status for all candidate slots
  React.useEffect(() => {
    if (!isBatchMode || candidateSlots.length === 0 || !startDate || !isOpen) {
      setBatchConflicts({});
      setSelectedBatchIndexes(new Set());
      return;
    }

    const checkBatchConflicts = async () => {
      setIsCheckingBatchConflicts(true);
      try {
        const slotsToCheck = candidateSlots.map(candidate => {
          const start = new Date(startDate);
          const [sH, sM] = candidate.startTime.split(":").map(Number);
          start.setHours(sH, sM, 0, 0);

          const end = new Date(startDate);
          const [eH, eM] = candidate.endTime.split(":").map(Number);
          end.setHours(eH, eM, 0, 0);

          return {
            startAt: start.toISOString(),
            endAt: end.toISOString(),
          };
        });

        const result = await checkSlotsConflictBatchAction({
          teacherId,
          slots: slotsToCheck,
        });

        if (result?.data?.success && result.data.results) {
          const conflictsMap: typeof batchConflicts = {};
          const initialSelected = new Set<number>();
          
          result.data.results.forEach((
            res: {
              hasConflict: boolean;
              conflict: { startAt: Date; endAt: Date } | null;
            },
            idx: number
          ) => {
            conflictsMap[idx] = {
              hasConflict: res.hasConflict,
              conflict: res.conflict,
            };
            if (!res.hasConflict) {
              initialSelected.add(idx);
            }
          });
          
          setBatchConflicts(conflictsMap);
          setSelectedBatchIndexes(initialSelected);
        } else {
          setBatchConflicts({});
          setSelectedBatchIndexes(new Set(candidateSlots.map((_, i) => i)));
        }
      } catch (err) {
        console.error("Error checking batch conflicts:", err);
      } finally {
        setIsCheckingBatchConflicts(false);
      }
    };

    const timer = setTimeout(checkBatchConflicts, 500);
    return () => clearTimeout(timer);
  }, [candidateSlots, startDate, teacherId, isBatchMode, isOpen]);

  // Validation: Slots cannot be longer than 1 hour (60 minutes) - only for single slot mode.
  const isDurationTooLong = React.useMemo(() => {
    if (isBatchMode) return false;
    if (!startTime || !endTime) return false;
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    
    if (endMin <= startMin) return false;
    
    return (endMin - startMin) > 60;
  }, [startTime, endTime, isBatchMode]);

  React.useEffect(() => {
    if (!isOpen || !startTime || !endTime || !startDate || isBatchMode) {
      setConflict(null);
      return;
    }

    const checkConflict = async () => {
      setIsCheckingConflict(true);
      try {
        const start = new Date(startDate);
        const [sH, sM] = startTime.split(":").map(Number);
        start.setHours(sH, sM, 0, 0);

        const end = new Date(startDate);
        const [eH, eM] = endTime.split(":").map(Number);
        end.setHours(eH, eM, 0, 0);

        if (end <= start) {
          setConflict(null);
          return;
        }

        const result = await checkSlotConflictAction({
          teacherId,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
        });

        const data = result?.data;
        if (data?.success && data.hasConflict && data.conflict) {
          setConflict({
            startAt: new Date(data.conflict.startAt),
            endAt: new Date(data.conflict.endAt)
          });
        } else {
          setConflict(null);
        }
      } catch (err) {
        console.error("Error checking conflict:", err);
      } finally {
        setIsCheckingConflict(false);
      }
    };

    const timer = setTimeout(checkConflict, 500);
    return () => clearTimeout(timer);
  }, [startTime, endTime, startDate, teacherId, isOpen, isBatchMode]);

  const onSubmit = async (data: CreateRecurrenceRuleValues) => {
    setIsSubmitting(true);
    setOverlayState("loading");

    if (isBatchMode) {
      if (selectedBatchIndexes.size === 0) {
        setErrorMsg("Selecione pelo menos um horário para criar.");
        setOverlayState("error");
        setIsSubmitting(false);
        return;
      }

      const rules = Array.from(selectedBatchIndexes).map((idx) => {
        const candidate = candidateSlots[idx];
        return {
          teacherId,
          studentId: null,
          type: data.type,
          frequency: data.frequency,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          startDate: data.startDate,
          endDate: data.endDate || null,
        };
      });

      onOptimisticCreateBatch?.(rules);

      try {
        const result = await createRecurrenceRulesBatchAction({ rules });
        if (result?.data?.success) {
          setOverlayState("success");
          onSuccess?.();
        } else {
          onOptimisticCancel?.();
          const err = result?.data?.error || t("error") || "Erro ao criar horários";
          setErrorMsg(err);
          setOverlayState("error");
        }
      } catch {
        onOptimisticCancel?.();
        setErrorMsg(t("error") || "Erro ao criar horários");
        setOverlayState("error");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Call optimistic callback before the API request completes!
      onOptimisticCreate?.({
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        frequency: data.frequency,
        endDate: data.endDate,
      });

      try {
        const result = await createRecurrenceRuleAction(data);
        if (result?.data?.success) {
          setOverlayState("success");
          onSuccess?.();
        } else {
          // Cancel optimistic items if failed
          onOptimisticCancel?.();
          const err = result?.data?.error || t("error") || "Erro ao criar horário";
          setErrorMsg(err);
          setOverlayState("error");
        }
      } catch {
        onOptimisticCancel?.();
        setErrorMsg(t("error") || "Erro ao criar horário");
        setOverlayState("error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOverlayDone = () => {
    if (overlayState === "success") {
      onOpenChange(false);
      form.reset();
    }
    setOverlayState("idle");
  };

  return (
    <Vault open={isOpen} onOpenChange={(open) => {
      if (overlayState !== "idle") return;
      onOpenChange(open);
    }}>
      <VaultContent>
        <VaultLoadingOverlay
          state={overlayState}
          loadingLabel={t("creatingSlot") || "Criando horário..."}
          successLabel={t("slotCreated") || "Horário criado com sucesso!"}
          errorLabel={t("error") || "Erro ao criar horário"}
          errorSub={errorMsg}
          onDone={handleOverlayDone}
        />
        <VaultHeader>
          <VaultIcon type="calendar" />
          <VaultTitle>{t("createSlotTitle") || "Criar Novo Horário"}</VaultTitle>
          <VaultDescription>
            {t("createSlotDescription") || "Configure o horário disponível para aulas."}
          </VaultDescription>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("slotType") || "Tipo"} error={errors.type?.message}>
                <Select
                  value={watch("type")}
                  onValueChange={(val: CreateRecurrenceRuleValues["type"]) => setValue("type", val)}
                >
                  <SelectTrigger className="w-full h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">{t("slotTypes.NORMAL") || "Normal"}</SelectItem>
                    <SelectItem value="REPOSICAO">{t("slotTypes.REPOSICAO") || "Reposição"}</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>

              <VaultField label={t("frequencyLabel") || "Frequência"} error={errors.frequency?.message}>
                <Select
                  value={watch("frequency")}
                  onValueChange={(val: CreateRecurrenceRuleValues["frequency"]) => setValue("frequency", val)}
                >
                  <SelectTrigger className="w-full h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{t("frequencies.NONE") || (locale === "pt" ? "Único" : "None")}</SelectItem>
                    <SelectItem value="WEEKLY">{getFrequencyLabel("WEEKLY")}</SelectItem>
                    <SelectItem value="BIWEEKLY">{getFrequencyLabel("BIWEEKLY")}</SelectItem>
                    <SelectItem value="MONTHLY">{getFrequencyLabel("MONTHLY")}</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>
            </div>

            <VaultField label={t("startDate") || "Data"} error={errors.startDate?.message}>
              <CalendarVault
                date={startDate}
                onSelect={(date) => date && setValue("startDate", date)}
                placeholder={t("selectDate") || "Selecione uma data"}
                label={t("startDate") || "Data"}
                className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md"
              />
            </VaultField>

            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("startTime") || "Hora Início"} error={errors.startTime?.message}>
                <div className="relative">
                  <VaultInput
                    type="time"
                    {...register("startTime")}
                    className="pl-10"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </VaultField>

              <VaultField label={t("endTime") || "Hora Fim"} error={errors.endTime?.message}>
                <div className="relative">
                  <VaultInput
                    type="time"
                    {...register("endTime")}
                    className="pl-10"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </VaultField>
            </div>

            {isBatchMode && (
              <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-1 mt-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Criação em lote ativada
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Você selecionou um período de {Math.floor(totalDuration / 60)}h {totalDuration % 60}m. Vamos dividir este período em aulas individuais de 45 minutos.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Intervalo de descanso entre aulas
                  </label>
                  <Select
                    value={String(restPeriod)}
                    onValueChange={(val) => setRestPeriod(Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem descanso</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>Aulas a serem criadas</span>
                    <span>
                      {selectedBatchIndexes.size} / {candidateSlots.length}
                    </span>
                  </div>

                  {isCheckingBatchConflicts ? (
                    <div className="py-6 flex items-center justify-center text-xs text-muted-foreground gap-2">
                      <span className="animate-spin border-2 border-primary border-t-transparent rounded-full w-3.5 h-3.5" />
                      <span>Verificando conflitos...</span>
                    </div>
                  ) : candidateSlots.length === 0 ? (
                    <p className="text-[10px] text-rose-500 italic py-2">
                      Nenhuma aula de 45 minutos cabe neste período com {restPeriod} min de descanso.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700/50 rounded-md divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                      {candidateSlots.map((candidate, idx) => {
                        const conflictInfo = batchConflicts[idx];
                        const isSelected = selectedBatchIndexes.has(idx);
                        
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedBatchIndexes(prev => {
                                const next = new Set(prev);
                                if (next.has(idx)) {
                                  next.delete(idx);
                                } else {
                                  next.add(idx);
                                }
                                return next;
                              });
                            }}
                            className={cn(
                              "flex items-center justify-between p-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors select-none",
                              conflictInfo?.hasConflict && "bg-rose-500/[0.02] hover:bg-rose-500/[0.04]"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
                              />
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span>{candidate.startTime}</span>
                                <span className="text-gray-400 font-normal">→</span>
                                <span>{candidate.endTime}</span>
                              </div>
                            </div>

                            {conflictInfo?.hasConflict && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/20">
                                Conflito
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {conflict && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 mt-2">
                <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-rose-500 leading-tight font-medium">
                  {t("conflictWarning", { 
                    start: format(conflict.startAt, "HH:mm"), 
                    end: format(conflict.endAt, "HH:mm") 
                  }) || `Conflito detectado: O professor já possui uma aula das ${format(conflict.startAt, "HH:mm")} às ${format(conflict.endAt, "HH:mm")}.`}
                </p>
              </div>
            )}

            {endTime && startTime && endTime <= startTime && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 mt-2">
                <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-500 leading-tight font-medium">
                  {t("invalidTimeWarning") || "Horário inválido: O término deve ser após o início."}
                </p>
              </div>
            )}

            {isDurationTooLong && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 mt-2">
                <AlertCircle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-rose-500 leading-tight font-medium">
                  {t("durationTooLongWarning") || "Horários livres não podem ser mais longos que 1 hora."}
                </p>
              </div>
            )}

            {frequency !== "NONE" && (
              <VaultField label={t("endDateLabel") || "Data Término (Opcional)"} error={errors.endDate?.message}>
                <CalendarVault
                  date={endDate || undefined}
                  onSelect={(date) => setValue("endDate", date || null)}
                  placeholder={t("noEndDate") || "Sem data de término"}
                  label={t("endDateLabel") || "Data Término"}
                  className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md"
                />
              </VaultField>
            )}

            <VaultFooter className="mt-6">
              <VaultSecondaryButton
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("cancel") || "Cancelar"}
              </VaultSecondaryButton>
              <VaultPrimaryButton
                type="submit"
                disabled={isSubmitting || (isBatchMode ? (selectedBatchIndexes.size === 0 || isCheckingBatchConflicts) : (!!conflict || (endTime <= startTime) || isCheckingConflict || isDurationTooLong))}
              >
                {isSubmitting ? (t("creatingSlot") || "Criando...") : (t("createSlot") || "Criar Horário")}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

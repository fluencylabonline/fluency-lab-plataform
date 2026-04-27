"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Calendar as CalendarIcon, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/toaster";

import { createRecurrenceRuleSchema, type CreateRecurrenceRuleValues } from "../scheduling.schema";
import { createRecurrenceRuleAction, checkSlotConflictAction } from "../scheduling.actions";

interface CreateSlotVaultProps {
  teacherId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDate?: Date;
}

export function CreateSlotVault({
  teacherId,
  isOpen,
  onOpenChange,
  onSuccess,
  initialDate,
}: CreateSlotVaultProps) {
  const t = useTranslations("UserManagement");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflict, setConflict] = useState<{ startAt: Date; endAt: Date } | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const form = useForm<CreateRecurrenceRuleValues>({
    resolver: zodResolver(createRecurrenceRuleSchema),
    defaultValues: {
      teacherId,
      type: "NORMAL",
      frequency: "NONE",
      startTime: "09:00",
      endTime: "10:00",
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

  React.useEffect(() => {
    if (!isOpen || !startTime || !endTime || !startDate) {
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
  }, [startTime, endTime, startDate, teacherId, isOpen]);

  const onSubmit = async (data: CreateRecurrenceRuleValues) => {
    setIsSubmitting(true);
    try {
      const result = await createRecurrenceRuleAction(data);
      if (result?.data?.success) {
        notify.success(t("slotCreated") || "Horário criado!");
        onSuccess?.();
        onOpenChange(false);
        form.reset();
      } else {
        notify.error(result?.data?.error || t("error") || "Erro ao criar horário");
      }
    } catch {
      notify.error(t("error") || "Erro ao criar horário");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent>
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
                  onValueChange={(val: any) => setValue("type", val)}
                >
                  <SelectTrigger className="w-full h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
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
                  onValueChange={(val: any) => setValue("frequency", val)}
                >
                  <SelectTrigger className="w-full h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{t("frequencies.NONE") || "Único"}</SelectItem>
                    <SelectItem value="WEEKLY">{t("frequencies.WEEKLY") || "Semanal"}</SelectItem>
                    <SelectItem value="BIWEEKLY">{t("frequencies.BIWEEKLY") || "Quinzenal"}</SelectItem>
                    <SelectItem value="MONTHLY">{t("frequencies.MONTHLY") || "Mensal"}</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>
            </div>

            <VaultField label={t("startDate") || "Data"} error={errors.startDate?.message}>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", fullWidth: true }),
                    "h-10 justify-start text-left font-normal bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Selecione uma data</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setValue("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

            {conflict && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 mt-2">
                <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-rose-500 leading-tight font-medium">
                  {t("conflictWarning") || `Conflito detectado: O professor já possui uma aula das ${format(conflict.startAt, "HH:mm")} às ${format(conflict.endAt, "HH:mm")}.`}
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

            {frequency !== "NONE" && (
              <VaultField label={t("endDateLabel") || "Data Término (Opcional)"} error={errors.endDate?.message}>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", fullWidth: true }),
                      "h-10 justify-start text-left font-normal bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Sem data de término</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate || undefined}
                      onSelect={(date) => setValue("endDate", date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                disabled={isSubmitting || !!conflict || (endTime <= startTime) || isCheckingConflict}
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

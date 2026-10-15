"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { AlertCircle, Clock, Repeat } from "lucide-react";

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
import { CalendarVault } from "@/components/ui/calendar";
import { notify } from "@/components/ui/toaster";

import {
  changeClassTimeFormSchema,
  type ChangeClassTimeFormValues,
} from "../scheduling.schema";
import {
  checkSlotConflictAction,
  retimeRecurrenceAction,
  updateSlotAction,
} from "../scheduling.actions";

export type ChangeClassTimeScope = "single" | "future";

export interface ChangeClassTimeTarget {
  id: string;
  ruleId?: string | null;
  teacherId: string;
  studentId?: string | null;
  startAt: Date;
  endAt: Date;
}

interface ChangeClassTimeVaultProps {
  slot: ChangeClassTimeTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Skips the scope step. Without it, recurring classes ask "only this one" vs "this and following". */
  initialScope?: ChangeClassTimeScope;
}

type Conflict = { kind: "teacher" | "student"; startAt: Date; endAt: Date };

function combine(date: Date, time: string) {
  const result = new Date(date);
  const [hour, minute] = time.split(":").map(Number);
  result.setHours(hour, minute, 0, 0);
  return result;
}

export function ChangeClassTimeVault(props: ChangeClassTimeVaultProps) {
  const { slot, open, onOpenChange } = props;

  // Each opening starts a fresh flow (scope step + form) without a reset effect
  const [session, setSession] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSession((s) => s + 1);
  }

  if (!slot) return null;

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <ChangeClassTimeFlow
          key={`${slot.id}-${session}`}
          {...props}
          slot={slot}
        />
      </VaultContent>
    </Vault>
  );
}

function ChangeClassTimeFlow({
  slot,
  onOpenChange,
  onSuccess,
  initialScope,
}: ChangeClassTimeVaultProps & { slot: ChangeClassTimeTarget }) {
  const t = useTranslations("ChangeClassTime");
  const isRecurring = !!slot.ruleId;
  const [scope, setScope] = useState<ChangeClassTimeScope | null>(
    initialScope ?? (isRecurring ? null : "single"),
  );
  const [conflictResult, setConflictResult] = useState<{
    key: string;
    conflict: Conflict | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangeClassTimeFormValues>({
    resolver: zodResolver(changeClassTimeFormSchema),
    defaultValues: {
      date: new Date(slot.startAt),
      startTime: format(slot.startAt, "HH:mm"),
      endTime: format(slot.endAt, "HH:mm"),
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = form;

  const [date, startTime, endTime] = useWatch({
    control,
    name: ["date", "startTime", "endTime"],
  });

  // Live conflict check for the chosen class (the server re-checks every following date)
  const checkWindow =
    scope && date && startTime && endTime && endTime > startTime
      ? {
          startAt: combine(date, startTime).toISOString(),
          endAt: combine(date, endTime).toISOString(),
        }
      : null;
  const checkKey = checkWindow
    ? `${checkWindow.startAt}|${checkWindow.endAt}`
    : null;
  const conflict =
    checkKey && conflictResult?.key === checkKey
      ? conflictResult.conflict
      : null;
  const isCheckingConflict = !!checkKey && conflictResult?.key !== checkKey;

  useEffect(() => {
    if (!checkKey) return;
    const [startAt, endAt] = checkKey.split("|");

    const timer = setTimeout(async () => {
      const result = await checkSlotConflictAction({
        teacherId: slot.teacherId,
        studentId: slot.studentId ?? undefined,
        startAt,
        endAt,
        excludeSlotId: slot.id,
      });
      const data = result?.data;
      setConflictResult({
        key: checkKey,
        conflict:
          data?.success && data.hasConflict && data.conflict
            ? {
                kind: data.conflict.kind,
                startAt: new Date(data.conflict.startAt),
                endAt: new Date(data.conflict.endAt),
              }
            : null,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [checkKey, slot]);

  const onSubmit = async (values: ChangeClassTimeFormValues) => {
    if (!scope) return;
    setIsSubmitting(true);

    const result =
      scope === "future" && slot.ruleId
        ? await retimeRecurrenceAction({
            ruleId: slot.ruleId,
            fromSlotId: slot.id,
            newStartTime: values.startTime,
            newEndTime: values.endTime,
            newStartDate: values.date.toISOString(),
          })
        : await updateSlotAction({
            slotId: slot.id,
            scope: "single",
            data: {
              startAt: combine(values.date, values.startTime).toISOString(),
              endAt: combine(values.date, values.endTime).toISOString(),
            },
          });

    const data = result?.data as
      | { success?: boolean; error?: string; updatedCount?: number }
      | undefined;
    if (data?.success) {
      notify.success(
        scope === "future"
          ? t("successFuture", { count: data.updatedCount ?? 0 }) ||
              "Horário das próximas aulas atualizado!"
          : t("successSingle") || "Horário da aula atualizado!",
      );
      onOpenChange(false);
      onSuccess();
    } else {
      notify.error(data?.error || t("error") || "Erro ao alterar o horário.");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {!scope ? (
        <>
          <VaultHeader>
            <VaultIcon type="calendar" />
            <div className="flex flex-col">
              <VaultTitle>{t("scopeTitle") || "Alterar horário"}</VaultTitle>
              <VaultDescription>
                {t("scopeDescription") ||
                  "Esta aula faz parte de uma recorrência. Onde deseja aplicar o novo horário?"}
              </VaultDescription>
            </div>
          </VaultHeader>
          <VaultBody>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setScope("single")}
                className="w-full p-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-text">
                  {t("scopeSingle") || "Apenas esta aula"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("scopeSingleHint") ||
                    "Somente esta aula muda de horário. As outras continuam iguais."}
                </p>
              </button>
              {isRecurring && (
                <button
                  type="button"
                  onClick={() => setScope("future")}
                  className="w-full p-4 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-left transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Repeat className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-bold text-primary">
                      {t("scopeFuture") || "Esta e as próximas aulas"}
                    </h4>
                  </div>
                  <p className="text-xs text-primary/60">
                    {t("scopeFutureHint") ||
                      "A partir desta aula, todas as seguintes passam para o novo horário. As anteriores não mudam."}
                  </p>
                </button>
              )}
            </div>
          </VaultBody>
        </>
      ) : (
        <>
          <VaultHeader>
            <VaultIcon type="edit" />
            <div className="flex flex-col">
              <VaultTitle>
                {scope === "future"
                  ? t("futureTitle") || "Alterar esta e as próximas"
                  : t("singleTitle") || "Alterar esta aula"}
              </VaultTitle>
              <VaultDescription>
                {t("currentTime", {
                  date: format(slot.startAt, "dd/MM/yyyy"),
                  start: format(slot.startAt, "HH:mm"),
                  end: format(slot.endAt, "HH:mm"),
                }) ||
                  `Atual: ${format(slot.startAt, "dd/MM/yyyy")} · ${format(slot.startAt, "HH:mm")}–${format(slot.endAt, "HH:mm")}`}
              </VaultDescription>
            </div>
          </VaultHeader>
          <VaultBody>
            <VaultForm onSubmit={handleSubmit(onSubmit)}>
              <VaultField
                label={
                  scope === "future"
                    ? t("dateFutureLabel") || "Nova data desta aula"
                    : t("dateLabel") || "Data"
                }
                error={errors.date?.message}
              >
                <CalendarVault
                  date={date}
                  onSelect={(d) =>
                    d && setValue("date", d, { shouldValidate: true })
                  }
                  label={t("dateLabel") || "Data"}
                  className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md"
                />
              </VaultField>

              <div className="grid grid-cols-2 gap-4">
                <VaultField
                  label={t("startTime") || "Início"}
                  error={errors.startTime?.message}
                >
                  <VaultInput type="time" {...register("startTime")} />
                </VaultField>
                <VaultField
                  label={t("endTime") || "Término"}
                  error={errors.endTime?.message}
                >
                  <VaultInput type="time" {...register("endTime")} />
                </VaultField>
              </div>

              {conflict && (
                <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-rose-500 font-medium">
                    {(conflict.kind === "student"
                      ? t("studentConflict", {
                          start: format(conflict.startAt, "HH:mm"),
                          end: format(conflict.endAt, "HH:mm"),
                        })
                      : t("teacherConflict", {
                          start: format(conflict.startAt, "HH:mm"),
                          end: format(conflict.endAt, "HH:mm"),
                        })) ||
                      `Conflito: já existe uma aula das ${format(conflict.startAt, "HH:mm")} às ${format(conflict.endAt, "HH:mm")}.`}
                  </p>
                </div>
              )}

              {scope === "future" && (
                <div className="p-3 rounded-md bg-primary/5 border border-primary/10 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-primary/80 leading-relaxed">
                    {t("futureWarning") ||
                      "Esta aula e todas as seguintes da recorrência vão para o novo horário. Mudar a data muda o dia da semana de todas. Se houver conflito em alguma data, nada é alterado."}
                  </p>
                </div>
              )}

              <VaultFooter className="mt-6">
                <VaultSecondaryButton
                  type="button"
                  onClick={() =>
                    initialScope || !isRecurring
                      ? onOpenChange(false)
                      : setScope(null)
                  }
                  disabled={isSubmitting}
                >
                  {initialScope || !isRecurring
                    ? t("cancel") || "Cancelar"
                    : t("back") || "Voltar"}
                </VaultSecondaryButton>
                <VaultPrimaryButton
                  type="submit"
                  disabled={isSubmitting || isCheckingConflict || !!conflict}
                >
                  {isSubmitting
                    ? t("saving") || "Salvando..."
                    : t("confirm") || "Confirmar"}
                </VaultPrimaryButton>
              </VaultFooter>
            </VaultForm>
          </VaultBody>
        </>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startOfDay } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultIcon,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";
import { VaultLoadingOverlay } from "@/components/ui/vault-loading-overlay";

import {
  createSlotWizardSchema,
  type CreateSlotWizardValues,
} from "../../scheduling.schema";
import {
  createRecurrenceRuleAction,
  createRecurrenceRulesBatchAction,
} from "../../scheduling.actions";
import {
  getDefaultFrequency,
  getSlotEndTime,
  type WizardFrequency,
} from "../../slot-wizard.utils";
import { TypeStep } from "./steps/TypeStep";
import { DateStep } from "./steps/DateStep";
import { TimeStep } from "./steps/TimeStep";
import { FrequencyStep } from "./steps/FrequencyStep";
import { SummaryStep } from "./steps/SummaryStep";

const STEPS = ["type", "date", "time", "frequency", "summary"] as const;
type Step = (typeof STEPS)[number];

interface OptimisticSlot {
  startDate: Date;
  startTime: string;
  endTime: string;
  type: string;
  frequency: string;
  endDate?: Date | null;
}

interface CreateSlotWizardVaultProps {
  teacherId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDate?: Date;
  onOptimisticCreate?: (data: OptimisticSlot) => void;
  onOptimisticCreateBatch?: (data: OptimisticSlot[]) => void;
  onOptimisticCancel?: () => void;
}

const resolveInitialDate = (initialDate?: Date) => {
  const today = startOfDay(new Date());
  return initialDate && startOfDay(initialDate) >= today ? initialDate : new Date();
};

export function CreateSlotWizardVault({
  teacherId,
  isOpen,
  onOpenChange,
  onSuccess,
  initialDate,
  onOptimisticCreate,
  onOptimisticCreateBatch,
  onOptimisticCancel,
}: CreateSlotWizardVaultProps) {
  const t = useTranslations("SlotWizard");
  const locale = useLocale() === "pt" ? "pt" : "en";

  const [step, setStep] = useState<Step>("type");
  const [isTimeBusy, setIsTimeBusy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlayState, setOverlayState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<CreateSlotWizardValues>({
    resolver: zodResolver(createSlotWizardSchema),
    defaultValues: {
      type: "NORMAL",
      startDate: resolveInitialDate(initialDate),
      startTimes: [],
      frequency: getDefaultFrequency("NORMAL"),
    },
  });

  const { watch, setValue } = form;
  const type = watch("type");
  const startDate = watch("startDate");
  const startTimes = watch("startTimes");
  const frequency = watch("frequency");

  // Cada abertura começa do zero, já com a data selecionada no calendário da agenda.
  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      type: "NORMAL",
      startDate: resolveInitialDate(initialDate),
      startTimes: [],
      frequency: getDefaultFrequency("NORMAL"),
    });
    setStep("type");
    setIsTimeBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stepIndex = STEPS.indexOf(step);
  const goNext = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  const goBack = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]);

  const handleSelectType = (next: CreateSlotWizardValues["type"]) => {
    setValue("type", next);
    setValue("frequency", getDefaultFrequency(next));
    goNext();
  };

  const handleSelectDate = (date: Date) => {
    // Os conflitos mudam de um dia para o outro; os horários escolhidos deixam de valer.
    if (date.toDateString() !== startDate.toDateString()) setValue("startTimes", []);
    setValue("startDate", date);
  };

  const canContinue =
    step === "date"
      ? startOfDay(startDate) >= startOfDay(new Date())
      : step === "time"
        ? startTimes.length > 0 && !isTimeBusy
        : true;

  const handleCreate = async () => {
    const values = form.getValues();
    const slots: OptimisticSlot[] = values.startTimes.map((start) => ({
      startDate: values.startDate,
      startTime: start,
      endTime: getSlotEndTime(start),
      type: values.type,
      frequency: values.frequency,
      endDate: null,
    }));
    if (slots.length === 0) return;

    setIsSubmitting(true);
    setOverlayState("loading");

    const rules = slots.map((slot) => ({
      teacherId,
      studentId: null,
      type: values.type,
      frequency: values.frequency,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startDate: values.startDate,
      endDate: null,
    }));

    if (slots.length === 1) onOptimisticCreate?.(slots[0]);
    else onOptimisticCreateBatch?.(slots);

    try {
      const result =
        rules.length === 1
          ? await createRecurrenceRuleAction(rules[0])
          : await createRecurrenceRulesBatchAction({ rules });

      if (result?.data?.success) {
        setOverlayState("success");
        onSuccess?.();
      } else {
        onOptimisticCancel?.();
        setErrorMsg(result?.data?.error || t("error") || "Erro ao criar horário");
        setOverlayState("error");
      }
    } catch {
      onOptimisticCancel?.();
      setErrorMsg(t("error") || "Erro ao criar horário");
      setOverlayState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayDone = () => {
    if (overlayState === "success") onOpenChange(false);
    setOverlayState("idle");
  };

  const titles: Record<Step, { title: string; description: string }> = {
    type: {
      title: t("typeTitle") || "Que tipo de horário você quer criar?",
      description: t("typeDescription") || "Escolha uma opção para continuar.",
    },
    date: {
      title: t("dateTitle") || "A partir de quando?",
      description: t("dateDescription") || "Escolha a data do primeiro horário.",
    },
    time: {
      title: t("timeTitle") || "Qual horário?",
      description:
        t("timeDescription") || "Cada aula tem 45 minutos. Você pode escolher mais de um horário.",
    },
    frequency: {
      title: t("frequencyTitle") || "Com que frequência?",
      description:
        t("frequencyDescription") ||
        "O sistema repete o horário nas próximas semanas, sem data de término.",
    },
    summary: {
      title: t("summaryTitle") || "Confirme os dados",
      description: t("summaryDescription") || "Revise antes de criar.",
    },
  };

  const stepLabel =
    t("stepOf", { current: stepIndex + 1, total: STEPS.length }) ||
    `Passo ${stepIndex + 1} de ${STEPS.length}`;

  return (
    <Vault
      open={isOpen}
      onOpenChange={(open) => {
        if (overlayState !== "idle") return;
        onOpenChange(open);
      }}
    >
      <VaultContent>
        <VaultLoadingOverlay
          state={overlayState}
          loadingLabel={t("creating") || "Criando horário..."}
          successLabel={t("created") || "Horário criado com sucesso!"}
          errorLabel={t("error") || "Erro ao criar horário"}
          errorSub={errorMsg}
          onDone={handleOverlayDone}
        />

        <VaultHeader>
          <VaultIcon type={step === "summary" ? "confirm" : "calendar"} />
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {stepLabel}
          </p>
          <VaultTitle>{titles[step].title}</VaultTitle>
          <VaultDescription>{titles[step].description}</VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-4">
          {step === "type" && <TypeStep value={type} onSelect={handleSelectType} />}
          {step === "date" && (
            <DateStep date={startDate} locale={locale} onSelect={handleSelectDate} />
          )}
          {step === "time" && (
            <TimeStep
              teacherId={teacherId}
              date={startDate}
              selected={startTimes}
              onChange={(next) => setValue("startTimes", next)}
              onBusyChange={setIsTimeBusy}
            />
          )}
          {step === "frequency" && (
            <FrequencyStep
              value={frequency as WizardFrequency}
              dayIndex={startDate.getDay()}
              locale={locale}
              onChange={(next) => setValue("frequency", next)}
            />
          )}
          {step === "summary" && (
            <SummaryStep
              type={type}
              startDate={startDate}
              startTimes={startTimes}
              frequency={frequency as WizardFrequency}
              locale={locale}
            />
          )}
        </VaultBody>

        <VaultFooter className="mt-6">
          <VaultSecondaryButton type="button" onClick={goBack} disabled={isSubmitting}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("back") || "Voltar"}
          </VaultSecondaryButton>

          {step === "summary" ? (
            <VaultPrimaryButton type="button" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? t("creating") || "Criando..." : t("create") || "Criar horário"}
              <Check className="ml-1 h-5 w-5" />
            </VaultPrimaryButton>
          ) : step !== "type" ? (
            <VaultPrimaryButton type="button" onClick={goNext} disabled={!canContinue}>
              {t("continue") || "Continuar"}
              <ArrowRight className="ml-1 h-5 w-5" />
            </VaultPrimaryButton>
          ) : null}
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}

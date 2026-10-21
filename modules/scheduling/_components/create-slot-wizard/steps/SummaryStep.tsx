"use client";

import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { Calendar, Clock } from "lucide-react";
import {
  buildSummarySentence,
  getFrequencyLabel,
  getSlotEndTime,
  sortTimes,
  type WizardFrequency,
} from "../../../slot-wizard.utils";

interface SummaryStepProps {
  type: "NORMAL" | "REPOSICAO";
  startDate: Date;
  startTimes: string[];
  frequency: WizardFrequency;
  locale: "pt" | "en";
}

export function SummaryStep({ type, startDate, startTimes, frequency, locale }: SummaryStepProps) {
  const t = useTranslations("SlotWizard");
  const dateLocale = locale === "pt" ? ptBR : enUS;
  const dayIndex = startDate.getDay();
  const dateLabel = format(startDate, "dd/MM/yyyy", { locale: dateLocale });
  const sortedTimes = sortTimes(startTimes);

  const sentence = buildSummarySentence({
    frequency,
    dayIndex,
    dateLabel,
    startTimes,
    locale,
  });

  const typeLabel =
    type === "NORMAL"
      ? t("typeNormalTitle") || "Horário normal"
      : t("typeMakeupTitle") || "Reposição";

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-primary/5 p-4 text-sm font-medium leading-relaxed text-foreground">
        {sentence}
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-700/60">
        <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-xs text-muted-foreground">{t("summaryType") || "Tipo"}</dt>
            <dd className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {typeLabel}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-xs text-muted-foreground">{t("summaryDate") || "Início"}</dt>
            <dd className="flex items-center gap-1.5 font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {dateLabel}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-xs text-muted-foreground">{t("summaryTimes") || "Horários"}</dt>
            <dd className="flex flex-col items-end gap-1 font-medium text-foreground">
              {sortedTimes.map((start) => (
                <span key={start} className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {start} → {getSlotEndTime(start)}
                </span>
              ))}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-xs text-muted-foreground">
              {t("summaryFrequency") || "Frequência"}
            </dt>
            <dd className="text-right font-medium text-foreground">
              {getFrequencyLabel(frequency, dayIndex, locale)}
            </dd>
          </div>
          {frequency !== "NONE" && (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t("summaryEnd") || "Término"}</dt>
              <dd className="font-medium text-foreground">
                {t("summaryNoEnd") || "Sem data de término"}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

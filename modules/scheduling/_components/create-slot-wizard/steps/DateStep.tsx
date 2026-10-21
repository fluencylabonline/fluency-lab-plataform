"use client";

import { startOfDay } from "date-fns";
import { useTranslations } from "next-intl";
import { Calendar } from "@/components/ui/calendar";
import { getEveryWeekdayPhrase, getWeekdayName } from "../../../slot-wizard.utils";

interface DateStepProps {
  date: Date;
  locale: "pt" | "en";
  onSelect: (date: Date) => void;
}

export function DateStep({ date, locale, onSelect }: DateStepProps) {
  const t = useTranslations("SlotWizard");
  const dayIndex = date.getDay();
  const day = getWeekdayName(dayIndex, locale);
  const phrase = getEveryWeekdayPhrase(dayIndex, locale);

  return (
    <div className="flex flex-col items-center gap-3">
      <Calendar
        mode="single"
        selected={date}
        defaultMonth={date}
        onSelect={(d) => d && onSelect(d)}
        disabled={{ before: startOfDay(new Date()) }}
      />
      <div className="text-center">
        <p className="text-sm font-semibold capitalize text-foreground">
          {t("dateWeekday", { day }) || `Dia da semana: ${day}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("dateHint", { phrase }) || `Se o horário se repetir, ele cairá ${phrase}.`}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { CalendarClock, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

type SlotType = "NORMAL" | "REPOSICAO";

interface TypeStepProps {
  value: SlotType;
  onSelect: (type: SlotType) => void;
}

export function TypeStep({ value, onSelect }: TypeStepProps) {
  const t = useTranslations("SlotWizard");

  const options: { type: SlotType; icon: typeof CalendarClock; title: string; desc: string }[] = [
    {
      type: "NORMAL",
      icon: CalendarClock,
      title: t("typeNormalTitle") || "Horário normal",
      desc: t("typeNormalDesc") || "Disponibilidade fixa para aulas regulares com seus alunos.",
    },
    {
      type: "REPOSICAO",
      icon: Repeat,
      title: t("typeMakeupTitle") || "Reposição",
      desc: t("typeMakeupDesc") || "Horário para repor aulas, pontual ou recorrente.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map(({ type, icon: Icon, title, desc }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
            "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5",
            value === type && "border-primary bg-primary/5"
          )}
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { getFrequencyLabel, type WizardFrequency } from "../../../slot-wizard.utils";

const FREQUENCIES: WizardFrequency[] = ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"];

interface FrequencyStepProps {
  value: WizardFrequency;
  dayIndex: number;
  locale: "pt" | "en";
  onChange: (frequency: WizardFrequency) => void;
}

export function FrequencyStep({ value, dayIndex, locale, onChange }: FrequencyStepProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {FREQUENCIES.map((frequency) => (
        <button
          key={frequency}
          type="button"
          onClick={() => onChange(frequency)}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-colors",
            "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5",
            value === frequency && "border-primary bg-primary/5 text-primary"
          )}
        >
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
              value === frequency ? "border-primary" : "border-gray-300 dark:border-gray-600"
            )}
          >
            {value === frequency && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>
          {getFrequencyLabel(frequency, dayIndex, locale)}
        </button>
      ))}
    </div>
  );
}

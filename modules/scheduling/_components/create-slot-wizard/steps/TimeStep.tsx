"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkSlotConflictAction, checkSlotsConflictBatchAction } from "../../../scheduling.actions";
import {
  buildSlotRange,
  buildTimeGrid,
  getSlotEndTime,
  isPastStart,
  isValidTime,
  minutesToTime,
  overlapsAny,
  sortTimes,
  timeToMinutes,
} from "../../../slot-wizard.utils";

interface TimeStepProps {
  teacherId: string;
  date: Date;
  selected: string[];
  onChange: (startTimes: string[]) => void;
  onBusyChange: (busy: boolean) => void;
}

export function TimeStep({ teacherId, date, selected, onChange, onBusyChange }: TimeStepProps) {
  const t = useTranslations("SlotWizard");
  const grid = useMemo(() => buildTimeGrid(), []);
  const dateKey = format(date, "yyyy-MM-dd");

  const [conflicts, setConflicts] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking] = useState(true);
  const [customTime, setCustomTime] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Uma única consulta cobre toda a grade do dia escolhido.
  useEffect(() => {
    let cancelled = false;
    setIsChecking(true);
    onBusyChange(true);

    const run = async () => {
      try {
        const result = await checkSlotsConflictBatchAction({
          teacherId,
          slots: grid.map((start) => buildSlotRange(date, start)),
        });
        if (cancelled) return;
        const map: Record<string, boolean> = {};
        if (result?.data?.success && result.data.results) {
          result.data.results.forEach((res, idx) => {
            map[grid[idx]] = res.hasConflict;
          });
        }
        setConflicts(map);
      } catch {
        // O servidor valida de novo na criação; sem a checagem a grade fica toda livre.
        if (!cancelled) setConflicts({});
      } finally {
        if (!cancelled) {
          setIsChecking(false);
          onBusyChange(false);
        }
      }
    };
    run();

    return () => {
      cancelled = true;
      onBusyChange(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, teacherId]);

  const toggle = (start: string) => {
    onChange(
      selected.includes(start)
        ? selected.filter((s) => s !== start)
        : sortTimes([...selected, start])
    );
  };

  const isDisabled = (start: string) => {
    if (selected.includes(start)) return false;
    return conflicts[start] || isPastStart(date, start) || overlapsAny(start, selected);
  };

  const extras = selected.filter((start) => !grid.includes(start));

  const addCustom = async () => {
    setCustomError(null);
    if (!isValidTime(customTime)) {
      setCustomError(t("timeOtherInvalid") || "Informe um horário válido.");
      return;
    }
    const start = minutesToTime(timeToMinutes(customTime));
    if (selected.includes(start)) {
      setCustomError(t("timeOtherExists") || "Esse horário já está na lista.");
      return;
    }
    if (isPastStart(date, start)) {
      setCustomError(t("timeOtherPast") || "Esse horário já passou.");
      return;
    }
    if (overlapsAny(start, selected)) {
      setCustomError(t("timeOtherOverlap") || "Esse horário se sobrepõe a outro que você já escolheu.");
      return;
    }

    setIsAddingCustom(true);
    try {
      const { startAt, endAt } = buildSlotRange(date, start);
      const result = await checkSlotConflictAction({ teacherId, startAt, endAt });
      if (result?.data?.success && result.data.hasConflict) {
        setCustomError(t("timeOtherConflict") || "Você já tem uma aula nesse horário.");
        return;
      }
      onChange(sortTimes([...selected, start]));
      setCustomTime("");
    } finally {
      setIsAddingCustom(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">
          {t("timeSelected", { count: selected.length }) ||
            `${selected.length} horário(s) selecionado(s)`}
        </span>
        {isChecking && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {t("timeChecking") || "Verificando conflitos..."}
          </span>
        )}
      </div>

      <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
        {grid.map((start) => {
          const isSelected = selected.includes(start);
          const hasConflict = conflicts[start];
          return (
            <button
              key={start}
              type="button"
              disabled={isDisabled(start)}
              onClick={() => toggle(start)}
              className={cn(
                "flex h-11 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5",
                isSelected && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                !isSelected && "disabled:cursor-not-allowed disabled:opacity-40",
                hasConflict && !isSelected && "border-rose-500/30 bg-rose-500/5 text-rose-500"
              )}
            >
              {start}
              {hasConflict && !isSelected && (
                <span className="text-[9px] font-black uppercase leading-none tracking-wider">
                  {t("timeConflict") || "Conflito"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 rounded-xl border border-gray-200/60 p-4 dark:border-gray-700/60">
        <p className="text-xs font-semibold text-foreground">
          {t("timeOtherTitle") || "Outro horário"}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("timeOtherHint") || "Precisa de um horário que não está na lista? Informe o início."}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={customTime}
            onChange={(e) => {
              setCustomTime(e.target.value);
              setCustomError(null);
            }}
            className="input h-10 flex-1"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customTime || isAddingCustom}
            className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t("timeOtherAdd") || "Adicionar"}
          </button>
        </div>
        {customError && <p className="text-xs font-medium text-rose-500">{customError}</p>}

        {extras.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {extras.map((start) => (
              <span
                key={start}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              >
                {start} → {getSlotEndTime(start)}
                <button
                  type="button"
                  onClick={() => toggle(start)}
                  aria-label={t("timeRemove") || "Remover horário"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

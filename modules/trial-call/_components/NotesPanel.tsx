"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTrialNotesAction } from "../trial-call.actions";
import { CEFR_LEVELS, type TrialNotes } from "../trial-call.schema";

type Saving = "idle" | "saving" | "saved" | "error";

interface ChipsFieldProps {
  label: string;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  values: string[];
  suggestions?: string[];
  tone: "primary" | "good" | "warn";
  onChange: (next: string[]) => void;
}

const TONES = {
  primary: "bg-primary/10 text-primary",
  good: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
} as const;

/** Lista de itens curtos: sugestões de um toque (quando há) e um campo para adicionar. */
function ChipsField({ label, placeholder, addLabel, removeLabel, values, suggestions = [], tone, onChange }: ChipsFieldProps) {
  const [draft, setDraft] = useState("");

  const add = (value: string) => {
    const v = value.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</h3>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li key={v} className={cn("flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm font-medium", TONES[tone])}>
              {v}
              <button type="button" aria-label={`${removeLabel}: ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="grid size-5 place-items-center rounded-full hover:bg-black/10">
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {suggestions.filter((s) => !values.includes(s)).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !values.includes(s))
            .map((s) => (
              <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                + {s}
              </button>
            ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          maxLength={120}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(draft))}
          className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button type="button" aria-label={addLabel} onClick={() => add(draft)} disabled={!draft.trim()} className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

/** Anotações do professor durante a aula. Salva sozinho; o visitante nunca vê este painel. */
export function NotesPanel({ code, initialNotes }: { code: string; initialNotes: TrialNotes }) {
  const t = useTranslations("TrialClass.Notes");
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState<Saving>("idle");
  const first = useRef(true);
  const latest = useRef(notes);

  useEffect(() => {
    latest.current = notes;
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      setSaving("saving");
      const res = await saveTrialNotesAction({ code, notes: latest.current });
      setSaving(res?.data?.ok ? "saved" : "error");
    }, 800);
    return () => clearTimeout(timer);
  }, [notes, code]);

  const patch = (p: Partial<TrialNotes>) => setNotes((n) => ({ ...n, ...p }));
  const removeLabel = t("remove");
  const addLabel = t("add");

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5 text-foreground">
      <div className="flex items-center justify-between pr-10 lg:pr-0">
        <h2 className="text-lg font-black">{t("title")}</h2>
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground" role="status" aria-live="polite">
          {saving === "saving" && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {saving === "saved" && <Check className="size-3.5 text-emerald-500" aria-hidden />}
          {saving === "saving" ? t("saving") : saving === "error" ? t("error") : saving === "saved" ? t("saved") : t("auto")}
        </span>
      </div>

      <ChipsField
        label={t("goals")}
        placeholder={t("goalPlaceholder")}
        addLabel={addLabel}
        removeLabel={removeLabel}
        values={notes.goals}
        suggestions={t.raw("goalSuggestions") as string[]}
        tone="primary"
        onChange={(goals) => patch({ goals })}
      />

      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("level")}</h3>
        <div role="radiogroup" aria-label={t("level")} className="grid grid-cols-6 gap-1.5">
          {CEFR_LEVELS.map((lvl) => {
            const on = notes.level === lvl;
            return (
              <button
                key={lvl}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => patch({ level: on ? null : lvl })}
                className={cn("h-10 rounded-xl border text-sm font-bold transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </section>

      <ChipsField label={t("strengths")} placeholder={t("itemPlaceholder")} addLabel={addLabel} removeLabel={removeLabel} values={notes.strengths} tone="good" onChange={(strengths) => patch({ strengths })} />
      <ChipsField label={t("improve")} placeholder={t("itemPlaceholder")} addLabel={addLabel} removeLabel={removeLabel} values={notes.improve} tone="warn" onChange={(improve) => patch({ improve })} />

      <section className="space-y-2">
        <label htmlFor="trial-free-notes" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("freeText")}</label>
        <textarea
          id="trial-free-notes"
          value={notes.freeText}
          maxLength={4000}
          rows={5}
          placeholder={t("freePlaceholder")}
          onChange={(e) => patch({ freeText: e.target.value })}
          className="w-full resize-none rounded-2xl border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </section>
    </div>
  );
}

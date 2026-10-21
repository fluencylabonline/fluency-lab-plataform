// Cor por faixa do CEFR: A (básico), B (intermediário), C (avançado).
const LEVEL_STYLES: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  B: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  C: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
};

export function levelBadgeClass(level?: string | null): string {
  return LEVEL_STYLES[level?.charAt(0) ?? ""] ?? "bg-slate-500/15 text-slate-700 ring-slate-500/30 dark:text-slate-300";
}

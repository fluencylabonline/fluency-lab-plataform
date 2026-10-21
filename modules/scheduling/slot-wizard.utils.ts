// Funções puras do wizard de criação de horários do professor.
// Sem React, sem Next, sem banco: tudo aqui é testável isoladamente.

export type WizardFrequency = "NONE" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
type WizardLocale = "pt" | "en";

export const SLOT_DURATION_MIN = 45;
export const GRID_START_MIN = 6 * 60;
export const GRID_END_MIN = 22 * 60;
export const GRID_STEP_MIN = 15;

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export function isValidTime(time: string): boolean {
  return TIME_REGEX.test(time);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getSlotEndTime(startTime: string): string {
  return minutesToTime(timeToMinutes(startTime) + SLOT_DURATION_MIN);
}

/** Inícios possíveis (a cada 15 min) cujo término de 45 min cabe dentro da faixa do dia. */
export function buildTimeGrid(): string[] {
  const starts: string[] = [];
  for (
    let current = GRID_START_MIN;
    current + SLOT_DURATION_MIN <= GRID_END_MIN;
    current += GRID_STEP_MIN
  ) {
    starts.push(minutesToTime(current));
  }
  return starts;
}

/** Dois horários de 45 min se sobrepõem quando seus inícios distam menos que 45 min. */
export function slotsOverlap(startA: string, startB: string): boolean {
  return Math.abs(timeToMinutes(startA) - timeToMinutes(startB)) < SLOT_DURATION_MIN;
}

export function overlapsAny(start: string, selected: string[]): boolean {
  return selected.some((other) => other !== start && slotsOverlap(start, other));
}

export function sortTimes(times: string[]): string[] {
  return [...times].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

/** Retorna true quando o horário já passou no dia informado (só relevante se o dia for hoje). */
export function isPastStart(date: Date, startTime: string, now: Date = new Date()): boolean {
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (!sameDay) return false;
  return timeToMinutes(startTime) <= now.getHours() * 60 + now.getMinutes();
}

/** Intervalo ISO de uma aula de 45 min no dia informado, no fuso local, para checagem de conflito. */
export function buildSlotRange(date: Date, startTime: string): { startAt: string; endAt: string } {
  const startMin = timeToMinutes(startTime);
  const start = new Date(date);
  start.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  const end = new Date(start.getTime() + SLOT_DURATION_MIN * 60_000);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

const WEEKDAYS: Record<WizardLocale, string[]> = {
  pt: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export function getWeekdayName(dayIndex: number, locale: WizardLocale): string {
  return WEEKDAYS[locale][dayIndex];
}

const isMasculineDay = (dayIndex: number) => dayIndex === 0 || dayIndex === 6;

/** "toda quarta" / "todo sábado" — o dia vem sempre da data de início escolhida. */
export function getEveryWeekdayPhrase(dayIndex: number, locale: WizardLocale): string {
  const day = getWeekdayName(dayIndex, locale);
  if (locale === "pt") return `${isMasculineDay(dayIndex) ? "todo" : "toda"} ${day}`;
  return `every ${day}`;
}

export function getFrequencyLabel(
  frequency: WizardFrequency,
  dayIndex: number,
  locale: WizardLocale
): string {
  const day = getWeekdayName(dayIndex, locale);
  if (locale === "pt") {
    const every = getEveryWeekdayPhrase(dayIndex, "pt");
    const on = isMasculineDay(dayIndex) ? "no" : "na";
    if (frequency === "NONE") return "Único (só nesta data)";
    if (frequency === "WEEKLY") return `Semanal (${every})`;
    if (frequency === "BIWEEKLY") return `Quinzenal (${every})`;
    return `Mensal (${on} ${day})`;
  }
  if (frequency === "NONE") return "One time (this date only)";
  if (frequency === "WEEKLY") return `Weekly (every ${day})`;
  if (frequency === "BIWEEKLY") return `Biweekly (every other ${day})`;
  return `Monthly (on ${day})`;
}

export function getDefaultFrequency(type: "NORMAL" | "REPOSICAO"): WizardFrequency {
  return type === "REPOSICAO" ? "NONE" : "WEEKLY";
}

/** Frase única do resumo: "Toda quarta, às 14:00–14:45 e 15:00–15:45, a partir de 05/11." */
export function buildSummarySentence(params: {
  frequency: WizardFrequency;
  dayIndex: number;
  dateLabel: string;
  startTimes: string[];
  locale: WizardLocale;
}): string {
  const { frequency, dayIndex, dateLabel, startTimes, locale } = params;
  const ranges = sortTimes(startTimes).map((start) => `${start}–${getSlotEndTime(start)}`);
  const day = getWeekdayName(dayIndex, locale);

  if (locale === "pt") {
    const list = joinList(ranges, "e");
    const on = isMasculineDay(dayIndex) ? "no" : "na";
    if (frequency === "NONE") return `Em ${dateLabel} (${day}), às ${list}.`;
    const when =
      frequency === "WEEKLY"
        ? capitalize(getEveryWeekdayPhrase(dayIndex, "pt"))
        : frequency === "BIWEEKLY"
          ? `A cada duas semanas, ${on} ${day}`
          : `Uma vez por mês, ${on} ${day}`;
    return `${when}, às ${list}, a partir de ${dateLabel}.`;
  }

  const list = joinList(ranges, "and");
  if (frequency === "NONE") return `On ${dateLabel} (${day}), at ${list}.`;
  const when =
    frequency === "WEEKLY"
      ? `Every ${day}`
      : frequency === "BIWEEKLY"
        ? `Every other ${day}`
        : `Once a month, on ${day}`;
  return `${when}, at ${list}, starting ${dateLabel}.`;
}

function joinList(items: string[], conjunction: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

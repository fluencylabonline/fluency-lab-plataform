/**
 * Calendário da política de inadimplência.
 *
 * Duas convenções convivem aqui e a mistura é proposital:
 * - "Hoje" é sempre o dia civil de Brasília. O cron roda em UTC, mas a regra
 *   ("último dia do mês", "dia 1 do mês seguinte") é contada no horário do aluno.
 * - O vencimento (`installments.due_date`) é gravado com `startOfDay` num
 *   servidor em UTC, então a data correta está nas partes UTC — é o mesmo
 *   motivo de a UI formatar o vencimento com `timeZone: "UTC"`.
 *
 * Funções puras, sem banco, para poderem ser testadas isoladamente.
 */

const BRT = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CivilDate {
  year: number;
  month: number; // 0-indexed
  day: number;
}

export function brtCivilDate(date: Date): CivilDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRT,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month") - 1, day: get("day") };
}

export function dueCivilDate(dueDate: Date): CivilDate {
  const d = new Date(dueDate);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

/** Índice absoluto do mês, para comparar meses sem se preocupar com virada de ano. */
export function monthIndex(d: CivilDate): number {
  return d.year * 12 + d.month;
}

/** Dias corridos entre duas datas civis (b - a). */
export function civilDaysBetween(a: CivilDate, b: CivilDate): number {
  return Math.round(
    (Date.UTC(b.year, b.month, b.day) - Date.UTC(a.year, a.month, a.day)) / DAY_MS
  );
}

export function addCivilDays(d: CivilDate, days: number): CivilDate {
  const u = new Date(Date.UTC(d.year, d.month, d.day + days));
  return { year: u.getUTCFullYear(), month: u.getUTCMonth(), day: u.getUTCDate() };
}

export function isLastDayOfMonth(d: CivilDate): boolean {
  return addCivilDays(d, 1).month !== d.month;
}

/** Instante UTC da meia-noite de Brasília no dia civil informado. */
export function brtMidnightUtc(d: CivilDate): Date {
  // Brasília não tem horário de verão desde 2019: UTC-3 fixo.
  return new Date(Date.UTC(d.year, d.month, d.day, 3, 0, 0, 0));
}

/** [início, fim] em UTC do dia civil de Brasília. */
export function brtDayRangeUtc(d: CivilDate): { start: Date; end: Date } {
  const start = brtMidnightUtc(d);
  return { start, end: new Date(start.getTime() + DAY_MS - 1) };
}

/**
 * Meses de atraso de uma parcela em relação a "hoje":
 * 0 = vence/venceu no mês corrente (fase de lembretes),
 * 1 = mês seguinte ao vencimento (fase de bloqueio),
 * 2+ = passou o mês de bloqueio inteiro (cancelamento automático).
 */
export function monthsPastDue(dueDate: Date, today: CivilDate): number {
  return monthIndex(today) - monthIndex(dueCivilDate(dueDate));
}

/**
 * A política só vale para parcelas que vencem a partir da data de início
 * (Configurações → Políticas). Desligada (`policyStart` null), lembretes
 * continuam, mas ninguém é bloqueado ou cancelado.
 */
export function isUnderPolicy(dueDate: Date, policyStart: Date | null): boolean {
  if (!policyStart) return false;
  return new Date(dueDate).getTime() >= policyStart.getTime();
}

export const DELINQUENCY_REMINDER_INTERVAL_DAYS = 3;
export const DELINQUENCY_BLOCKED_REMINDER_INTERVAL_DAYS = 7;

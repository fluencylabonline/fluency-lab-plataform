/**
 * Recesso de fim de ano: sem aulas ao vivo nas duas últimas semanas de
 * dezembro e nas duas primeiras de janeiro. Regra fixa, todo ano, no horário
 * de Brasília. Funções puras para poderem ser testadas sem relógio.
 */

const TIME_ZONE = "America/Sao_Paulo";

/** Primeiro dia sem aula ao vivo (inclusive). */
export const HOLIDAY_RECESS_START = { month: 12, day: 18 };
/** Último dia sem aula ao vivo (inclusive); as aulas voltam no dia seguinte. */
export const HOLIDAY_RECESS_END = { month: 1, day: 14 };

/** Ano, mês (1-12) e dia no horário de Brasília. */
export function brtDate(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * true de 18/12 até 14/01 (Brasília). Fora de produção, HOLIDAY_RECESS_FORCE=true
 * liga o período para testar no preview em qualquer época do ano.
 */
export function isHolidayRecessPeriod(date: Date = new Date(), env: Record<string, string | undefined> = process.env): boolean {
  if (env.HOLIDAY_RECESS_FORCE === "true" && env.VERCEL_ENV !== "production") return true;
  const { month, day } = brtDate(date);
  if (month === HOLIDAY_RECESS_START.month) return day >= HOLIDAY_RECESS_START.day;
  if (month === HOLIDAY_RECESS_END.month) return day <= HOLIDAY_RECESS_END.day;
  return false;
}

/** Datas (dd/mm) em que as aulas param e voltam, para os textos. */
export function holidayRecessDates(date: Date = new Date()) {
  const { year, month } = brtDate(date);
  // Em janeiro, o recesso começou no ano anterior.
  const startYear = month === 1 ? year - 1 : year;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startYear,
    firstDayOff: `${pad(HOLIDAY_RECESS_START.day)}/${pad(HOLIDAY_RECESS_START.month)}`,
    returnDay: `${pad(HOLIDAY_RECESS_END.day + 1)}/${pad(HOLIDAY_RECESS_END.month)}`,
    endDay: `${pad(HOLIDAY_RECESS_END.day)}/${pad(HOLIDAY_RECESS_END.month)}`,
  };
}

export type HolidayRecessCampaign = "dec-01" | "dec-15" | "jan-01" | "jan-10";

export const HOLIDAY_RECESS_CAMPAIGNS: Record<HolidayRecessCampaign, { month: number; day: number; kind: "start" | "return" }> = {
  "dec-01": { month: 12, day: 1, kind: "start" },
  "dec-15": { month: 12, day: 15, kind: "start" },
  "jan-01": { month: 1, day: 1, kind: "return" },
  "jan-10": { month: 1, day: 10, kind: "return" },
};

/** Campanha de e-mail do dia (Brasília), ou null se hoje não é dia de envio. */
export function holidayRecessCampaignFor(date: Date = new Date()): HolidayRecessCampaign | null {
  const { month, day } = brtDate(date);
  const match = (Object.entries(HOLIDAY_RECESS_CAMPAIGNS) as [HolidayRecessCampaign, { month: number; day: number }][])
    .find(([, c]) => c.month === month && c.day === day);
  return match?.[0] ?? null;
}

/** Chave única por campanha e ano, usada para nunca enviar a mesma campanha duas vezes. */
export function holidayRecessCampaignKey(campaign: HolidayRecessCampaign, date: Date = new Date()): string {
  return `${brtDate(date).year}-${campaign}`;
}

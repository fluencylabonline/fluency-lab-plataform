/**
 * Horário de silêncio: nenhuma mensagem automática (push, email, WhatsApp)
 * sai entre 00:00 e 07:00 no horário de Brasília.
 *
 * Funções puras para poderem ser testadas sem relógio. Brasília não tem
 * horário de verão desde 2019, mas usamos o fuso pelo nome para não depender
 * disso.
 */

const TIME_ZONE = "America/Sao_Paulo";

export const QUIET_HOURS_START = 0; // inclusive
export const QUIET_HOURS_END = 7; // exclusive: 07:00 já pode enviar

/** Hora (0-23) e minuto no horário de Brasília. */
export function brtHourMinute(date: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value);
  return { hour: get("hour"), minute: get("minute") };
}

/** true entre 00:00 e 06:59 (Brasília). */
export function isQuietHours(date: Date = new Date()): boolean {
  const { hour } = brtHourMinute(date);
  return hour >= QUIET_HOURS_START && hour < QUIET_HOURS_END;
}

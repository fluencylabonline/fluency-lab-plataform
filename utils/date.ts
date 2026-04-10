import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  addMinutes,
  addHours,
  addDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import type { Locale } from "@/i18n/config";

const localeMap: Record<Locale, typeof ptBR> = {
  "pt": ptBR,
  en: enUS,
};

/**
 * Format a date with a pattern string.
 * @example formatDate(new Date(), "dd/MM/yyyy", "pt") → "09/04/2026"
 */
export function formatDate(
  date: Date,
  pattern: string,
  locale: Locale = "pt"
) {
  return format(date, pattern, { locale: localeMap[locale] });
}

/**
 * Format a date relative to now.
 * @example formatRelative(someDate, "pt") → "há 2 horas"
 */
export function formatRelative(date: Date, locale: Locale = "pt") {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: localeMap[locale],
  });
}

export {
  isAfter,
  isBefore,
  addMinutes,
  addHours,
  addDays,
  startOfDay,
  endOfDay,
  differenceInMinutes,
};

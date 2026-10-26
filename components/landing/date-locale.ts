import { useLocale } from "next-intl";
import { enUS, ptBR } from "date-fns/locale";

/** Locale do date-fns acompanhando o idioma atual da página (pt → ptBR, en → enUS). */
export function useDateLocale() {
  return useLocale() === "en" ? enUS : ptBR;
}

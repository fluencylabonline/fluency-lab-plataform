"use client";

import { useTranslations } from "next-intl";

/**
 * Traduz mensagens de erro vindas dos schemas zod. Os schemas guardam a chave
 * completa com namespace (ex.: "UserManagement.validation.nameRequired"); usar
 * `t(msg)` dentro de `useTranslations("UserManagement")` duplicava o namespace.
 * Aqui a busca é na raiz; textos que não são chave passam como estão.
 */
export function useValidationMessage() {
  const t = useTranslations();
  return (message?: string): string | undefined => {
    if (!message) return undefined;
    type Key = Parameters<typeof t>[0];
    return t.has(message as Key) ? t(message as Key) : message;
  };
}

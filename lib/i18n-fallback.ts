import { IntlErrorCode, type IntlError } from "next-intl";

/**
 * Chave ausente: next-intl devolve o caminho ("Namespace.chave"), que é truthy,
 * então o padrão `t("x") || "texto"` nunca usava o texto e o usuário via a chave
 * crua. Com fallback vazio o `||` passa a funcionar. O teste
 * lib/__tests__/i18n-keys.test.ts impede chaves ausentes de chegarem ao main.
 */
export function getMessageFallback(): string {
  return "";
}

export function onIntlError(error: IntlError): void {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    if (process.env.NODE_ENV !== "production") console.error(`[i18n] ${error.message}`);
    return;
  }
  console.error("[i18n]", error);
}

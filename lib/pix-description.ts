// Sem dependências de servidor: usado pelo billing e testável isoladamente.

/**
 * Limite usado para a descrição da cobrança PIX (o provedor recusa textos longos).
 */
export const PIX_DESCRIPTION_MAX = 30;

/** Remove acentos e caracteres que o provedor recusa (ex.: "[", "]"). */
export function sanitizePixText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .\-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Monta a descrição da cobrança cortando só o nome do plano, nunca o prefixo
 * nem o final (ex.: a parcela "3/12").
 */
export function buildPixDescription(prefix: string, planName: string, tail = "", max = PIX_DESCRIPTION_MAX): string {
  const cleanPrefix = sanitizePixText(prefix);
  const cleanTail = sanitizePixText(tail);
  const fixed = [cleanPrefix, cleanTail].filter(Boolean).join(" ").length;
  const separators = (cleanPrefix ? 1 : 0) + (cleanTail ? 1 : 0);
  const room = Math.max(0, max - fixed - separators);
  const name = sanitizePixText(planName).slice(0, room).trim();
  return [cleanPrefix, name, cleanTail].filter(Boolean).join(" ").slice(0, max);
}

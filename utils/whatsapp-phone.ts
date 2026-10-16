/**
 * Celulares brasileiros têm duas grafias válidas no WhatsApp: com o 9º dígito
 * (55 + DDD + 9 + 8 dígitos) e sem ele (55 + DDD + 8 dígitos). A Meta devolve o
 * wa_id em uma delas e o cadastro do aluno costuma estar na outra — por isso o
 * mesmo contato virava duas conversas.
 *
 * Retorna todas as grafias equivalentes do número (sempre inclui a original).
 */
export function waIdVariants(waId: string): string[] {
  const digits = waId.replace(/\D/g, "");
  const variants = new Set([digits]);

  // 55 + DDD + 9 + 8 dígitos  →  também sem o 9
  if (/^55\d{2}9\d{8}$/.test(digits)) {
    variants.add(digits.slice(0, 4) + digits.slice(5));
  }
  // 55 + DDD + 8 dígitos de celular (começam em 6-9)  →  também com o 9
  else if (/^55\d{2}[6-9]\d{7}$/.test(digits)) {
    variants.add(digits.slice(0, 4) + "9" + digits.slice(4));
  }

  return [...variants];
}

/** Chave única para agrupar grafias equivalentes: a forma com o 9º dígito. */
export function canonicalWaId(waId: string): string {
  const variants = waIdVariants(waId);
  return variants.find((v) => v.length === 13) ?? variants[0];
}

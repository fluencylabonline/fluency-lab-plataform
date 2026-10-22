/**
 * Cota mensal de reagendamentos do aluno (2 por mês, sem acumular).
 *
 * Reagendamento feito com crédito de reposição (cancelamento do professor, bônus ou
 * atraso) NÃO gasta a cota: o crédito é o "pagamento" dessa aula. Só contam os
 * reagendamentos sem crédito. Função pura, testável sem banco.
 */

export const RESCHEDULE_MONTHLY_LIMIT = 2;

/** Quantos dos reagendamentos do mês gastaram cota (os pagos com crédito ficam de fora). */
export function countQuotaReschedules(reschedules: { creditId: string | null }[]): number {
  return reschedules.filter((r) => !r.creditId).length;
}

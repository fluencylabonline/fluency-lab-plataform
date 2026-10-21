/**
 * Aviso de reposição no perfil do aluno: quando o professor cancela uma aula, o aluno
 * ganha um crédito e o card de próxima aula oferece "Reagendar" até a próxima aula começar.
 *
 * Funções puras, testáveis sem banco nem relógio. As consultas ficam no repositório e o
 * serviço só junta as peças (ver schedulingService.getPendingTeacherCancellationReschedule).
 */

type DateLike = Date | string;

export interface CanceledClass {
  id: string;
  startAt: DateLike;
  teacherId: string;
}

export interface TeacherCancellationCredit {
  id: string;
  expiresAt: DateLike;
}

export interface PendingTeacherCancellation {
  classId: string;
  startAt: Date;
  teacherId: string;
  creditId: string;
  creditExpiresAt: Date;
}

const ms = (value: DateLike) => new Date(value).getTime();

/**
 * Escolhe a aula cancelada pelo professor que o card deve mostrar, ou null.
 *
 * - Só entra aula ainda não reposta, e só enquanto o aluno tiver um crédito de
 *   cancelamento válido (bonus e late-students não contam).
 * - Mostra uma aula por vez: a cancelada mais recente.
 * - A janela fecha quando a próxima aula do aluno começa: se alguma aula real
 *   (agendada, concluída, no-show) começou depois da cancelada, o card volta ao normal.
 *   Sem próxima aula marcada, a janela vai até o crédito expirar.
 */
export function pickPendingTeacherCancellation(input: {
  canceled: CanceledClass[];
  replacedClassIds: string[];
  /** Início de cada aula real do aluno (não canceladas) perto do período. */
  realClassStarts: DateLike[];
  credits: TeacherCancellationCredit[];
  now?: Date;
}): PendingTeacherCancellation | null {
  const now = (input.now ?? new Date()).getTime();

  // O crédito que o servidor vai consumir: o que vence primeiro.
  const credit = input.credits
    .filter((c) => ms(c.expiresAt) > now)
    .sort((a, b) => ms(a.expiresAt) - ms(b.expiresAt))[0];
  if (!credit) return null;

  const replaced = new Set(input.replacedClassIds);
  const candidate = input.canceled
    .filter((c) => !replaced.has(c.id))
    .sort((a, b) => ms(b.startAt) - ms(a.startAt))[0];
  if (!candidate) return null;

  const start = ms(candidate.startAt);
  const nextClassAlreadyStarted = input.realClassStarts.some((s) => ms(s) > start && ms(s) <= now);
  if (nextClassAlreadyStarted) return null;

  return {
    classId: candidate.id,
    startAt: new Date(candidate.startAt),
    teacherId: candidate.teacherId,
    creditId: credit.id,
    creditExpiresAt: new Date(credit.expiresAt),
  };
}

/**
 * Regras de exibição da agenda do aluno. São só leitura da regra que o servidor já aplica
 * (modules/scheduling): a tela usa isto para mostrar apenas as ações que valem.
 */

/** Antecedência mínima (horas) para remarcar; cancelar abaixo disso vira falta. */
export const MIN_HOURS_TO_RESCHEDULE = 4;

export type StatusGroup = "scheduled" | "completed" | "canceled" | "noShow" | "recess" | "overdue";

export function statusGroup(status: string): StatusGroup {
  switch (status) {
    case "scheduled":
    case "rescheduled":
    case "available":
      return "scheduled";
    case "completed":
      return "completed";
    case "no-show":
      return "noShow";
    case "teacher-recess":
      return "recess";
    case "overdue":
      return "overdue";
    default:
      // canceled-student | canceled-teacher | canceled-admin | canceled-credit
      return "canceled";
  }
}

export interface ClassLike {
  status: string;
  startAt: Date | string;
  fallbackLessonId?: string | null;
}

export interface ClassActions {
  /** Remarcar pela cota mensal (aula agendada, com antecedência e cota disponível). */
  canReschedule: boolean;
  /** Aula agendada que o aluno pode cancelar. */
  canCancel: boolean;
  /** Cancelar agora conta como falta (menos de 4h). */
  cancelIsNoShow: boolean;
  /** Aula agendada, mas a cota do mês acabou. */
  quotaExhausted: boolean;
  /** Aula cancelada pelo professor: repõe com crédito, sem gastar a cota. */
  canReplaceWithCredit: boolean;
  /** Aula cancelada pelo professor e o aluno não tem crédito de reposição ativo. */
  noCredit: boolean;
  /** Recesso do professor com atividade alternativa liberada. */
  hasRecessActivity: boolean;
}

interface Context {
  now: Date;
  quotaExhausted: boolean;
  /** Créditos ativos de cancelamento do professor. */
  teacherCredits: number;
}

export function hoursUntil(startAt: Date | string, now: Date): number {
  return (new Date(startAt).getTime() - now.getTime()) / 3_600_000;
}

export function classActions(cls: ClassLike, ctx: Context): ClassActions {
  const scheduled = cls.status === "scheduled";
  const withinWindow = scheduled && hoursUntil(cls.startAt, ctx.now) < MIN_HOURS_TO_RESCHEDULE;
  const teacherCanceled = cls.status === "canceled-teacher";

  return {
    canReschedule: scheduled && !withinWindow && !ctx.quotaExhausted,
    canCancel: scheduled,
    cancelIsNoShow: withinWindow,
    quotaExhausted: scheduled && !withinWindow && ctx.quotaExhausted,
    canReplaceWithCredit: teacherCanceled && ctx.teacherCredits > 0,
    noCredit: teacherCanceled && ctx.teacherCredits <= 0,
    hasRecessActivity: cls.status === "teacher-recess" && !!cls.fallbackLessonId,
  };
}

export interface MonthGroup<T> {
  /** yyyy-MM, estável para chave de lista. */
  key: string;
  /** Primeiro dia do mês (para formatar o rótulo). */
  date: Date;
  items: T[];
}

/** Agrupa por mês mantendo a ordem de entrada (a lista já vem ordenada pelo servidor). */
export function groupByMonth<T extends { startAt: Date | string }>(items: T[]): MonthGroup<T>[] {
  const groups = new Map<string, MonthGroup<T>>();
  for (const item of items) {
    const d = new Date(item.startAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, date: new Date(d.getFullYear(), d.getMonth(), 1), items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()];
}

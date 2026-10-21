/**
 * Quando o perfil do aluno avisa das atividades de recesso: só se houver pelo
 * menos RECESS_NOTICE_MIN_CLASSES aulas em recesso nas próximas
 * RECESS_NOTICE_WINDOW_DAYS dias. Aulas passadas não contam (continuam na lista).
 * Função pura, testável sem relógio.
 */

export const RECESS_NOTICE_MIN_CLASSES = 1;
export const RECESS_NOTICE_WINDOW_DAYS = 14;

/** Quantas das aulas em recesso caem entre agora e o fim da janela. */
export function countUpcomingRecessClasses(
  classes: { startAt: Date | string }[],
  now: Date = new Date(),
  windowDays: number = RECESS_NOTICE_WINDOW_DAYS
): number {
  const from = now.getTime();
  const to = from + windowDays * 86_400_000;
  return classes.filter((c) => {
    const start = new Date(c.startAt).getTime();
    return start >= from && start <= to;
  }).length;
}

/** Número a mostrar no cartão, ou 0 quando o cartão não deve aparecer. */
export function recessNoticeCount(classes: { startAt: Date | string }[], now: Date = new Date()): number {
  const upcoming = countUpcomingRecessClasses(classes, now);
  return upcoming >= RECESS_NOTICE_MIN_CLASSES ? upcoming : 0;
}

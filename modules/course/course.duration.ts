/**
 * Duração total do curso em texto livre: aceita "10", "10h", "1h30", "1h 30min",
 * "90min", "45 min". Número sem unidade continua significando horas (compatível
 * com o formato antigo). Devolve o texto normalizado ou null se inválido.
 */
const DURATION_RE = /^\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*(min|m)?)?\s*$/i;

export function normalizeCourseDuration(input: string): string | null {
  const m = DURATION_RE.exec(input);
  if (!m) return null;
  const [, h, rest, unit] = m;
  if (h === undefined && rest === undefined) return null;

  let hours = h ? parseInt(h, 10) : 0;
  let minutes = 0;
  if (rest !== undefined) {
    // "10" sozinho = horas; depois de "Nh" ou com "min" = minutos.
    if (h === undefined && !unit) hours = parseInt(rest, 10);
    else minutes = parseInt(rest, 10);
  }
  hours += Math.floor(minutes / 60);
  minutes %= 60;
  if (hours === 0 && minutes === 0) return null;

  return [hours ? `${hours}h` : "", minutes ? `${minutes}min` : ""].filter(Boolean).join(" ");
}

export const COURSE_DURATION_ERROR = "Use um formato como 10h, 1h30 ou 45min";

/**
 * Funções puras de rota da ajuda de página — sem nenhum conteúdo importado,
 * para poderem ir ao cliente sem arrastar o texto de todos os papéis.
 */

import type { HelpRoute } from "./page-help.types";

const isDynamicSegment = (segment: string) =>
  segment.startsWith("[") && segment.endsWith("]");

/**
 * Casa um `pathname` real com um dos padrões de rota em `routes`.
 *
 * Exato primeiro; depois segmento a segmento, tratando `[param]` como coringa.
 * Entre vários candidatos vence o com menos coringas — assim
 * `/hub/teacher/recess/new` ganha de `/hub/teacher/recess/[id]`.
 */
export function matchHelpRoute(
  pathname: string | null,
  routes: readonly HelpRoute[],
): HelpRoute | null {
  if (!pathname) return null;

  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (routes.includes(normalized as HelpRoute)) {
    return normalized as HelpRoute;
  }

  const parts = normalized.split("/");
  let best: HelpRoute | null = null;
  let bestWildcards = Number.POSITIVE_INFINITY;

  for (const route of routes) {
    const routeParts = route.split("/");
    if (routeParts.length !== parts.length) continue;

    let wildcards = 0;
    let matches = true;

    for (let i = 0; i < routeParts.length; i += 1) {
      const routePart = routeParts[i];
      if (isDynamicSegment(routePart)) {
        // Um segmento dinâmico casa com qualquer coisa, menos vazio.
        if (!parts[i]) {
          matches = false;
          break;
        }
        wildcards += 1;
        continue;
      }
      if (routePart !== parts[i]) {
        matches = false;
        break;
      }
    }

    if (matches && wildcards < bestWildcards) {
      best = route;
      bestWildcards = wildcards;
    }
  }

  return best;
}

/** O papel dono da rota, para montar o link da Central de Ajuda. */
export function helpRouteRole(
  route: HelpRoute,
): "admin" | "manager" | "teacher" | "student" | null {
  const segment = route.split("/")[2];
  if (
    segment === "admin" ||
    segment === "manager" ||
    segment === "teacher" ||
    segment === "student"
  ) {
    return segment;
  }
  return null;
}

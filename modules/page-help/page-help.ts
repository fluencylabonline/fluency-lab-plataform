/**
 * Registry da ajuda de página — fonte única da verdade.
 *
 * Junta os arquivos de `content/` (um por papel, um por idioma) num único mapa
 * e resolve o `pathname` atual para a entrada certa, inclusive em rotas
 * dinâmicas (`/hub/admin/users/abc123` → `/hub/admin/users/[userId]`).
 *
 * Regra de manutenção: ver `.agents/rules/page-help.md`.
 */

import { defaultLocale, type Locale } from "@/i18n/config";

import { STUDENT_HELP_EN } from "./content/student.en";
import { STUDENT_HELP_PT } from "./content/student.pt";
import { TEACHER_HELP_EN } from "./content/teacher.en";
import { TEACHER_HELP_PT } from "./content/teacher.pt";
import { MANAGER_HELP_EN } from "./content/manager.en";
import { MANAGER_HELP_PT } from "./content/manager.pt";
import { ADMIN_HELP_EN } from "./content/admin.en";
import { ADMIN_HELP_PT } from "./content/admin.pt";
import { SHARED_HELP_EN } from "./content/shared.en";
import { SHARED_HELP_PT } from "./content/shared.pt";
import type { HelpRoute, PageHelp } from "./page-help.types";

/**
 * Todo o conteúdo, por idioma.
 *
 * O tipo `Record<Locale, Record<HelpRoute, PageHelp>>` é o guarda-corpo
 * principal: falta uma rota em `pt` ou em `en` e o build falha.
 */
const PAGE_HELP: Record<Locale, Record<HelpRoute, PageHelp>> = {
  pt: {
    ...STUDENT_HELP_PT,
    ...TEACHER_HELP_PT,
    ...MANAGER_HELP_PT,
    ...ADMIN_HELP_PT,
    ...SHARED_HELP_PT,
  },
  en: {
    ...STUDENT_HELP_EN,
    ...TEACHER_HELP_EN,
    ...MANAGER_HELP_EN,
    ...ADMIN_HELP_EN,
    ...SHARED_HELP_EN,
  },
};

/** Todas as rotas com ajuda, da mais específica para a menos. */
const HELP_ROUTES = Object.keys(PAGE_HELP.pt) as HelpRoute[];

const isDynamicSegment = (segment: string) =>
  segment.startsWith("[") && segment.endsWith("]");

/**
 * Casa um `pathname` real com um padrão de rota do registry.
 *
 * Exato primeiro; depois segmento a segmento, tratando `[param]` como coringa.
 * Entre vários candidatos vence o com menos coringas — assim
 * `/hub/teacher/recess/new` ganha de `/hub/teacher/recess/[id]`.
 */
export function matchHelpRoute(pathname: string | null): HelpRoute | null {
  if (!pathname) return null;

  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if (HELP_ROUTES.includes(normalized as HelpRoute)) {
    return normalized as HelpRoute;
  }

  const parts = normalized.split("/");
  let best: HelpRoute | null = null;
  let bestWildcards = Number.POSITIVE_INFINITY;

  for (const route of HELP_ROUTES) {
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

/** A ajuda da rota atual no idioma pedido, ou `null` se a rota não tem ajuda. */
export function resolvePageHelp(
  pathname: string | null,
  locale: string,
): { route: HelpRoute; help: PageHelp } | null {
  const route = matchHelpRoute(pathname);
  if (!route) return null;

  const dictionary =
    PAGE_HELP[locale as Locale] ?? PAGE_HELP[defaultLocale];
  const help = dictionary[route] ?? PAGE_HELP[defaultLocale][route];
  if (!help) return null;

  return { route, help };
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

/**
 * Aviso de desenvolvimento quando `pt` e `en` divergem.
 *
 * O compilador garante que as rotas existem nos dois idiomas, mas não que os
 * passos do tour batam. Um passo escrito só em português apareceria em inglês
 * silenciosamente — é isso que este bloco pega.
 */
if (process.env.NODE_ENV === "development") {
  for (const route of HELP_ROUTES) {
    const pt = PAGE_HELP.pt[route];
    const en = PAGE_HELP.en[route];
    if (!pt || !en) continue;

    const ptIds = pt.tour.map((step) => step.id).join(",");
    const enIds = en.tour.map((step) => step.id).join(",");
    if (ptIds !== enIds) {
      console.warn(
        `[page-help] Os passos do tour de "${route}" divergem entre idiomas.\n  pt: ${ptIds}\n  en: ${enIds}`,
      );
    }

    const ptSections = pt.sections?.length ?? 0;
    const enSections = en.sections?.length ?? 0;
    if (ptSections !== enSections) {
      console.warn(
        `[page-help] "${route}" tem ${ptSections} seções em pt e ${enSections} em en.`,
      );
    }

    if (pt.panel !== en.panel) {
      console.warn(
        `[page-help] "${route}" usa painel "${pt.panel ?? "registry"}" em pt e "${en.panel ?? "registry"}" em en.`,
      );
    }
  }
}

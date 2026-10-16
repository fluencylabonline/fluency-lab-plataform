/**
 * Carregamento sob demanda do conteúdo da ajuda de página.
 *
 * O registry completo (`page-help.ts`) tem o texto dos quatro papéis nos dois
 * idiomas — ~370 KB que iam para toda página do hub. Aqui cada combinação
 * papel × idioma é um `import()` próprio, então o navegador baixa só o
 * conteúdo do papel de quem está logado, mais o compartilhado.
 *
 * O registry continua sendo a fonte da verdade dos tipos: falta de rota em
 * `pt` ou `en` ainda quebra o build por lá.
 */

import { defaultLocale, locales, type Locale } from "@/i18n/config";
import type { HelpRoute, PageHelp } from "./page-help.types";

export type HelpRole = "admin" | "manager" | "teacher" | "student";
export type HelpDictionary = Partial<Record<HelpRoute, PageHelp>>;

const ROLE_LOADERS: Record<Locale, Record<HelpRole, () => Promise<HelpDictionary>>> = {
  pt: {
    student: () => import("./content/student.pt").then((m) => m.STUDENT_HELP_PT),
    teacher: () => import("./content/teacher.pt").then((m) => m.TEACHER_HELP_PT),
    manager: () => import("./content/manager.pt").then((m) => m.MANAGER_HELP_PT),
    admin: () => import("./content/admin.pt").then((m) => m.ADMIN_HELP_PT),
  },
  en: {
    student: () => import("./content/student.en").then((m) => m.STUDENT_HELP_EN),
    teacher: () => import("./content/teacher.en").then((m) => m.TEACHER_HELP_EN),
    manager: () => import("./content/manager.en").then((m) => m.MANAGER_HELP_EN),
    admin: () => import("./content/admin.en").then((m) => m.ADMIN_HELP_EN),
  },
};

const SHARED_LOADERS: Record<Locale, () => Promise<HelpDictionary>> = {
  pt: () => import("./content/shared.pt").then((m) => m.SHARED_HELP_PT),
  en: () => import("./content/shared.en").then((m) => m.SHARED_HELP_EN),
};

/** Ajuda das rotas do papel + as compartilhadas, no idioma pedido. */
export async function loadPageHelp(role: HelpRole, locale: string): Promise<HelpDictionary> {
  // Em desenvolvimento, carregar o registry completo mantém os avisos de
  // divergência entre pt e en (ver o fim de page-help.ts).
  if (process.env.NODE_ENV === "development") {
    void import("./page-help");
  }

  const loc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  const [own, shared] = await Promise.all([ROLE_LOADERS[loc][role](), SHARED_LOADERS[loc]()]);
  return { ...own, ...shared };
}

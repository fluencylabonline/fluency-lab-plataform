/**
 * Modelo de dados da ajuda de página.
 *
 * O conteúdo é dado puro (sem JSX) para ser barato de editar, de revisar em
 * duas línguas lado a lado e de varrer por script. Quem renderiza é
 * `_components/PageHelpWizard.tsx` (o painel) e `components/ui/tour-overlay.tsx`
 * (o tour). Nenhum texto de conteúdo vive em `messages/*.json` — só os rótulos
 * de interface do próprio painel, no namespace `PageHelp`.
 */

/** Um passo do tour guiado. */
export interface TourStep {
  /**
   * Identificador estável do passo. Precisa ser o mesmo em `pt` e `en` — é por
   * ele que a asserção de paridade (dev-only) casa os dois idiomas.
   */
  id: string;
  /**
   * Valor do atributo `data-tour` do elemento a destacar.
   * Ausente = card centralizado, sem holofote (bom para abertura e fechamento).
   */
  target?: string;
  title: string;
  text: string;
  /** Para controles que existem em apenas um dos layouts. */
  only?: "desktop" | "mobile";
}

/** Um bloco do painel de ajuda. `body` como array vira lista de tópicos. */
export interface PageHelpSection {
  heading: string;
  body: string | string[];
}

interface PageHelpBase {
  title: string;
  /** Uma frase: o que esta página é. Aparece em destaque no topo do painel. */
  summary: string;
  tour: TourStep[];
  /**
   * `id` do artigo correspondente em `modules/docs/docs.content.*.ts`, quando
   * existir. Vira o link "Saber mais" → `/hub/{role}/docs#{id}`.
   */
  docsArticleId?: string;
}

/**
 * A ajuda completa de uma rota, em um idioma.
 *
 * `panel` diz de onde sai o painel que o (?) abre, e é uma união discriminada
 * de propósito: assim o compilador exige `sections` exatamente nas páginas em
 * que elas são renderizadas, e não deixa escrever texto morto nas outras.
 *
 * - `"registry"` — o padrão. O `PageHelpWizard` monta o painel a partir das
 *   `sections` daqui, uma seção por passo.
 * - `"wizard"` — a página já tinha um wizard de primeiro acesso e o mantém.
 *   O conteúdo do painel vive no componente do wizard; daqui sai só o `tour`.
 *   Essas páginas precisam chamar `useRegisterPageHelp` — sem isso o (?) abre
 *   um painel vazio.
 */
export type PageHelp =
  | (PageHelpBase & { panel?: "registry"; sections: PageHelpSection[] })
  | (PageHelpBase & { panel: "wizard"; sections?: never });

/* ─────────────────────────────────────────────────────────────
 * Rotas com ajuda, por papel.
 *
 * Toda página de `/hub` está listada aqui (exceto `/hub`, que é só um
 * redirecionador sem interface). Os `Record<RoleHelpRoute, PageHelp>` dos
 * arquivos de `content/` fazem o TypeScript exigir uma entrada por rota em
 * cada idioma — página nova sem ajuda quebra o build.
 * ───────────────────────────────────────────────────────────── */

export type StudentHelpRoute =
  | "/hub/student/profile"
  | "/hub/student/schedule"
  | "/hub/student/notebook"
  | "/hub/student/payments"
  | "/hub/student/contract"
  | "/hub/student/settings"
  | "/hub/student/docs"
  | "/hub/student/courses"
  | "/hub/student/courses/[id]"
  | "/hub/student/placement"
  | "/hub/student/placement/test"
  | "/hub/student/practice"
  | "/hub/student/practice/session"
  | "/hub/student/immersion"
  | "/hub/student/immersion/lyrics"
  | "/hub/student/immersion/word-ladder"
  | "/hub/student/immersion/wordle"
  | "/hub/student/recess/[slotId]";

export type TeacherHelpRoute =
  | "/hub/teacher/profile"
  | "/hub/teacher/schedule"
  | "/hub/teacher/students"
  | "/hub/teacher/students/[studentId]"
  | "/hub/teacher/students/[studentId]/profile"
  | "/hub/teacher/lessons"
  | "/hub/teacher/lessons/[lessonId]"
  | "/hub/teacher/my-courses"
  | "/hub/teacher/my-courses/[id]"
  | "/hub/teacher/recess"
  | "/hub/teacher/recess/new"
  | "/hub/teacher/recess/[id]"
  | "/hub/teacher/contract"
  | "/hub/teacher/settings"
  | "/hub/teacher/docs";

export type ManagerHelpRoute =
  | "/hub/manager/profile"
  | "/hub/manager/users"
  | "/hub/manager/users/[userId]"
  | "/hub/manager/students/onboarding"
  | "/hub/manager/students/onboarding/[profileId]"
  | "/hub/manager/students/onboarding/[profileId]/view"
  | "/hub/manager/tasks"
  | "/hub/manager/conversas"
  | "/hub/manager/learning"
  | "/hub/manager/learning/[id]"
  | "/hub/manager/learning/analytics"
  | "/hub/manager/learning/learning-items"
  | "/hub/manager/learning/lessons"
  | "/hub/manager/learning/lessons/[lessonId]"
  | "/hub/manager/learning/placement"
  | "/hub/manager/my-courses"
  | "/hub/manager/my-courses/[id]"
  | "/hub/manager/settings"
  | "/hub/manager/docs";

export type AdminHelpRoute =
  | "/hub/admin/profile"
  | "/hub/admin/dashboard"
  | "/hub/admin/users"
  | "/hub/admin/users/[userId]"
  | "/hub/admin/students/onboarding"
  | "/hub/admin/students/onboarding/[profileId]"
  | "/hub/admin/students/onboarding/[profileId]/view"
  | "/hub/admin/finances"
  | "/hub/admin/finances/forecast"
  | "/hub/admin/finances/plans"
  | "/hub/admin/contracts"
  | "/hub/admin/courses"
  | "/hub/admin/courses/[id]"
  | "/hub/admin/courses/[id]/lessons/[lessonId]"
  | "/hub/admin/my-courses"
  | "/hub/admin/my-courses/[id]"
  | "/hub/admin/tasks"
  | "/hub/admin/procedures"
  | "/hub/admin/procedures/[id]"
  | "/hub/admin/communication"
  | "/hub/admin/conversas"
  | "/hub/admin/settings"
  | "/hub/admin/docs"
  | "/hub/admin/docs/questions";

/** Rotas de `/hub` que não pertencem a um papel. */
export type SharedHelpRoute = "/hub/financial/receipt/[id]";

export type HelpRoute =
  | StudentHelpRoute
  | TeacherHelpRoute
  | ManagerHelpRoute
  | AdminHelpRoute
  | SharedHelpRoute;

/**
 * Mapa de conteúdo de um papel, em um idioma.
 *
 * Os arquivos de `content/` declaram `RoleHelpContent<XHelpRoute>` — sem
 * `Partial`. É isso que faz o compilador exigir uma entrada por rota em `pt` e
 * em `en`: rota nova na união sem texto escrito = erro de tipo.
 */
export type RoleHelpContent<K extends HelpRoute> = Record<K, PageHelp>;

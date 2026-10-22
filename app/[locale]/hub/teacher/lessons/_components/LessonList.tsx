"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { getLessonsPageAction } from "@/modules/curriculum/curriculum.actions";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { LessonCard } from "./LessonCard";
import { TemplateCard, type TemplateSummary } from "./TemplateCard";
import { EmptyResults } from "@/components/ui/empty";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useGridPageSize } from "@/hooks/common/use-grid-page-size";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";

type LessonsPage = { items: LessonSummary[]; total: number };

/** Colunas da grade por largura da janela (iguais às classes da grade abaixo) e linhas visíveis por página. */
const GRID_BREAKPOINTS = [[1280, 4], [1024, 3], [640, 2]] as const;
const GRID_ROWS = 2;
const INITIAL_PAGE_SIZE = 8;

interface FilterGroupProps {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

/** Chips de filtro sobre o fundo da cor do tema (contraste com a tela). */
function FilterGroup({ label, allLabel, options, selected, onSelect }: FilterGroupProps) {
  const chip = (active: boolean) =>
    cn(
      "h-8 rounded-md px-3 text-xs font-semibold transition-colors",
      active
        ? "bg-primary-foreground text-primary"
        : "text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground/70">{label}</span>
      <button type="button" className={chip(selected === null)} onClick={() => onSelect(null)}>
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={chip(selected === option.value)}
          aria-pressed={selected === option.value}
          onClick={() => onSelect(selected === option.value ? null : option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface LessonListProps {
  initialData: LessonsPage;
  languages: { id: string, name: string }[];
  templates: TemplateSummary[];
}

export function LessonList({ initialData, languages, templates }: LessonListProps) {
  const t = useTranslations("Lessons");
  const [view, setView] = useState<"lessons" | "templates">("lessons");
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const pageSize = useGridPageSize(GRID_BREAKPOINTS, GRID_ROWS);

  // A página volta para a 1 sempre que muda um filtro, a busca, a aba ou o tamanho da página.
  const filterKey = [view, search, selectedLanguage, selectedDifficulty, pageSize].join("|");
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: filterKey, page: next });

  const isInitialQuery = page === 1 && pageSize === INITIAL_PAGE_SIZE && !search && !selectedLanguage && !selectedDifficulty;

  const { data, isLoading } = useSWR<LessonsPage>(
    view === "lessons" ? ["teacher-lessons", page, pageSize, search, selectedLanguage, selectedDifficulty] : null,
    async ([, p, size, term, lang, diff]: [string, number, number, string, string | null, string | null]) => {
      const result = await getLessonsPageAction({
        search: term || undefined,
        limit: size,
        offset: (p - 1) * size,
        languageId: lang || undefined,
        difficulty: diff || undefined,
        status: "ready",
      });
      if (!result?.data) throw new Error(result?.serverError || "Failed to fetch");
      return result.data;
    },
    {
      fallbackData: isInitialQuery ? initialData : undefined,
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const lessons = data?.items ?? [];
  const lessonsTotal = data?.total ?? 0;

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return templates.filter(
      (template) =>
        (!selectedLanguage || template.languageId === selectedLanguage) &&
        (!term || template.name.toLowerCase().includes(term))
    );
  }, [templates, selectedLanguage, search]);
  const templatePage = filteredTemplates.slice((page - 1) * pageSize, page * pageSize);

  const total = view === "lessons" ? lessonsTotal : filteredTemplates.length;
  const difficulties = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const hasFilters = !!(selectedDifficulty || selectedLanguage);

  return (
    <div>
      <Header
        title={t("title") || "Biblioteca de Lições"}
        subtitle={t("subtitle") || "Explore e utilize lições pré-configuradas para suas aulas"}
        className="contents"
        onSearchChange={(val) => setSearch(val)}
      />

      <main className="container">
        {/* No desktop a página não rola: a grade ocupa o espaço que sobra e a paginação navega pelo resto. */}
        <div className="flex flex-col gap-4 lg:h-[calc(100dvh-9rem)]">
          {/* Alternância Lições | Templates e filtros, lado a lado, na cor do tema */}
          <div
            className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 rounded-md bg-primary p-3 text-primary-foreground shadow-sm"
            data-tour="teacher-lessons.filters"
          >
            <div className="inline-flex rounded-md bg-primary-foreground/15 p-1" role="tablist" data-tour="teacher-lessons.view">
              {(["lessons", "templates"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={view === option}
                  onClick={() => setView(option)}
                  className={cn(
                    "h-8 rounded px-4 text-xs font-semibold transition-colors",
                    view === option
                      ? "bg-primary-foreground text-primary"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
                  )}
                >
                  {option === "lessons" ? t("viewLessons") : t("viewTemplates")}
                </button>
              ))}
            </div>

            <div className="hidden h-6 w-px bg-primary-foreground/30 md:block" />

            {view === "lessons" && (
              <>
                <FilterGroup
                  label={t("levelLabel")}
                  allLabel={t("allLabel")}
                  options={difficulties.map((d) => ({ value: d, label: d }))}
                  selected={selectedDifficulty}
                  onSelect={setSelectedDifficulty}
                />
                <div className="hidden h-6 w-px bg-primary-foreground/30 md:block" />
              </>
            )}
            <FilterGroup
              label={t("languageLabel")}
              allLabel={t("allLabel")}
              options={languages.map((l) => ({ value: l.id, label: l.name }))}
              selected={selectedLanguage}
              onSelect={setSelectedLanguage}
            />

            <div className="flex items-center gap-3 md:ml-auto">
              <span className="text-xs font-semibold text-primary-foreground/80">
                {view === "lessons" ? t("resultsCount", { count: total }) : t("templatesCount", { count: total })}
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDifficulty(null);
                    setSelectedLanguage(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-foreground underline-offset-2 hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("clearFilters")}
                </button>
              )}
            </div>
          </div>

          {/* Grade (rola por dentro só se a janela for pequena demais para as linhas da página) */}
          <div className={cn("min-h-0 flex-1 lg:overflow-y-auto", isLoading && "opacity-60 transition-opacity")}>
            {view === "templates" ? (
              filteredTemplates.length === 0 ? (
                <div className="py-16">
                  <EmptyResults title={t("templatesEmptyTitle")} description={t("templatesEmptyDescription")} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-tour="teacher-lessons.templates">
                  {templatePage.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              )
            ) : lessons.length === 0 && !isLoading ? (
              <div className="py-16">
                <EmptyResults
                  title={t("emptyTitle") || "Nenhuma lição encontrada"}
                  description={t("emptyDescription") || "Tente ajustar seus filtros ou busca para encontrar o que procura."}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-tour="teacher-lessons.list">
                {lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </div>

          <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} className="shrink-0" />
        </div>
      </main>
    </div>
  );
}

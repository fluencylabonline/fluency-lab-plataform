"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { getLessonsPageAction } from "@/modules/curriculum/curriculum.actions";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { LessonCard } from "./LessonCard";
import { TemplateCard, type TemplateSummary } from "./TemplateCard";
import { EmptyResults } from "@/components/ui/empty";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useFillGrid } from "@/hooks/common/use-fill-grid";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

type LessonsPage = { items: LessonSummary[]; total: number };

/** Colunas da grade por largura da janela; as linhas vêm da altura disponível (ver useFillGrid). */
const GRID_BREAKPOINTS = [[1280, 4], [1024, 3], [640, 2]] as const;
const INITIAL_PAGE_SIZE = 8;

const ALL = "__all__";

interface FilterSelectProps {
  /** Rótulo curto mostrado no gatilho, ex.: "Nível". Sem rótulo, mostra só o valor. */
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
  tour?: string;
}

/** Select compacto sobre o fundo da cor do tema; o gatilho mostra "Rótulo: valor". */
function FilterSelect({ label, value, options, onChange, className, tour }: FilterSelectProps) {
  const current = options.find((option) => option.value === value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        data-tour={tour}
        className={cn(
          "h-9 w-auto shrink-0 gap-2 rounded-md border-0 bg-primary-foreground/15 px-3 text-xs font-semibold text-primary-foreground shadow-none hover:bg-primary-foreground/25 focus:ring-0 [&_svg]:text-primary-foreground/80 lg:h-8",
          className
        )}
      >
        <SelectValue>
          {label && <span className="font-bold uppercase tracking-wider text-primary-foreground/70">{label}: </span>}
          <span>{current?.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  const { ref: gridAreaRef, style: gridStyle, pageSize } = useFillGrid({ breakpoints: GRID_BREAKPOINTS, minCardHeight: 215, mobileRows: 6 });

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

      <main className="container pb-24 lg:pb-0">
        {/* No desktop a página não rola: a grade ocupa o espaço que sobra e a paginação navega pelo resto. */}
        <div className="flex flex-col gap-4 lg:h-[calc(100dvh-9rem)]">
          {/* Tipo, nível e idioma em selects numa linha com rolagem horizontal, na cor do tema */}
          <div
            className="flex shrink-0 items-center gap-2 rounded-md bg-primary p-2.5 text-primary-foreground shadow-sm lg:p-3"
            data-tour="teacher-lessons.filters"
          >
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              <FilterSelect
                tour="teacher-lessons.view"
                value={view}
                options={[
                  { value: "lessons", label: t("viewLessons") },
                  { value: "templates", label: t("viewTemplates") },
                ]}
                onChange={(next) => setView(next as "lessons" | "templates")}
              />
              {view === "lessons" && (
                <FilterSelect
                  label={t("levelLabel")}
                  value={selectedDifficulty ?? ALL}
                  options={[{ value: ALL, label: t("allLabel") }, ...difficulties.map((d) => ({ value: d, label: d }))]}
                  onChange={(next) => setSelectedDifficulty(next === ALL ? null : next)}
                />
              )}
              <FilterSelect
                label={t("languageLabel")}
                value={selectedLanguage ?? ALL}
                options={[{ value: ALL, label: t("allLabel") }, ...languages.map((l) => ({ value: l.id, label: l.name }))]}
                onChange={(next) => setSelectedLanguage(next === ALL ? null : next)}
              />
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDifficulty(null);
                    setSelectedLanguage(null);
                  }}
                  className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-1 text-xs font-semibold text-primary-foreground underline-offset-2 hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("clearFilters")}
                </button>
              )}
            </div>
            <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-primary-foreground/80 lg:text-xs">
              {view === "lessons" ? t("resultsCount", { count: total }) : t("templatesCount", { count: total })}
            </span>
          </div>

          {/* Grade (rola por dentro só se a janela for pequena demais para as linhas da página) */}
          <div ref={gridAreaRef} className={cn("min-h-0 flex-1 lg:overflow-hidden", isLoading && "opacity-60 transition-opacity")}>
            {view === "templates" ? (
              filteredTemplates.length === 0 ? (
                <div className="py-16">
                  <EmptyResults title={t("templatesEmptyTitle")} description={t("templatesEmptyDescription")} />
                </div>
              ) : (
                <div className="grid lg:h-full" style={gridStyle} data-tour="teacher-lessons.templates">
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
              <div className="grid lg:h-full" style={gridStyle} data-tour="teacher-lessons.list">
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

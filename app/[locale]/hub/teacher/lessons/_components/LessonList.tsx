"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import { getLessonsAction } from "@/modules/curriculum/curriculum.actions";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { LessonCard } from "./LessonCard";
import { EmptyResults } from "@/components/ui/empty";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "@shimmer-from-structure/react";
import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 20;

interface FilterGroupProps {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

function FilterGroup({ label, allLabel, options, selected, onSelect }: FilterGroupProps) {
  const chip = (active: boolean) =>
    cn(
      "h-8 rounded-md px-3 text-xs font-semibold transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-foreground/70 hover:bg-muted hover:text-foreground"
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
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
  initialData: LessonSummary[];
  languages: { id: string, name: string }[];
}

export function LessonList({ initialData, languages }: LessonListProps) {
  const t = useTranslations("Lessons");
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const { data, size, setSize, isValidating } = useSWRInfinite<LessonSummary[]>(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.length) return null;
      return ["lessons", pageIndex, search, selectedLanguage, selectedDifficulty, "ready"];
    },
    async ([, index, search, lang, diff]: [string, number, string, string | null, string | null]): Promise<LessonSummary[]> => {
      const result = await getLessonsAction({
        search,
        limit: PAGE_SIZE,
        offset: index * PAGE_SIZE,
        languageId: lang || undefined,
        difficulty: diff || undefined,
        status: "ready",
      });
      if (!result?.data) throw new Error(result?.serverError || "Failed to fetch");
      return result.data;
    },
    {
      fallbackData: [initialData],
      revalidateFirstPage: false,
      persistSize: true,
    }
  );

  const lessons = useMemo(() => {
    return data ? data.flat() : [];
  }, [data]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesLang = !selectedLanguage || lesson.languageId === selectedLanguage;
      const matchesDiff = !selectedDifficulty || lesson.difficulty === selectedDifficulty;
      return matchesLang && matchesDiff;
    });
  }, [lessons, selectedLanguage, selectedDifficulty]);

  const isLoadingMore = isValidating || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isReachingEnd) {
        setSize(size + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, isReachingEnd, setSize, size]);

  const difficulties = ["A1", "A2", "B1", "B2", "C1", "C2"];

  return (
    <div>
      <Header
        title={t("title") || "Biblioteca de Lições"}
        subtitle={t("subtitle") || "Explore e utilize lições pré-configuradas para suas aulas"}
        className="contents"
        onSearchChange={(val) => setSearch(val)}
      />

      <main className="container">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 rounded-md border border-border/60 p-3 md:flex-row md:items-center md:gap-6" data-tour="teacher-lessons.filters">
          <FilterGroup
            label={t("levelLabel")}
            allLabel={t("allLabel")}
            options={difficulties.map((d) => ({ value: d, label: d }))}
            selected={selectedDifficulty}
            onSelect={setSelectedDifficulty}
          />
          <div className="hidden h-6 w-px bg-border md:block" />
          <FilterGroup
            label={t("languageLabel")}
            allLabel={t("allLabel")}
            options={languages.map((l) => ({ value: l.id, label: l.name }))}
            selected={selectedLanguage}
            onSelect={setSelectedLanguage}
          />
          <div className="flex items-center gap-3 md:ml-auto">
            {/* Com rolagem infinita, o total só é exato depois da última página. */}
            {isReachingEnd && (
              <span className="text-xs font-semibold text-muted-foreground">
                {t("resultsCount", { count: filteredLessons.length })}
              </span>
            )}
            {(selectedDifficulty || selectedLanguage) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDifficulty(null);
                  setSelectedLanguage(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                {t("clearFilters")}
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <Shimmer
          loading={isValidating && lessons.length === 0}
          templateProps={{
            lessons: Array(8).fill({
              id: "1",
              title: "Loading Lesson...",
              difficulty: "A1",
              language: { name: "Language" },
              contentText: "This is a placeholder for the shimmer skeleton."
            })
          }}
        >
          {filteredLessons.length === 0 && !isValidating ? (
            <div className="py-20">
              <EmptyResults
                title={t("emptyTitle") || "Nenhuma lição encontrada"}
                description={t("emptyDescription") || "Tente ajustar seus filtros ou busca para encontrar o que procura."}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-tour="teacher-lessons.list">
              {filteredLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                />
              ))}
            </div>
          )}
        </Shimmer>

        {/* Infinite Scroll Trigger */}
        <div ref={lastElementRef} className="h-10 flex items-center justify-center pb-10 mt-10">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner className="w-4 h-4" />
              {t("loadingMore") || "Carregando mais lições..."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

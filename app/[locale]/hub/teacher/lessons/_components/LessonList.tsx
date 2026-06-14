"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import { getLessonsAction } from "@/modules/curriculum/curriculum.actions";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { LessonCard } from "./LessonCard";
import { EmptyResults } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Shimmer } from "@shimmer-from-structure/react";
import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 20;

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
        <div className="flex flex-wrap gap-2 items-center py-2 pb-6">
          <span className="text-xs font-bold uppercase text-muted-foreground mr-2">
            {t("filtersLabel") || "Filtros:"}
          </span>

          {/* Difficulty Filters */}
          {difficulties.map(diff => (
            <Badge
              key={diff}
              variant={selectedDifficulty === diff ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105 active:scale-95"
              onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
            >
              {diff}
            </Badge>
          ))}

          <div className="w-px h-4 bg-border mx-2 hidden sm:block" />

          {/* Language Filters */}
          {languages.map(lang => (
            <Badge
              key={lang.id}
              variant={selectedLanguage === lang.id ? "secondary" : "outline"}
              className="cursor-pointer transition-all hover:scale-105 active:scale-95"
              onClick={() => setSelectedLanguage(selectedLanguage === lang.id ? null : lang.id)}
            >
              {lang.name}
            </Badge>
          ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

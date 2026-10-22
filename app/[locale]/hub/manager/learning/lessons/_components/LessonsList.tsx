"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { Search, Filter, BookOpen } from "lucide-react";
import { LessonCard } from "./LessonCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia
} from "@/components/ui/empty";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useGridPageSize } from "@/hooks/common/use-grid-page-size";

/** Colunas da grade por largura da janela (md:2, lg:3) e linhas visíveis por página. */
const GRID_BREAKPOINTS = [[1024, 3], [768, 2]] as const;
const GRID_ROWS = 2;

interface LessonsListProps {
    initialLessons: LessonSummary[];
    languages: { id: string; name: string }[];
    searchQuery: string;
}

export function LessonsList({ initialLessons, languages, searchQuery }: LessonsListProps) {
    const t = useTranslations("Learning");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [languageFilter, setLanguageFilter] = useState<string>("all");
    const [recessFilter, setRecessFilter] = useState<string>("all");

    const filteredLessons = useMemo(() => {
        return initialLessons.filter((lesson) => {
            const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || lesson.status === statusFilter;
            const matchesLanguage = languageFilter === "all" || lesson.languageId === languageFilter;
            const matchesRecess = 
                recessFilter === "all" || 
                (recessFilter === "recess" && lesson.isRecessActivity) || 
                (recessFilter === "regular" && !lesson.isRecessActivity);
            return matchesSearch && matchesStatus && matchesLanguage && matchesRecess;
        });
    }, [initialLessons, searchQuery, statusFilter, languageFilter, recessFilter]);

    // Paginação: a página volta para a 1 quando muda um filtro, a busca ou o tamanho da página.
    const pageSize = useGridPageSize(GRID_BREAKPOINTS, GRID_ROWS, 1, 6);
    const filterKey = [searchQuery, statusFilter, languageFilter, recessFilter, pageSize].join("|");
    const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
    const page = pageState.key === filterKey ? pageState.page : 1;
    const pageLessons = filteredLessons.slice((page - 1) * pageSize, page * pageSize);

    const statuses = [
        "draft",
        "analyzing",
        "processing_items",
        "reviewing",
        "reviewing_quiz",
        "ready",
        "error"
    ];

    if (initialLessons.length === 0) {
        return (
            <div className="py-20">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <BookOpen className="size-6 text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>{t("empty_lessons_title") || "No lessons found"}</EmptyTitle>
                        <EmptyDescription>
                            {t("empty_lessons_desc") || "Start by creating your first lesson to build the curriculum."}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </div>
        );
    }

    return (
        // No desktop a página não rola: a grade ocupa o espaço que sobra e a paginação navega pelo resto.
        <div className="flex flex-col gap-4 lg:h-[calc(100dvh-9.5rem)]">
            {/* Toolbar */}
            <div className="flex shrink-0 flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                    <div className="flex w-full items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md sm:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t("filter_status") || "Status"}:</span>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 shadow-none text-sm font-bold">
                                <SelectValue placeholder={t("all_statuses") || "All Statuses"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_statuses") || "All Statuses"}</SelectItem>
                                {statuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {t(`status_${status}`) || status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-full items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md sm:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t("filter_language") || "Language"}:</span>
                        <Select value={languageFilter} onValueChange={setLanguageFilter}>
                            <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 shadow-none text-sm font-bold">
                                <SelectValue placeholder={t("all_languages") || "All Languages"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_languages") || "All Languages"}</SelectItem>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.id} value={lang.id}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-full items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md sm:w-auto">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{t("filter_type") || "Tipo"}:</span>
                        <Select value={recessFilter} onValueChange={setRecessFilter}>
                            <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 shadow-none text-sm font-bold">
                                <SelectValue placeholder={t("all_types") || "Todos os Tipos"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_types") || "Todos os Tipos"}</SelectItem>
                                <SelectItem value="regular">{t("regular_lessons") || "Lições Regulares"}</SelectItem>
                                <SelectItem value="recess">{t("recess_lessons") || "Lições de Recesso (Fallback)"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="self-start text-xs font-medium text-muted-foreground uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {filteredLessons.length} {t("lessons") || "Lessons"}
                </div>
            </div>

            <div className="min-h-0 flex-1 lg:overflow-y-auto">
            {filteredLessons.length === 0 ? (
                <div className="py-20">
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Search className="size-6 text-primary" />
                            </EmptyMedia>
                            <EmptyTitle>{t("no_results") || "No results found"}</EmptyTitle>
                            <EmptyDescription>
                                {t("try_different_term") || "Try adjusting your filters or search term."}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pageLessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                </div>
            )}
            </div>

            <PaginationBar
                page={page}
                pageSize={pageSize}
                total={filteredLessons.length}
                onPageChange={(next) => setPageState({ key: filterKey, page: next })}
                className="shrink-0"
            />
        </div>
    );
}

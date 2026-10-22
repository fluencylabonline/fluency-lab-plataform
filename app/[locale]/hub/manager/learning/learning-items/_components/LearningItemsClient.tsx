"use client";

import { useState } from "react";
import useSWR from "swr";
import { getLearningItemsPageAction } from "@/modules/curriculum/curriculum.actions";
import { LanguageWithLessons, LearningItem, CEFRLevel } from "@/modules/curriculum/curriculum.types";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useFillGrid } from "@/hooks/common/use-fill-grid";
import { LearningItemsFilter } from "./LearningItemsFilter";
import { LearningItemsList } from "./LearningItemsList";

interface LearningItemsClientProps {
    initialLanguages: LanguageWithLessons[];
}

export type FilterState = {
    languageId: string;
    type: "VOCABULARY" | "STRUCTURE" | "ALL";
    level: string;
    search: string;
};

type ItemsPage = { items: LearningItem[]; total: number };

/** Colunas por largura da janela; as linhas vêm da altura disponível. */
const GRID_BREAKPOINTS = [[1280, 4], [1024, 3], [640, 2]] as const;

export function LearningItemsClient({ initialLanguages }: LearningItemsClientProps) {
    const [filters, setFilters] = useState<FilterState>({
        languageId: initialLanguages[0]?.id || "",
        type: "ALL",
        level: "ALL",
        search: "",
    });
    const { ref: gridAreaRef, style: gridStyle, pageSize } = useFillGrid({ breakpoints: GRID_BREAKPOINTS, minCardHeight: 235, mobileRows: 4 });

    // A página volta para a 1 quando muda um filtro, a busca ou o tamanho da página.
    const filterKey = [filters.languageId, filters.type, filters.level, filters.search, pageSize].join("|");
    const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
    const page = pageState.key === filterKey ? pageState.page : 1;

    const { data, error, isLoading, mutate } = useSWR<ItemsPage>(
        ["learning-items", page, pageSize, filters.languageId, filters.type, filters.level, filters.search],
        async () => {
            const result = await getLearningItemsPageAction({
                languageId: filters.languageId === "ALL" ? undefined : filters.languageId,
                type: filters.type === "ALL" ? undefined : filters.type,
                level: filters.level === "ALL" ? undefined : (filters.level as CEFRLevel),
                search: filters.search || undefined,
                limit: pageSize,
                offset: (page - 1) * pageSize,
            });
            if (!result?.data) throw new Error(result?.serverError || "Failed to fetch");
            return result.data as unknown as ItemsPage;
        },
        { keepPreviousData: true, revalidateOnFocus: false }
    );

    const items = data?.items ?? [];
    const total = data?.total ?? 0;

    return (
        // No desktop a página não rola: a grade ocupa o espaço que sobra e a paginação navega pelo resto.
        <div className="flex flex-col gap-4 lg:h-[calc(100dvh-9rem)]">
            <LearningItemsFilter languages={initialLanguages} filters={filters} setFilters={setFilters} total={total} />

            <div ref={gridAreaRef} className="min-h-0 flex-1 lg:overflow-hidden">
                {error ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-md border border-destructive/10 bg-destructive/5 text-destructive">
                        <p className="font-bold">Erro ao carregar os itens</p>
                    </div>
                ) : (
                    <LearningItemsList items={items} isLoading={isLoading} gridStyle={gridStyle} onEnriched={() => mutate()} />
                )}
            </div>

            <PaginationBar
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(next) => setPageState({ key: filterKey, page: next })}
                className="shrink-0"
            />
        </div>
    );
}

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

interface LessonsListProps {
    initialLessons: LessonSummary[];
    languages: { id: string; name: string }[];
    searchQuery: string;
}

export function LessonsList({ initialLessons, languages, searchQuery }: LessonsListProps) {
    const t = useTranslations("Learning");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [languageFilter, setLanguageFilter] = useState<string>("all");

    const filteredLessons = useMemo(() => {
        return initialLessons.filter((lesson) => {
            const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || lesson.status === statusFilter;
            const matchesLanguage = languageFilter === "all" || lesson.languageId === languageFilter;
            return matchesSearch && matchesStatus && matchesLanguage;
        });
    }, [initialLessons, searchQuery, statusFilter, languageFilter]);

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
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md">
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

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md">
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
                </div>

                <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {filteredLessons.length} {t("lessons") || "Lessons"}
                </div>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                </div>
            )}
        </div>
    );
}

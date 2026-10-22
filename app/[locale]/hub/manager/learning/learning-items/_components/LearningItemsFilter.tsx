"use client";

import { LanguageWithLessons } from "@/modules/curriculum/curriculum.types";
import { FilterState } from "./LearningItemsClient";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { Languages, GraduationCap, Shapes, Search } from "lucide-react";

interface LearningItemsFilterProps {
    languages: LanguageWithLessons[];
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    total: number;
}

/** Barra de busca e filtros na cor do tema, para destacar do resto da tela. */
const triggerClass =
    "h-10 w-full min-w-0 rounded-md lg:min-w-[150px] border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground shadow-none hover:bg-primary-foreground/20 [&_svg]:text-primary-foreground";

export function LearningItemsFilter({ languages, filters, setFilters, total }: LearningItemsFilterProps) {
    const t = useTranslations("Learning");
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

    const label = (icon: React.ReactNode, text: string) => (
        <span className="mb-1 flex items-center gap-1 truncate text-[10px] font-bold uppercase tracking-wider text-primary-foreground/80">
            {icon}
            {text}
        </span>
    );

    return (
        <div
            className="grid shrink-0 grid-cols-3 gap-2 rounded-md bg-primary p-2.5 text-primary-foreground shadow-sm lg:flex lg:flex-wrap lg:items-end lg:gap-x-4 lg:gap-y-3 lg:p-3"
            data-tour="manager-items.filters"
        >
            <div className="col-span-3 lg:min-w-[240px] lg:flex-1">
                {label(<Search className="h-3 w-3" />, t("search_content") || "Search Content")}
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/70" />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        placeholder={t("search_items_placeholder") || "Search by word, phrase or translation..."}
                        className="h-10 w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/15 pl-9 pr-3 text-sm text-primary-foreground outline-none transition-colors placeholder:text-primary-foreground/70 focus:border-primary-foreground/60 focus:bg-primary-foreground/20"
                    />
                </div>
            </div>

            <div className="min-w-0">
                {label(<Languages className="h-3 w-3" />, t("language") || "Language")}
                <Select value={filters.languageId} onValueChange={(val) => setFilters({ ...filters, languageId: val })}>
                    <SelectTrigger className={triggerClass}>
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t("all_languages") || "All Languages"}</SelectItem>
                        {languages.map((lang) => (
                            <SelectItem key={lang.id} value={lang.id}>
                                {lang.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="min-w-0">
                {label(<GraduationCap className="h-3 w-3" />, t("level") || "Level")}
                <Select value={filters.level} onValueChange={(val) => setFilters({ ...filters, level: val })}>
                    <SelectTrigger className={triggerClass}>
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t("all_levels") || "All Levels"}</SelectItem>
                        {levels.map((lvl) => (
                            <SelectItem key={lvl} value={lvl}>
                                {lvl}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="min-w-0">
                {label(<Shapes className="h-3 w-3" />, t("type") || "Type")}
                <Select value={filters.type} onValueChange={(val: FilterState["type"]) => setFilters({ ...filters, type: val })}>
                    <SelectTrigger className={triggerClass}>
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t("all_types") || "All Types"}</SelectItem>
                        <SelectItem value="VOCABULARY">{t("vocabulary") || "Vocabulary"}</SelectItem>
                        <SelectItem value="STRUCTURE">{t("structure") || "Structure"}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <span className="col-span-3 text-center text-[11px] font-semibold text-primary-foreground/80 lg:ml-auto lg:self-center lg:text-xs">
                {t("showing_items_count", { count: total })}
            </span>
        </div>
    );
}

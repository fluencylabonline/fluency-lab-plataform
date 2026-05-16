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
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Languages, GraduationCap, Shapes, Search } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";

interface LearningItemsFilterProps {
    languages: LanguageWithLessons[];
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
}

export function LearningItemsFilter({ languages, filters, setFilters }: LearningItemsFilterProps) {
    const t = useTranslations("Learning");

    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-2">
                    <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-black ml-2 flex items-center gap-2">
                        <Search className="w-3 h-3" />
                        {t("search_content") || "Search Content"}
                    </Label>
                    <SearchBar 
                        placeholder={t("search_items_placeholder") || "Search by word, phrase or translation..."}
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="h-12 bg-card/50 border-border/40 focus-within:border-primary/40 rounded-2xl shadow-sm transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                    {/* Language */}
                    <div className="space-y-2 min-w-[180px]">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-black ml-2 flex items-center gap-2">
                            <Languages className="w-3 h-3" />
                            {t("language") || "Language"}
                        </Label>
                        <Select
                            value={filters.languageId}
                            onValueChange={(val) => setFilters({ ...filters, languageId: val })}
                        >
                            <SelectTrigger className="h-12 bg-card/50 border-border/40 rounded-2xl shadow-sm">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                    <SelectItem value="ALL" className="rounded-md">
                                        {t("all_languages") || "All Languages"}
                                    </SelectItem>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang.id} value={lang.id} className="rounded-md">
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Level */}
                    <div className="space-y-2 min-w-[140px]">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-black ml-2 flex items-center gap-2">
                            <GraduationCap className="w-3 h-3" />
                            {t("level") || "Level"}
                        </Label>
                        <Select
                            value={filters.level}
                            onValueChange={(val) => setFilters({ ...filters, level: val })}
                        >
                            <SelectTrigger className="h-12 bg-card/50 border-border/40 rounded-2xl shadow-sm">
                                <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                <SelectItem value="ALL" className="rounded-md">{t("all_levels") || "All Levels"}</SelectItem>
                                {levels.map((lvl) => (
                                    <SelectItem key={lvl} value={lvl} className="rounded-md">
                                        {lvl}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type */}
                    <div className="space-y-2 min-w-[140px]">
                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-black ml-2 flex items-center gap-2">
                            <Shapes className="w-3 h-3" />
                            {t("type") || "Type"}
                        </Label>
                        <Select
                            value={filters.type}
                            onValueChange={(val: FilterState["type"]) => setFilters({ ...filters, type: val })}
                        >
                            <SelectTrigger className="h-12 bg-card/50 border-border/40 rounded-2xl shadow-sm">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                <SelectItem value="ALL" className="rounded-md">{t("all_types") || "All Types"}</SelectItem>
                                <SelectItem value="VOCABULARY" className="rounded-md">{t("vocabulary") || "Vocabulary"}</SelectItem>
                                <SelectItem value="STRUCTURE" className="rounded-md">{t("structure") || "Structure"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { getLearningItemsAction } from "@/modules/curriculum/curriculum.actions";
import { SearchBar } from "@/components/ui/search-bar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { LearningItem, CEFRLevel, Language, LearningItemMetadata } from "@/modules/curriculum/curriculum.types";
import { Languages, Layers, GraduationCap, Loader2, BookOpen, Hash, Sparkles } from "lucide-react";
import { useDebounce } from "@/hooks/common/use-debounce";
import { Shimmer } from "@shimmer-from-structure/react";
import { cn } from "@/lib/utils";

interface ItemsListProps {
    initialData: LearningItem[];
    languages: Language[];
}

const DIFFICULTY_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const MOCK_ITEMS: Partial<LearningItem>[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `mock-${i}`,
    lemma: "Loading item...",
    type: i % 2 === 0 ? "VOCABULARY" : "STRUCTURE",
    metadata: { 
        level: "A1",
        type: "noun",
        phonetic: "...",
        is_visual: false,
        key_image_words: "",
        meanings: [],
        forms: { base: "" },
        examples: [],
        structure_type: "Structure",
        explanation: "Loading...",
    } as LearningItemMetadata,
    translation: "Loading translation..."
}));

const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
        A1: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        A2: "bg-emerald-600/10 text-emerald-700 border-emerald-600/20",
        B1: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        B2: "bg-amber-600/10 text-amber-700 border-amber-600/20",
        C1: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        C2: "bg-rose-600/10 text-rose-700 border-rose-600/20",
    };
    return colors[level] || "bg-muted text-muted-foreground border-transparent";
};

export function ItemsList({ initialData, languages }: ItemsListProps) {
    const t = useTranslations("Learning");
    const [search, setSearch] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
    const [selectedLevel, setSelectedLevel] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all");
    
    const debouncedSearch = useDebounce(search, 300);

    const { data: items = [], isLoading, error } = useSWR(
        ["learning-items", selectedLanguage, selectedLevel, selectedType, debouncedSearch],
        async () => {
            const result = await getLearningItemsAction({
                languageId: selectedLanguage === "all" ? undefined : selectedLanguage,
                level: selectedLevel === "all" ? undefined : selectedLevel as CEFRLevel,
                type: selectedType === "all" ? undefined : selectedType as "VOCABULARY" | "STRUCTURE",
                search: debouncedSearch,
                limit: 100,
            });
            if (result?.data) return result.data as LearningItem[];
            return [];
        },
        { 
            fallbackData: initialData, 
            revalidateOnFocus: false,
            keepPreviousData: true
        }
    );

    const filterTypes = [
        { id: "all", label: t("all_items") || "All Items", icon: Sparkles },
        { id: "VOCABULARY", label: t("vocabulary") || "Vocabulary", icon: BookOpen },
        { id: "STRUCTURE", label: t("structure") || "Structure", icon: Hash }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Search and Filters */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1 w-full group">
                        <SearchBar
                            placeholder={t("search_items_placeholder") || "Search by word or phrase..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-card h-14 shadow-xl shadow-primary/5 border-border/40 focus-within:border-primary/50 transition-all rounded-2xl"
                        />
                    </div>
                    
                    <div className="w-full md:w-[240px]">
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                            <SelectTrigger className="h-14 bg-card border-border/40 rounded-2xl shadow-xl shadow-primary/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Languages className="w-4 h-4 text-primary" />
                                    </div>
                                    <SelectValue placeholder={t("all_languages") || "All Languages"} />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
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

                <div className="glass-morphism p-6 rounded-4xl border border-border/40 shadow-2xl shadow-primary/5 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                {t("difficulty") || "Difficulty"}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => setSelectedLevel("all")}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                    selectedLevel === "all" 
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                                        : "bg-background hover:bg-muted border-border/50 text-muted-foreground hover:scale-105"
                                )}
                            >
                                {t("all_levels") || "All Levels"}
                            </button>
                            {DIFFICULTY_LEVELS.map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setSelectedLevel(level)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        selectedLevel === level 
                                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                                            : "bg-background hover:bg-muted border-border/50 text-muted-foreground hover:scale-105"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-linear-to-r from-transparent via-border/40 to-transparent" />

                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Layers className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                {t("content_type") || "Content Type"}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {filterTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                        selectedType === type.id 
                                            ? "bg-secondary text-secondary-foreground border-secondary shadow-lg shadow-secondary/10 scale-105" 
                                            : "bg-background hover:bg-muted border-border/50 text-muted-foreground hover:scale-105"
                                    )}
                                >
                                    <type.icon className="w-3.5 h-3.5" />
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-primary/20 animate-ping absolute inset-0" />
                            <div className="w-3 h-3 rounded-full bg-primary relative" />
                        </div>
                        <span className="text-sm font-bold text-muted-foreground/80 tracking-tight">
                            {t("showing_items", { count: items.length }) || `Showing ${items.length} curated items`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <Shimmer loading={isLoading && items.length === 0} templateProps={{ items: MOCK_ITEMS }}>
                {items.length === 0 ? (
                    <div className="py-32 bg-card/50 rounded-[2.5rem] border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                        <Empty 
                            title={t("empty_items_title") || "No items discovered yet"} 
                            // description={t("empty_items_desc") || "Try refining your search or filters to explore the platform's curriculum."}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <div key={item.id} className="group relative p-6 bg-card rounded-4xl border border-border/40 hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/10 flex flex-col gap-5 overflow-hidden hover:-translate-y-1">
                                {/* Glossy Overlay */}
                                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {/* Decorative type icon in background */}
                                <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:rotate-12 duration-500">
                                    {item.type === "VOCABULARY" ? (
                                        <BookOpen className="w-32 h-32" />
                                    ) : (
                                        <Layers className="w-32 h-32" />
                                    )}
                                </div>

                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-7 h-7 rounded-xl flex items-center justify-center shadow-sm",
                                                item.type === "VOCABULARY" 
                                                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" 
                                                    : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                            )}>
                                                {item.type === "VOCABULARY" ? <BookOpen className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                                                {item.type}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "rounded-lg font-black text-[11px] px-2.5 py-0.5 border-2 transition-colors",
                                            getLevelColor(item.metadata?.level || "N/A")
                                        )}
                                    >
                                        {item.metadata?.level || "N/A"}
                                    </Badge>
                                </div>

                                <div className="relative z-10 min-h-12">
                                    <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors tracking-tight">
                                        {item.lemma}
                                    </h3>
                                </div>

                                {item.translation && (
                                    <div className="bg-muted/40 p-4 rounded-2xl border border-border/20 relative z-10 group-hover:bg-muted/60 transition-colors">
                                        <p className="text-sm font-semibold text-muted-foreground leading-relaxed italic">
                                            {item.translation}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/30 relative z-10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <Languages className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground/90">
                                            {item.language?.name || "Global"}
                                        </span>
                                    </div>
                                    
                                    <div className="px-2 py-1 bg-muted/30 rounded-md">
                                        <span className="text-[9px] font-black font-mono text-muted-foreground/40 uppercase tracking-tighter">
                                            #{item.id.split('_').pop()?.substring(0, 8)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Shimmer>

            {error && (
                <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3 animate-shake">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                        <p className="font-black uppercase tracking-wider text-[10px]">{t("sync_error") || "Sync Error"}</p>
                        <p className="opacity-80">{t("sync_error_desc") || "Unable to synchronize with the learning items repository."}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

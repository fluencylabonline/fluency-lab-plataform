"use client";

import useSWR from "swr";
import { getLearningItemsAction } from "@/modules/curriculum/curriculum.actions";
import { FilterState } from "./LearningItemsClient";
import { LearningItem, VocabMetadata, StructureMetadata, CEFRLevel, LearningItemMetadata } from "@/modules/curriculum/curriculum.types";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Puzzle, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/ui/empty";
import { Shimmer } from "@shimmer-from-structure/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LearningItemDetailsVault } from "./LearningItemDetailsVault";

interface LearningItemsListProps {
    filters: FilterState;
}

const MOCK_ITEMS: Partial<LearningItem>[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `mock-${i}`,
    lemma: "Loading...",
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

export function LearningItemsList({ filters }: LearningItemsListProps) {
    const t = useTranslations("Learning");
    const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null);

    const { data, error, isLoading } = useSWR(
        ["learning-items", filters],
        async () => {
            const result = await getLearningItemsAction({
                languageId: filters.languageId === "ALL" ? undefined : filters.languageId,
                type: filters.type === "ALL" ? undefined : filters.type,
                level: filters.level === "ALL" ? undefined : filters.level as CEFRLevel,
                search: filters.search || undefined,
                limit: 100,
            });
            return result?.data as LearningItem[] || [];
        },
        { keepPreviousData: true }
    );

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-destructive bg-destructive/5 rounded-3xl border border-destructive/10">
                <p className="font-bold">{t("error_loading_items")}</p>
                <p className="text-sm opacity-80">{t("error_loading_items_desc")}</p>
            </div>
        );
    }

    const items = data || [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-primary/20 animate-ping absolute inset-0" />
                        <div className="w-3 h-3 rounded-full bg-primary relative" />
                    </div>
                    <span className="text-sm font-bold text-muted-foreground/80 tracking-tight">
                        {t("showing_items_count", { count: items.length })}
                    </span>
                </div>
            </div>

            <Shimmer loading={isLoading && items.length === 0} templateProps={{ items: MOCK_ITEMS }}>
                {items.length === 0 ? (
                    <div className="py-32 bg-card/30 rounded-[2.5rem] border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                        <Empty
                            // icon={<SearchX className="w-12 h-12 text-muted-foreground/40" />}
                            title={t("no_items_found")}
                            // description={t("no_items_found_desc") || "Try adjusting your filters or search term to explore the curriculum."}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item, index) => (
                            <ItemCard 
                                key={item.id} 
                                item={item} 
                                index={index} 
                                onClick={() => setSelectedItem(item)}
                            />
                        ))}
                    </div>
                )}
            </Shimmer>

            <LearningItemDetailsVault 
                item={selectedItem} 
                onOpenChange={(open) => !open && setSelectedItem(null)} 
            />
        </div>
    );
}

interface ItemCardProps {
    item: LearningItem;
    index: number;
    onClick: () => void;
}

function ItemCard({ item, index, onClick }: ItemCardProps) {
    const t = useTranslations("Learning");
    const isVocab = item.type === "VOCABULARY";
    const vocabMeta = isVocab ? item.metadata as VocabMetadata : null;
    const structureMeta = !isVocab ? item.metadata as StructureMetadata : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (index % 12) * 0.05 }}
            onClick={onClick}
            className="group relative p-6 bg-card rounded-4xl border border-border/40 hover:border-primary/40 transition-all hover:shadow-2xl hover:shadow-primary/10 flex flex-col gap-5 overflow-hidden hover:-translate-y-1 cursor-pointer"
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Decorative type icon in background */}
            <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-all group-hover:rotate-12 duration-500">
                {isVocab ? (
                    <BookOpen className="w-32 h-32" />
                ) : (
                    <Puzzle className="w-32 h-32" />
                )}
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-7 h-7 rounded-xl flex items-center justify-center shadow-sm",
                            isVocab 
                                ? "bg-primary/10 text-primary border border-primary/20" 
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        )}>
                            {isVocab ? <BookOpen className="w-4 h-4" /> : <Puzzle className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                            {isVocab ? t("vocabulary") : t("structure")}
                        </span>
                    </div>
                </div>
                <Badge 
                    variant="outline" 
                    className={cn(
                        "rounded-lg font-black text-[11px] px-2.5 py-0.5 border-2 transition-colors",
                        getLevelColor(item.metadata.level)
                    )}
                >
                    {item.metadata.level}
                </Badge>
            </div>

            <div className="relative z-10 min-h-10">
                <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors tracking-tight line-clamp-2">
                    {item.lemma}
                </h3>
            </div>

            <div className="flex-1 space-y-3 relative z-10">
                {item.translation && (
                    <div className="bg-muted/40 p-3 rounded-xl border border-border/20 group-hover:bg-muted/60 transition-colors">
                        <p className="text-xs font-semibold text-muted-foreground italic line-clamp-2">
                            {item.translation}
                        </p>
                    </div>
                )}
                
                {isVocab ? (
                    vocabMeta?.meanings?.[0]?.definition && (
                        <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                            {vocabMeta.meanings[0].definition}
                        </p>
                    )
                ) : (
                    structureMeta?.explanation && (
                        <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                            {structureMeta.explanation}
                        </p>
                    )
                )}
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/30 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Languages className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/90">
                        {item.languageId ? t("course_item") : t("global_item")}
                    </span>
                </div>
                
                <button className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    {t("details")} →
                </button>
            </div>
        </motion.div>
    );
}

"use client";

import { enrichSingleItemAction } from "@/modules/curriculum/curriculum.actions";
import { LearningItem, VocabMetadata, StructureMetadata } from "@/modules/curriculum/curriculum.types";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Puzzle, Languages, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/toaster";
import { Empty } from "@/components/ui/empty";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import { LearningItemDetailsVault } from "./LearningItemDetailsVault";

interface LearningItemsListProps {
    items: LearningItem[];
    isLoading: boolean;
    /** Estilo da grade (colunas e linhas) calculado por useFillGrid. */
    gridStyle: CSSProperties;
    onEnriched: () => void;
}

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

export function LearningItemsList({ items, isLoading, gridStyle, onEnriched }: LearningItemsListProps) {
    const t = useTranslations("Learning");
    const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null);

    return (
        <div className={cn("h-full", isLoading && "opacity-60 transition-opacity")} data-tour="manager-items.list">
            {items.length === 0 && !isLoading ? (
                <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-border/40 bg-card/30 text-center">
                    <Empty title={t("no_items_found")} />
                </div>
            ) : (
                <div className="grid lg:h-full" style={gridStyle}>
                    {items.map((item, index) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            onClick={() => setSelectedItem(item)}
                            onEnriched={onEnriched}
                        />
                    ))}
                </div>
            )}

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
    onEnriched: () => void;
}

function ItemCard({ item, index, onClick, onEnriched }: ItemCardProps) {
    const t = useTranslations("Learning");
    const [isEnriching, setIsEnriching] = useState(false);
    const isVocab = item.type === "VOCABULARY";
    const vocabMeta = isVocab ? item.metadata as VocabMetadata : null;
    const structureMeta = !isVocab ? item.metadata as StructureMetadata : null;

    const isEnriched = isVocab
        ? (vocabMeta?.meanings && vocabMeta.meanings.length > 0)
        : (structureMeta?.explanation && structureMeta.examples && structureMeta.examples.length > 0);

    const handleEnrich = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isEnriching) return;
        setIsEnriching(true);
        try {
            const res = await enrichSingleItemAction({ itemId: item.id });
            if (res?.data?.success) {
                notify.success("Item enriquecido com sucesso!");
                onEnriched();
            } else {
                throw new Error("Failed to enrich");
            }
        } catch (error) {
            console.error("Enrich error:", error);
            notify.error("Erro ao enriquecer item. Tente novamente.");
        } finally {
            setIsEnriching(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (index % 12) * 0.05 }}
            onClick={onClick}
            className="group relative h-full min-h-0 p-5 bg-card rounded-md border border-border/40 hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/10 flex flex-col gap-3 overflow-hidden cursor-pointer"
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
                            "w-7 h-7 rounded-md flex items-center justify-center shadow-sm",
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

            <div className="relative z-10">
                <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors tracking-tight line-clamp-2">
                    {item.lemma}
                </h3>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-hidden relative z-10">
                {item.translation && (
                    <div className="bg-muted/40 p-3 rounded-md border border-border/20 group-hover:bg-muted/60 transition-colors">
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

            <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/30 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Languages className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/90">
                        {item.languageId ? t("course_item") : t("global_item")}
                    </span>
                </div>
                
                {!isEnriched ? (
                    <button 
                        onClick={handleEnrich}
                        disabled={isEnriching}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center gap-1 active:scale-95",
                            isEnriching && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isEnriching ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Enriquecendo...
                            </>
                        ) : (
                            <>
                                <Zap className="w-3.5 h-3.5" />
                                Enriquecer
                            </>
                        )}
                    </button>
                ) : (
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        {t("details")} →
                    </button>
                )}
            </div>
        </motion.div>
    );
}

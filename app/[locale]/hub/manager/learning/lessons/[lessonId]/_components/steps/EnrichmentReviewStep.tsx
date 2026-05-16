"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";
import {
    BookOpen,
    Puzzle,
    Zap,
    Loader2,
    AlertCircle,
    ChevronRight,
    Star,
    StarOff,
    Trash2,
} from "lucide-react";
import {
    deleteLessonItemAction,
    enrichLinkedItemsAction,
    updateItemsPriorityAction,
} from "@/modules/curriculum/curriculum.actions";
import { cn } from "@/lib/utils";
import { LearningItem, LessonWithDetails, StructureMetadata, VocabMetadata } from "@/modules/curriculum/curriculum.types";

// No longer needed, using LearningItem from curriculum.types.ts

interface EnrichmentReviewStepProps {
    lessonId: string;
    onComplete: () => void;
    // Items already linked to lesson (populated after enrichment)
    initialItems?: LessonWithDetails["items"];
    status: string;
}

type EnrichStatus = "idle" | "enriching" | "reviewing" | "saving" | "error";

export function EnrichmentReviewStep({ lessonId, onComplete, initialItems, status: lessonStatus }: EnrichmentReviewStepProps) {
    const t = useTranslations("Learning");

    // If we already have enriched items from the DB, skip enrichment
    const hasItems = initialItems && initialItems.length > 0;

    const [status, setStatus] = useState<EnrichStatus>(hasItems ? "reviewing" : "idle");
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [items, setItems] = useState<LearningItem[]>(
        initialItems?.map(li => li.item) ?? []
    );
    // Track priority per item id. Default = "CORE"
    const [priorities, setPriorities] = useState<Record<string, "CORE" | "SECONDARY">>(() => {
        const init: Record<string, "CORE" | "SECONDARY"> = {};
        (initialItems ?? []).forEach(li => {
            init[li.item.id] = li.priority as "CORE" | "SECONDARY";
        });
        return init;
    });

    const handleRemove = async (itemId: string) => {
        const res = await deleteLessonItemAction({ lessonId, itemId });
        if (res?.data?.success) {
            setItems(prev => prev.filter(i => i.id !== itemId));
            notify.success(t("lesson_removed") || "Item removed from lesson");
        } else {
            notify.error(t("save_error") || "Error removing item");
        }
    };

    const togglePriority = (itemId: string) => {
        setPriorities(prev => ({
            ...prev,
            [itemId]: prev[itemId] === "CORE" ? "SECONDARY" : "CORE",
        }));
    };

    const startEnrichment = async () => {
        setStatus("enriching");

        try {
            const res = await enrichLinkedItemsAction({ lessonId });

            if (res?.data?.success && res.data.total !== undefined) {
                const data = res.data;
                const remaining = data.remaining ?? 0;

                setProgress({
                    current: data.total - remaining,
                    total: data.total
                });

                if (remaining === 0) {
                    notify.success(t("enrichment_done") || "Enrichment complete! Review your items.");
                    window.location.reload();
                } else {
                    setStatus("idle"); // Voltar para idle para permitir o próximo clique
                }
            } else {
                throw new Error("Batch failed");
            }
        } catch (error) {
            console.error("Enrichment error:", error);
            notify.error(t("automation_error") || "Enrichment failed. Please try again.");
            setStatus("error");
        }
    };

    const saveAndContinue = async () => {
        if (lessonStatus === "ready") {
            onComplete();
            return;
        }
        setStatus("saving");
        const priorityList = items.map(item => ({
            itemId: item.id,
            priority: (priorities[item.id] ?? "CORE") as "CORE" | "SECONDARY",
        }));

        const res = await updateItemsPriorityAction({ lessonId, priorities: priorityList });
        if (res?.data?.success) {
            notify.success(t("priorities_saved") || "Priorities saved!");
            onComplete();
        } else {
            notify.error(t("save_error") || "Error saving priorities.");
            setStatus("reviewing");
        }
    };

    const vocab = items.filter(i => i.type === "VOCABULARY");
    const structures = items.filter(i => i.type === "STRUCTURE");

    // ── IDLE: start enrichment ──────────────────────────────────────
    if (status === "idle") {
        const isStarted = progress.current > 0;
        const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

        return (
            <div className="step-content flex flex-col items-center justify-center min-h-[400px] text-center gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                    <Zap className={cn("w-10 h-10 text-primary", isStarted && "animate-pulse")} />
                    {isStarted && (
                        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                            {percent}%
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold">
                        {isStarted ? (t("continue_enrichment") || "Continue Enrichment") : (t("enrichment_title") || "Enrich Items")}
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-md">
                        {isStarted
                            ? (t("enrichment_progress_desc", { current: progress.current, total: progress.total }) || `You've processed ${progress.current} of ${progress.total} items. Continue with the next batch?`)
                            : (t("enrichment_desc") || "The AI will enrich all extracted items with definitions, phonetics, and examples.")}
                    </p>
                </div>

                {isStarted && (
                    <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                )}

                <Button onClick={startEnrichment} size="lg">
                    <Zap className="w-5 h-5 mr-2" />
                    {isStarted ? (t("process_next_batch") || "Process Next Batch") : (t("start_enrichment") || "Start Enrichment")}
                </Button>
            </div>
        );
    }

    // ── ENRICHING: loading ──────────────────────────────────────────
    if (status === "enriching") {
        const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

        return (
            <div className="step-content flex flex-col items-center justify-center min-h-[400px] text-center gap-6">
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                        {percent}%
                    </div>
                </div>
                <div className="w-full max-w-md space-y-4">
                    <div>
                        <p className="text-lg font-semibold">{t("ai_is_working") || "AI is working..."}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t("enriching_items_progress", { current: progress.current, total: progress.total }) ||
                                `Processing items (${progress.current} of ${progress.total})...`}
                        </p>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground animate-pulse uppercase tracking-widest font-medium">
                        {t("batch_processing_active") || "Batch processing active to ensure reliability"}
                    </p>
                </div>
            </div>
        );
    }

    // ── ERROR ───────────────────────────────────────────────────────
    if (status === "error") {
        return (
            <div className="step-content flex flex-col items-center justify-center min-h-[400px] text-center gap-6">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="font-semibold text-destructive">{t("automation_error") || "Enrichment failed"}</p>
                <Button onClick={startEnrichment} variant="outline">
                    {t("retry") || "Retry"}
                </Button>
            </div>
        );
    }

    // ── REVIEWING: show enriched items with priority toggle ──────────
    return (
        <div className="step-content max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border/50">
                <div className="flex flex-col items-start">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t("enrichment_review_title") || "Review & Prioritize Items"}
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-lg">
                        {t("enrichment_review_desc") || "Toggle each item between Core (always taught) and Secondary (extra practice)."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={saveAndContinue} isLoading={status === "saving"}>
                        {t("confirm_and_next") || "Save & Continue"}
                        <ChevronRight className="w-4 h-4 ml-1.5" />
                    </Button>
                </div>
            </div>

            {/* Legend & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-md bg-muted/30 border border-border/50">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        </div>
                        <span className="flex items-center gap-1">
                            <strong className="text-foreground font-semibold">{t("core") || "Core"}</strong> — {t("core_desc") || "Always taught"}
                        </span>
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center border border-border">
                            <StarOff className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <span className="flex items-center gap-1">
                            <strong className="text-foreground font-semibold">{t("secondary") || "Secondary"}</strong> — {t("secondary_desc") || "Extra practice"}
                        </span>
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[13px] font-medium px-3 py-1.5 rounded-lg bg-background border border-border shadow-sm">
                    <span className="text-muted-foreground">{t("total_items") || "Total"}:</span>
                    <span className="text-primary">{items.length}</span>
                </div>
            </div>

            {/* Two column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Vocabulary */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center shadow-inner">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{t("vocabulary") || "Vocabulary"}</h3>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Words and Phrases</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto rounded-lg px-2.5 py-0.5 font-bold">{vocab.length}</Badge>
                    </div>

                    <div className="space-y-3 max-h-[calc(80vh-16rem)] overflow-y-auto pr-2">
                        {vocab.map((item, i) => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                priority={priorities[item.id] ?? "CORE"}
                                onToggle={() => togglePriority(item.id)}
                                onRemove={() => handleRemove(item.id)}
                                delay={i * 30}
                            />
                        ))}
                        {vocab.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                                <BookOpen className="w-8 h-8 text-muted-foreground/20 mb-2" />
                                <p className="text-sm text-muted-foreground italic">{t("no_vocab_items") || "No vocabulary items."}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Structures */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-md flex items-center justify-center shadow-inner">
                            <Puzzle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{t("structures") || "Grammar & Patterns"}</h3>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Usage and Rules</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto rounded-lg px-2.5 py-0.5 font-bold">{structures.length}</Badge>
                    </div>

                    <div className="space-y-3 max-h-[calc(80vh-16rem)] overflow-y-auto pr-2">
                        {structures.map((item, i) => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                priority={priorities[item.id] ?? "CORE"}
                                onToggle={() => togglePriority(item.id)}
                                onRemove={() => handleRemove(item.id)}
                                delay={i * 30}
                            />
                        ))}
                        {structures.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                                <Puzzle className="w-8 h-8 text-muted-foreground/20 mb-2" />
                                <p className="text-sm text-muted-foreground italic">{t("no_structure_items") || "No structure items."}</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function ItemCard({
    item,
    priority,
    onToggle,
    onRemove,
    delay,
}: {
    item: LearningItem;
    priority: string;
    onToggle: () => void;
    onRemove: () => void;
    delay: number;
}) {
    const isCore = priority === "CORE";
    const vocabMetadata = item.type === "VOCABULARY" ? item.metadata as VocabMetadata : null;
    const structureMetadata = item.type === "STRUCTURE" ? item.metadata as StructureMetadata : null;
    const meaning = vocabMetadata?.meanings?.[0];

    return (
        <div
            className={cn(
                "group flex items-start gap-3.5 p-4 rounded-md border transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300",
                isCore
                    ? "border-amber-500/25 bg-amber-500/2 hover:bg-amber-500/4 shadow-[0_2px_10px_-4px_rgba(245,158,11,0.1)]"
                    : "border-border bg-card hover:bg-muted/40 shadow-sm"
            )}
            style={{ animationDelay: `${delay}ms` }}
            onClick={onToggle}
        >
            {/* Priority toggle icon */}
            <div
                className="mt-0.5 shrink-0 transition-transform active:scale-90"
                onClick={e => { e.stopPropagation(); onToggle(); }}
            >
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isCore ? "bg-amber-500/10" : "bg-muted border border-border/50"
                )}>
                    {isCore
                        ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        : <StarOff className="w-4 h-4 text-muted-foreground/60" />
                    }
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={cn("font-bold text-sm tracking-tight", isCore ? "text-amber-900 dark:text-amber-100" : "text-foreground")}>
                        {item.lemma}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {item.metadata?.level && (
                            <Badge variant="outline" className="text-[9px] h-4 py-0 px-1.5 opacity-70 font-bold bg-background/50 uppercase">
                                {item.metadata.level}
                            </Badge>
                        )}
                        {item.type === "STRUCTURE" && structureMetadata?.structure_type && (
                            <Badge className="text-[9px] h-4 py-0 px-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-none font-bold">
                                {structureMetadata.structure_type}
                            </Badge>
                        )}
                        {item.type === "STRUCTURE" && structureMetadata?.syntactic_pattern && (
                            <Badge variant="outline" className="text-[9px] h-4 py-0 px-1.5 border-amber-500/30 text-amber-600 font-black">
                                {structureMetadata.syntactic_pattern}
                            </Badge>
                        )}
                        {item.type === "VOCABULARY" && vocabMetadata?.phonetic && (
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1 rounded">
                                {vocabMetadata.phonetic}
                            </span>
                        )}
                    </div>
                </div>

                {/* Vocabulary Specifics */}
                {item.type === "VOCABULARY" && vocabMetadata && (
                    <div className="mt-1.5 space-y-1.5">
                        {vocabMetadata.translation && (
                            <p className="text-xs font-medium text-primary/80">{vocabMetadata.translation}</p>
                        )}
                        {meaning && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                {meaning.definition}
                            </p>
                        )}
                        {vocabMetadata.forms && Object.keys(vocabMetadata.forms).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(vocabMetadata.forms).map(([key, val]) => (
                                    <span key={key} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                                        <span className="opacity-50 mr-1">{key}:</span>{val as string}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Structure Specifics */}
                {item.type === "STRUCTURE" && structureMetadata && (
                    <div className="mt-1.5 space-y-2">
                        {structureMetadata.explanation && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                {structureMetadata.explanation}
                            </p>
                        )}

                        {structureMetadata.examples && structureMetadata.examples.length > 0 && (
                            <div className="space-y-3">
                                {structureMetadata.examples.map((example, exIdx) => (
                                    <div key={exIdx} className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                                        <p className="text-xs font-bold leading-tight">{example.text}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{example.translation}</p>

                                        {example.word_order && (
                                            <div className="flex flex-wrap gap-1 mt-2.5">
                                                {example.word_order.map((token, idx) => (
                                                    <div key={idx} className="flex flex-col items-center">
                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 bg-primary/5 text-primary rounded border border-primary/10">
                                                            {token.word}
                                                        </span>
                                                        <span className="text-[7px] uppercase font-black opacity-40 mt-0.5 tracking-tighter">
                                                            {token.role}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-3 self-stretch justify-between py-0.5">
                <Badge
                    variant={isCore ? "default" : "outline"}
                    className={cn(
                        "text-[9px] font-black shrink-0 px-1.5 h-4 tracking-tighter",
                        isCore ? "bg-amber-500 hover:bg-amber-500 text-white border-transparent" : "opacity-40"
                    )}
                >
                    {isCore ? "CORE" : "SECONDARY"}
                </Badge>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"

                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

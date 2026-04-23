"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Dna, Trash2, Loader2 } from "lucide-react";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";
import { updateLessonAction } from "@/modules/curriculum/curriculum.actions";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultFooter,
    VaultIcon,
    VaultPrimaryButton,
    VaultSecondaryButton
} from "@/components/ui/vault";

interface ReviewStepProps {
    lessonId: string;
    initialData: {
        vocabulary: Array<{ lemma: string; type: string; contextual_meaning: string }>;
        structures: Array<{ type: string; name: string; example_from_text: string }>;
    };
    onComplete: () => void;
}

export function ReviewStep({ lessonId, initialData, onComplete }: ReviewStepProps) {
    const t = useTranslations("Learning");
    const [vocab, setVocab] = useState(initialData.vocabulary || []);
    const [structures, setStructures] = useState(initialData.structures || []);
    const [isPending, setIsPending] = useState(false);

    // Deletion State
    const [isDeleteVaultOpen, setIsDeleteVaultOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "VOCAB" | "STRUCTURE"; index: number } | null>(null);

    const openDeleteConfirmation = (type: "VOCAB" | "STRUCTURE", index: number) => {
        setDeleteTarget({ type, index });
        setIsDeleteVaultOpen(true);
    };

    const confirmDeletion = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === "VOCAB") {
            setVocab(v => v.filter((_, i) => i !== deleteTarget.index));
        } else {
            setStructures(s => s.filter((_, i) => i !== deleteTarget.index));
        }

        setIsDeleteVaultOpen(false);
        setDeleteTarget(null);
    };

    const handleConfirm = async () => {
        try {
            setIsPending(true);

            await updateLessonAction({
                id: lessonId,
                analysisResultJson: { vocabulary: vocab, structures: structures },
            });
            
            onComplete();
        } catch (error) {
            console.error(error);
            notify.error(t("confirm_error") || "Error saving items");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="step-content flex flex-col gap-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="max-w-xl">
                    <h2 className="text-xl font-bold tracking-tight">
                        {t("review_items_title") || "Review Learning Items"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {t("review_items_desc") || "Select and refine the vocabulary and structures found in the text."}
                    </p>
                </div>
                <Button
                    onClick={handleConfirm}
                    disabled={isPending || (vocab.length === 0 && structures.length === 0)}
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {t("next_step") || "Confirm & Enrich"}
                </Button>
            </div>

            {/* ── Two columns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Vocabulary */}
                <section className="flex flex-col border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {t("vocabulary") || "Vocabulary"}
                            </span>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold">
                            {vocab.length}
                        </div>
                    </div>

                    <div className="flex-1 divide-y divide-border max-h-[500px] overflow-y-auto no-scrollbar">
                        {vocab.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <BookOpen className="w-8 h-8 text-muted-foreground/20 mb-3" />
                                <p className="text-sm text-muted-foreground italic">
                                    {t("no_vocab_items") || "No vocabulary items."}
                                </p>
                            </div>
                        )}
                        {vocab.map((rawItem, i) => {
                            const item = typeof rawItem === "string"
                                ? { lemma: rawItem, type: "unknown", contextual_meaning: "" }
                                : rawItem;

                            return (
                                <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group relative">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                            <span className="text-base font-bold text-foreground leading-tight">{item.lemma}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground/80">
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground/90 leading-relaxed italic line-clamp-3">
                                            {item.contextual_meaning || "..."}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openDeleteConfirmation("VOCAB", i)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all sm:opacity-0 group-hover:opacity-100 shrink-0"
                                        title={t("remove") || "Remove"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Structures */}
                <section className="flex flex-col border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Dna className="w-4 h-4 text-purple-500" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {t("structures") || "Grammar & Patterns"}
                            </span>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold">
                            {structures.length}
                        </div>
                    </div>

                    <div className="flex-1 divide-y divide-border max-h-[500px] overflow-y-auto no-scrollbar">
                        {structures.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <Dna className="w-8 h-8 text-muted-foreground/20 mb-3" />
                                <p className="text-sm text-muted-foreground italic">
                                    {t("no_structure_items") || "No structure items."}
                                </p>
                            </div>
                        )}
                        {structures.map((rawItem, i) => {
                            const item = typeof rawItem === "string"
                                ? { name: rawItem, type: "Grammar", example_from_text: "" }
                                : rawItem;

                            return (
                                <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group relative">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                            <span className="text-base font-bold text-foreground leading-tight">{item.name}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground/80">
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground/90 leading-relaxed italic line-clamp-3">
                                            {item.example_from_text || "..."}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openDeleteConfirmation("STRUCTURE", i)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all sm:opacity-0 group-hover:opacity-100 shrink-0"
                                        title={t("remove") || "Remove"}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* ── Deletion Confirmation Vault ── */}
            <Vault open={isDeleteVaultOpen} onOpenChange={setIsDeleteVaultOpen}>
                <VaultContent>
                    <VaultHeader>
                        <VaultIcon type="delete" />
                        <VaultTitle>{t("delete_item_confirm_title") || "Remove Item"}</VaultTitle>
                        <VaultDescription>
                            {t("delete_item_confirm_desc") || "This item will be excluded from the analysis. It won't be enriched or included in the final curriculum of this lesson."}
                        </VaultDescription>
                    </VaultHeader>

                    <VaultFooter>
                        <VaultSecondaryButton onClick={() => setIsDeleteVaultOpen(false)}>
                            {t("cancel") || "Cancel"}
                        </VaultSecondaryButton>
                        <VaultPrimaryButton variant="destructive" onClick={confirmDeletion}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("delete_item_confirm_btn") || "Yes, remove"}
                        </VaultPrimaryButton>
                    </VaultFooter>
                </VaultContent>
            </Vault>
        </div>
    );
}
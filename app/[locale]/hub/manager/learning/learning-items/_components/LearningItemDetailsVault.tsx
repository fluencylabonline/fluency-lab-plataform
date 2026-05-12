"use client";

import { LearningItem, VocabMetadata, StructureMetadata } from "@/modules/curriculum/curriculum.types";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultBody,
    VaultIcon,
    VaultSecondaryButton,
} from "@/components/ui/vault";
import { Badge } from "@/components/ui/badge";
import { Languages, Quote, Info, ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";

interface LearningItemDetailsVaultProps {
    item: LearningItem | null;
    onOpenChange: (open: boolean) => void;
}

export function LearningItemDetailsVault({ item, onOpenChange }: LearningItemDetailsVaultProps) {
    const t = useTranslations("Learning");
    if (!item) return null;

    const isVocab = item.type === "VOCABULARY";
    const vocabMeta = isVocab ? item.metadata as VocabMetadata : null;
    const structureMeta = !isVocab ? item.metadata as StructureMetadata : null;

    return (
        <Vault open={!!item} onOpenChange={onOpenChange}>
            <VaultContent className="sm:max-w-2xl">
                <VaultHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <VaultIcon type={isVocab ? "document" : "settings"} />
                            <div>
                                <VaultTitle className="text-left">{item.lemma}</VaultTitle>
                                <VaultDescription className="text-left">
                                    {isVocab ? (t("vocabulary_item") || "Vocabulary Item") : (t("grammar_structure") || "Grammar Structure")}
                                </VaultDescription>
                            </div>
                        </div>
                        <Badge variant="secondary" className="font-black">
                            {item.metadata.level}
                        </Badge>
                    </div>
                </VaultHeader>

                <VaultBody className="space-y-8 mt-4">
                    {/* Translation Section */}
                    {item.translation && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <Languages className="w-4 h-4" />
                                <h4 className="text-xs font-black uppercase tracking-wider">{t("translation") || "Translation"}</h4>
                            </div>
                            <div className="card p-6 bg-primary/5 border-primary/10">
                                <p className="text-2xl font-bold text-primary">
                                    {item.translation}
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Content Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Info className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-wider">{t("details") || "Details"}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isVocab ? (
                                <>
                                    {vocabMeta?.phonetic && (
                                        <div className="item p-4">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">{t("phonetic") || "Phonetic"}</span>
                                            <span className="font-mono text-lg">/{vocabMeta.phonetic}/</span>
                                        </div>
                                    )}
                                    {vocabMeta?.type && (
                                        <div className="item p-4">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">{t("type") || "Type"}</span>
                                            <Badge variant="outline" className="capitalize">{vocabMeta.type}</Badge>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {structureMeta?.structure_type && (
                                        <div className="item p-4">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">{t("structure_type") || "Structure Type"}</span>
                                            <Badge variant="outline">{structureMeta.structure_type}</Badge>
                                        </div>
                                    )}
                                    {structureMeta?.syntactic_pattern && (
                                        <div className="item p-4">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">{t("pattern") || "Pattern"}</span>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">{structureMeta.syntactic_pattern}</code>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Meanings / Explanation */}
                        <div className="item p-6 space-y-4">
                            {isVocab ? (
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold flex items-center gap-2">
                                        <ListChecks className="w-4 h-4 text-primary" />
                                        {t("meanings") || "Meanings"}
                                    </h5>
                                    {vocabMeta?.meanings?.map((m, i) => (
                                        <div key={i} className="space-y-2 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                                            <p className="text-sm leading-relaxed">{m.definition}</p>
                                            {m.translation && (
                                                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg italic">
                                                    {m.translation}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h5 className="text-sm font-bold flex items-center gap-2">
                                        <Info className="w-4 h-4 text-amber-500" />
                                        {t("explanation") || "Explanation"}
                                    </h5>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {structureMeta?.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Examples Section */}
                    {item.metadata.examples && item.metadata.examples.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Quote className="w-4 h-4" />
                                <h4 className="text-xs font-black uppercase tracking-wider">{t("usage_examples") || "Usage Examples"}</h4>
                            </div>
                            <div className="space-y-3">
                                {item.metadata.examples.map((example, i) => (
                                    <div key={i} className="item p-4 border-l-4 border-l-primary/30">
                                        <p className="text-sm font-medium mb-1">{example.text}</p>
                                        <p className="text-xs text-muted-foreground italic opacity-70">
                                            {example.translation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </VaultBody>

                <div className="mt-8">
                    <VaultSecondaryButton onClick={() => onOpenChange(false)} className="w-full">
                        {t("close") || "Close"}
                    </VaultSecondaryButton>
                </div>
            </VaultContent>
        </Vault>
    );
}

"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { notify } from "@/components/ui/toaster";
import { generateBatchPlacementQuestionsAction, commitBatchPlacementQuestionsAction } from "@/modules/placement/placement.actions";
import { getLearningItemsAction, getMediaListAction } from "@/modules/curriculum/curriculum.actions";
import useSWR from "swr";
import { Loader2, Check, Play, Edit2, Trash2, LayoutList, Pause, Sparkles, ArrowRight, ArrowLeft, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { questionsTable } from "@/modules/placement/placement.schema";
import { LearningItem, Media } from "@/modules/curriculum/curriculum.types";
import {
    Vault,
    VaultBody,
    VaultContent,
    VaultFooter,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultIcon,
    VaultPrimaryButton,
    VaultSecondaryButton,
} from "@/components/ui/vault";

interface PlacementWizardVaultProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    languageId: string;
}

const STEPS = ["selection", "config", "review", "finish"] as const;
type Step = typeof STEPS[number];

function SegmentPlayer({ url, start, end }: { url: string, start: number, end: number }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.currentTime = start;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && audioRef.current.currentTime >= end) {
            audioRef.current.pause();
            setIsPlaying(false);
            audioRef.current.currentTime = start;
        }
    };

    return (
        <div className="flex items-center gap-2">
            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />
            <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <span className="text-[10px] text-muted-foreground font-mono">
                {(end - start).toFixed(1)}s
            </span>
        </div>
    );
}

export function PlacementWizardVault({ isOpen, onOpenChange, languageId }: PlacementWizardVaultProps) {
    const t = useTranslations("Placement");
    const [step, setStep] = useState<Step>("selection");
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(["unscramble", "writing"]);
    const [generatedQuestions, setGeneratedQuestions] = useState<(typeof questionsTable.$inferInsert)[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Data fetching
    const { data: learningItems } = useSWR(isOpen && step === "selection" ? ["items", languageId] : null,
        () => getLearningItemsAction({ languageId }).then(r => r?.data || []));
    const { data: mediaItems } = useSWR(isOpen && step === "selection" ? ["media", languageId] : null,
        () => getMediaListAction({}).then(r => r?.data || []));

    const handleGenerate = async () => {
        setIsGenerating(true);
        setStep("review");
        const result = await generateBatchPlacementQuestionsAction({
            languageId,
            itemIds: selectedItems,
            mediaIds: selectedMedia,
            types: selectedTypes
        });

        if (result?.data) {
            setGeneratedQuestions(result.data);
        } else {
            notify.error(t("error_generating") || "Failed to generate questions");
            setStep("config");
        }
        setIsGenerating(false);
    };

    const handleSave = async () => {
        const result = await commitBatchPlacementQuestionsAction(generatedQuestions);
        if (result?.data) {
            notify.success(t("save_success", { count: result.data.count }) || `${result.data.count} questions saved!`);
            onOpenChange(false);
            // Reset wizard
            setStep("selection");
            setSelectedItems([]);
            setSelectedMedia([]);
        } else {
            notify.error(t("error_saving") || "Error saving questions");
        }
    };

    const toggleItem = (id: string) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleMedia = (id: string) => {
        setSelectedMedia(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    return (
        <Vault open={isOpen} onOpenChange={onOpenChange}>
            <VaultContent className="sm:max-w-3xl">
                <VaultIcon type="settings">
                    <Sparkles className="w-5 h-5 text-primary" />
                </VaultIcon>

                <VaultHeader>
                    <VaultTitle>{t("generate_questions_title") || "Gerador de Questões"}</VaultTitle>
                    <VaultDescription>{t("generate_questions_desc") || "Selecione os itens e áudios para criar novos desafios."}</VaultDescription>
                </VaultHeader>

                <VaultBody className="flex flex-col">
                    <div className="flex-1">
                        {step === "selection" && (
                            <Tabs defaultValue="items" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="items">{t("learning_items") || "Itens de Estudo"}</TabsTrigger>
                                    <TabsTrigger value="media">{t("audios") || "Áudios"}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="items" className="mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {learningItems?.map((item: LearningItem) => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleItem(item.id)}
                                                className={`p-3 rounded-md border-2 cursor-pointer transition-all flex items-center justify-between ${selectedItems.includes(item.id)
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50 bg-muted/20"
                                                    }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{item.lemma}</span>
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{item.type}</span>
                                                </div>
                                                {selectedItems.includes(item.id) && (
                                                    <div className="bg-primary rounded-full p-1">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                                <TabsContent value="media" className="mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {mediaItems?.map((media: Media) => (
                                            <div
                                                key={media.id}
                                                onClick={() => toggleMedia(media.id)}
                                                className={`p-3 rounded-md border-2 cursor-pointer transition-all flex items-center justify-between ${selectedMedia.includes(media.id)
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50 bg-muted/20"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                                                        <Play className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-xs font-medium truncate">{media.url.split("/").pop()}</span>
                                                </div>
                                                {selectedMedia.includes(media.id) && (
                                                    <div className="bg-primary rounded-full p-1">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}

                        {step === "config" && (
                            <div className="space-y-6 py-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { id: "unscramble", label: "Scramble (Structures)", icon: <LayoutList className="w-4 h-4" /> },
                                        { id: "writing", label: "Gap Fill (Audio)", icon: <Edit2 className="w-4 h-4" /> },
                                        { id: "multiple_choice", label: "Multiple Choice", icon: <Check className="w-4 h-4" /> },
                                        { id: "grammar", label: "Grammar Points", icon: <Badge className="w-4 h-4" /> },
                                    ].map((type) => (
                                        <div
                                            key={type.id}
                                            onClick={() => toggleType(type.id)}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedTypes.includes(type.id)
                                                ? "border-primary bg-primary/5"
                                                : "border-border bg-muted/30"
                                                }`}
                                        >
                                            <Checkbox
                                                checked={selectedTypes.includes(type.id)}
                                                readOnly
                                                className="rounded-md"
                                            />
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-background rounded-lg text-muted-foreground">
                                                    {type.icon}
                                                </div>
                                                <span className="font-bold text-sm">{type.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === "review" && (
                            <div className="flex-1">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="relative mb-6">
                                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                            <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
                                        </div>
                                        <p className="font-bold text-lg">{t("generating_challenges") || "Gerando desafios..."}</p>
                                        <p className="text-sm text-muted-foreground">{t("using_ai_engine") || "Utilizando motor de IA para questões complexas."}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pb-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {generatedQuestions.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed rounded-3xl">
                                                <p className="text-muted-foreground">{t("no_questions_generated") || "Nenhuma questão gerada."}</p>
                                            </div>
                                        ) : (
                                            generatedQuestions.map((q, idx) => (
                                                <div key={idx} className="p-5 rounded-2xl border-2 border-border bg-muted/10 relative group hover:border-primary/30 transition-all">
                                                    {q.metadata?.mediaUrl && q.metadata?.audioRange && (
                                                        <div className="absolute right-4 top-4">
                                                            <SegmentPlayer
                                                                url={q.metadata.mediaUrl}
                                                                start={q.metadata.audioRange.start}
                                                                end={q.metadata.audioRange.end}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="secondary" className="capitalize px-3 py-1 rounded-lg bg-primary/10 text-primary border-none">
                                                                {q.type?.replace("_", " ") || "question"}
                                                            </Badge>
                                                            <Badge variant="outline" className="rounded-lg border-2">
                                                                {q.cefrLevel}
                                                            </Badge>
                                                            {q.metadata?.aiGenerated && (
                                                                <Badge variant="outline" className="rounded-lg border-primary/30 text-primary flex items-center gap-1">
                                                                    <Sparkles className="w-3 h-3" /> AI
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-primary/10 hover:text-primary" onClick={() => {
                                                                const newContent = prompt("Edit content:", q.content);
                                                                if (newContent) setGeneratedQuestions(prev => prev.map((item, i) => i === idx ? { ...item, content: newContent } : item));
                                                            }}>
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-destructive/10 hover:text-destructive" onClick={() => setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx))}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="text-base font-bold leading-tight">{q.content}</div>
                                                        {q.context && (
                                                            <div className="text-xs text-muted-foreground bg-background/80 p-3 rounded-md border border-border/50 italic">
                                                                {q.context}
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                                            {q.options?.map((opt: { id: string; text: string }) => (
                                                                <div key={opt.id} className={cn(
                                                                    "text-sm flex items-center gap-3 p-2 rounded-lg border",
                                                                    q.correctOptionId === opt.id
                                                                        ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 font-bold"
                                                                        : "bg-background border-border/50 text-muted-foreground"
                                                                )}>
                                                                    <div className={cn(
                                                                        "w-2 h-2 rounded-full",
                                                                        q.correctOptionId === opt.id ? "bg-green-500 animate-pulse" : "bg-gray-300"
                                                                    )} />
                                                                    <span>{opt.text}</span>
                                                                    {q.correctOptionId === opt.id && <Check className="w-3 h-3 ml-auto" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </VaultBody>

                <VaultFooter>
                    <div className="flex-1 flex items-center">
                        {step === "selection" && (selectedItems.length > 0 || selectedMedia.length > 0) && (
                            <div className="flex gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {selectedItems.length} Itens
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    {selectedMedia.length} Áudios
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {step !== "selection" && (
                            <VaultSecondaryButton onClick={() => setStep(STEPS[STEPS.indexOf(step) - 1])}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t("back") || "Voltar"}
                            </VaultSecondaryButton>
                        )}

                        {step === "selection" && (
                            <VaultPrimaryButton
                                disabled={selectedItems.length === 0 && selectedMedia.length === 0}
                                onClick={() => setStep("config")}
                            >
                                {t("next") || "Próximo"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </VaultPrimaryButton>
                        )}

                        {step === "config" && (
                            <VaultPrimaryButton onClick={handleGenerate} disabled={selectedTypes.length === 0}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                {t("generate") || "Gerar Questões"}
                            </VaultPrimaryButton>
                        )}

                        {step === "review" && !isGenerating && (
                            <VaultPrimaryButton onClick={handleSave} disabled={generatedQuestions.length === 0}>
                                <Save className="w-4 h-4 mr-2" />
                                {t("save_all", { count: generatedQuestions.length }) || `Salvar ${generatedQuestions.length} Questões`}
                            </VaultPrimaryButton>
                        )}
                    </div>
                </VaultFooter>
            </VaultContent>
        </Vault>
    );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    Brain,
    Book,
    Puzzle,
    ChevronRight,
    Search,
    Zap
} from "lucide-react";
import {
    analyzeLessonAction
} from "@/modules/curriculum/curriculum.actions";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";
import { AnalysisResult } from "@/modules/curriculum/curriculum.types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AnalysisStepProps {
    lessonId: string;
    onComplete: () => void;
    step: 4 | 7;
    initialData?: AnalysisResult;
    creationStep: number;
    status: string;
}

export function AnalysisStep({ lessonId, onComplete, step, initialData, creationStep, status: lessonStatus }: AnalysisStepProps) {
    const t = useTranslations("Learning");

    // Differentiate between initial suggestions (from transcription) and final analysis
    // Step 4 is done if creationStep >= 5
    // Step 7 is done if creationStep >= 8
    const isStepDone = step === 4 ? creationStep >= 5 : creationStep >= 8;
    const hasExistingData = (initialData?.vocabulary?.length ?? 0) > 0 || (initialData?.structures?.length ?? 0) > 0;

    const [status, setStatus] = useState<"idle" | "analyzing" | "completed" | "error">(
        (isStepDone && hasExistingData) || lessonStatus === "ready" ? "completed" : "idle"
    );
    const [progress, setProgress] = useState(hasExistingData ? 100 : 0);
    const [vocabulary, setVocabulary] = useState<AnalysisResult["vocabulary"]>(initialData?.vocabulary || []);
    const [structures, setStructures] = useState<AnalysisResult["structures"]>(initialData?.structures || []);
    const [currentTask, setCurrentTask] = useState(hasExistingData ? (t("analysis_done") || "Analysis complete!") : "");

    // Simulate progress while analyzing
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "analyzing") {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return prev;
                    const increment = prev < 30 ? 2 : prev < 70 ? 1 : 0.5;
                    return prev + increment;
                });
            }, 300);
        } else if (status === "completed") {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [status]);

    const startAnalysis = async () => {
        try {
            setStatus("analyzing");
            setProgress(0);
            setVocabulary([]);
            setStructures([]);
            setCurrentTask(t("preparing_ai_engine") || "Preparing AI Engine...");

            // 1. Call action to update lesson status/step
            const res = await analyzeLessonAction({ lessonId });
            if (res?.validationErrors) throw new Error("Validation error");

            // 2. Start SSE
            const eventSource = new EventSource(`/api/curriculum/stream?lessonId=${lessonId}&step=${step}`);

            eventSource.addEventListener("chunk", () => {
                // Update current task based on progress (simulated)
                setProgress(p => {
                    if (p < 20) setCurrentTask(t("brainstorming") || "Identifying key concepts...");
                    else if (p < 60) setCurrentTask(t("extracting_vocabulary") || "Extracting vocabulary...");
                    else setCurrentTask(t("analyzing_structures") || "Analyzing grammar patterns...");
                    return p;
                });
            });

            eventSource.addEventListener("result", (e) => {
                try {
                    const rawData = JSON.parse(e.data);
                    const result = typeof rawData === "string" ? JSON.parse(rawData) : rawData;

                    if (result.vocabulary) setVocabulary(result.vocabulary);
                    if (result.structures) setStructures(result.structures);
                    console.log("Analysis Result captured:", result);
                } catch (err) {
                    console.error("Error parsing analysis result", err);
                }
            });

            eventSource.addEventListener("status", (e) => {
                const data = JSON.parse(e.data);
                if (data === "completed") {
                    setStatus("completed");
                    setCurrentTask(t("analysis_done") || "Analysis complete!");
                    eventSource.close();
                }
            });

            eventSource.addEventListener("error", (e) => {
                console.error("SSE Error:", e);
                setStatus("error");
                eventSource.close();
            });

        } catch (error) {
            console.error(error);
            setStatus("error");
            notify.error(t("analysis_error") || "Error analyzing content");
        }
    };

    return (
        <div className="step-content">
            {/* ── Header ── */}
            <div className="text-center space-y-4 mb-4">
                <div className="relative inline-block">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto relative z-10">
                        <Brain className={cn("w-10 h-10 text-primary", status === "analyzing" && "animate-pulse")} />
                    </div>
                    {status === "analyzing" && (
                        <div className="absolute inset-0 bg-primary/20 rounded-3xl animate-ping scale-110 opacity-20" />
                    )}
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t("ai_analysis_title")}</h2>
                    <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-base">
                        {t("ai_analysis_desc")}
                    </p>
                </div>
            </div>

            {status === "idle" ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-[40px] bg-muted/20 hover:bg-muted/30 transition-colors group cursor-default">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Zap className="w-8 h-8 text-amber-500" />
                    </div>
                    <Button onClick={startAnalysis}>
                        <Sparkles className="w-6 h-6 mr-3" />
                        {t("start_analysis")}
                    </Button>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* ── Progress Section ── */}
                    <div className="bg-card rounded-md p-8 border border-border shadow-sm space-y-6 relative overflow-hidden">
                        {status === "analyzing" && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 animate-shimmer" />
                        )}

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                    status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                                )}>
                                    {status === "analyzing" ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">
                                        {status === "analyzing" ? t("ai_is_working") : t("analysis_done")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {currentTask}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-black text-primary/20 select-none">
                                    {Math.round(progress)}%
                                </span>
                                {status === "completed" && (
                                    <Button onClick={onComplete}>
                                        {t("continue")}
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Progress value={progress} className="h-3 rounded-full" />
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                                <span>{t("scanning_content") || "Scanning Content"}</span>
                                <span>{t("finalizing") || "Finalizing"}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Results Grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Vocabulary Card */}
                        <div className="bg-card rounded-md border border-border overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                            <div className="p-6 bg-primary/[0.03] border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Book className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-lg">{t("vocabulary_found") || "Vocabulary Found"}</h3>
                                </div>
                                <Badge variant="secondary" className="rounded-lg px-3 py-1 font-bold">
                                    {vocabulary.length}
                                </Badge>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                {status === "analyzing" && vocabulary.length === 0 ? (
                                    // Skeletons
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-16 w-full rounded-2xl bg-muted/40 animate-pulse border border-border/50" />
                                    ))
                                ) : vocabulary.length > 0 ? (
                                    vocabulary.map((item, i) => (
                                        <div key={i} className="group p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] transition-all animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-bold text-primary text-base group-hover:scale-105 transition-transform origin-left">
                                                    {item.lemma || item.term || item.word}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold opacity-60">Vocab</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed italic">
                                                {item.contextual_meaning || item.meaning || item.definition}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                        <Search className="w-12 h-12 mb-4" />
                                        <p className="text-sm font-medium">{t("no_items_yet") || "No items found yet"}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Structures Card */}
                        <div className="bg-card rounded-md border border-border overflow-hidden shadow-sm flex flex-col min-h-[400px]">
                            <div className="p-6 bg-amber-500/[0.03] border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                        <Puzzle className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <h3 className="font-bold text-lg">{t("structures_found") || "Structures Found"}</h3>
                                </div>
                                <Badge variant="secondary" className="rounded-lg px-3 py-1 font-bold">
                                    {structures.length}
                                </Badge>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                {status === "analyzing" && structures.length === 0 ? (
                                    // Skeletons
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-16 w-full rounded-2xl bg-muted/40 animate-pulse border border-border/50" />
                                    ))
                                ) : structures.length > 0 ? (
                                    structures.map((item, i) => (
                                        <div key={i} className="group p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-amber-500/30 hover:bg-amber-500/[0.02] transition-all animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-bold text-amber-600 dark:text-amber-400 text-base group-hover:scale-105 transition-transform origin-left">
                                                    {item.name || item.lemma || item.type}
                                                </span>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold opacity-60">Grammar</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed italic">
                                                {item.example_from_text || item.contextual_meaning || item.explanation}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                        <Search className="w-12 h-12 mb-4" />
                                        <p className="text-sm font-medium">{t("no_items_yet") || "No items found yet"}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

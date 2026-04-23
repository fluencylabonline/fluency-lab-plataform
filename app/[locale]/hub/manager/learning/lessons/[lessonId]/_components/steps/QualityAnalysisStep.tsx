"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { notify } from "@/components/ui/toaster";
import {
    ChevronRight,
    Sparkles,
    Target,
    BookOpen,
    MessageSquare,
    Dumbbell,
    Mic2,
    CheckSquare,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Zap,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QualityResult, AnalysisStatus, SectionStatus } from "@/modules/curriculum/curriculum.types";

interface QualityAnalysisStepProps {
    lessonId: string;
    onComplete: () => void;
    initialData?: QualityResult | null;
}

const SECTION_META = [
    { key: "objective", icon: Target, label: "Objetivo" },
    { key: "vocabulary", icon: BookOpen, label: "Vocabulário e Gramática" },
    { key: "contextualization", icon: MessageSquare, label: "Contextualização" },
    { key: "guidedPractice", icon: Dumbbell, label: "Prática Guiada" },
    { key: "freeConversation", icon: Mic2, label: "Conversação Livre" },
    { key: "consolidation", icon: CheckSquare, label: "Consolidação" },
] as const;

function StatusBadge({ status }: { status: SectionStatus }) {
    const config = {
        pass: { label: "Presente", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
        partial: { label: "Parcial", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: AlertTriangle },
        fail: { label: "Ausente", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: XCircle },
    };
    const { label, className, icon: Icon } = config[status];
    return (
        <Badge variant="outline" className={cn("gap-1 text-xs font-semibold", className)}>
            <Icon className="w-3 h-3" />
            {label}
        </Badge>
    );
}

function ScoreRing({ score }: { score: number }) {
    const color = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
    const bgColor = score >= 75 ? "bg-emerald-500/10" : score >= 50 ? "bg-amber-500/10" : "bg-red-500/10";
    return (
        <div className={cn("w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto", bgColor)}>
            <span className={cn("text-4xl font-black tabular-nums", color)}>{score}</span>
            <span className="text-xs text-muted-foreground font-medium">/ 100</span>
        </div>
    );
}

export function QualityAnalysisStep({ lessonId, onComplete, initialData }: QualityAnalysisStepProps) {
    const t = useTranslations("Learning");
    const [status, setStatus] = useState<AnalysisStatus>(initialData ? "completed" : "idle");
    const [progress, setProgress] = useState(initialData ? 100 : 0);
    const [result, setResult] = useState<QualityResult | null>(initialData || null);

    // Simulate progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "analyzing") {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 98) return prev;
                    return prev + (prev < 30 ? 2 : prev < 70 ? 0.5 : 0.1);
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [status]);

    const runAnalysis = async () => {
        try {
            setStatus("analyzing");
            setProgress(0);
            setResult(null);

            const eventSource = new EventSource(`/api/curriculum/stream?lessonId=${lessonId}&step=6`);

            eventSource.addEventListener("result", (e) => {
                try {
                    const rawData = JSON.parse(e.data);
                    const parsedResult = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
                    setResult(parsedResult);
                    setStatus("completed");
                    setProgress(100);
                    eventSource.close();
                } catch (err) {
                    console.error("Parse error:", err);
                }
            });

            eventSource.onerror = (err) => {
                console.error("SSE Error:", err);
                setStatus("error");
                eventSource.close();
                notify.error(t("automation_error") || "Erro na análise de qualidade");
            };

        } catch (error) {
            console.error(error);
            setStatus("error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex sm:flex-row flex-col items-center justify-between gap-4 p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{t("quality_audit") || "Auditoria de Qualidade"}</h2>
                        <p className="text-sm text-muted-foreground">{t("quality_audit_desc") || "Verificamos se a lição segue os padrões pedagógicos da Fluency Academy."}</p>
                    </div>
                </div>
                {status !== "completed" && (
                    <Button
                        onClick={runAnalysis}
                        disabled={status === "analyzing"}
                    >
                        {status === "analyzing" ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Zap className="w-4 h-4 mr-2 fill-current" />
                        )}
                        {t("start_audit") || "Iniciar Auditoria"}
                    </Button>
                )}
                {status === "completed" && (
                    <Button onClick={onComplete}>
                        {t("continue") || "Continuar"}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>

            {status === "analyzing" && (
                <div className="space-y-3 p-8 bg-muted/20 border border-border/50 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex justify-between text-sm font-bold mb-1">
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            {t("ai_auditing") || "IA auditando conteúdo..."}
                        </span>
                        <span className="tabular-nums text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 rounded-full" />
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Score Card */}
                        <div className="bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                            <ScoreRing score={result.score} />
                            <div className="mt-4">
                                <h3 className="text-lg font-bold">Score Pedagógico</h3>
                                <p className="text-xs text-muted-foreground">Baseado em diretrizes da FluencyLab</p>
                            </div>
                        </div>

                        {/* Level and Feedback */}
                        <div className="md:col-span-2 bg-card border border-border rounded-3xl p-8 space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Nível sugerido:</span>
                                <Badge variant="outline" className="font-bold text-base px-3">{result.suggestedLevel}</Badge>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-1">
                                    {t("general_feedback") || "General Feedback"}
                                </p>
                                <p className="text-sm leading-relaxed text-foreground/80">{result.generalFeedback}</p>
                            </div>
                        </div>
                    </div>

                    {/* 6 Sections Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SECTION_META.map(({ key, icon: Icon, label }, i) => {
                            const section = result.sections[key as keyof typeof result.sections];
                            return (
                                <div
                                    key={key}
                                    className="bg-card border border-border rounded-2xl p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <span className="text-xs font-semibold truncate">{label}</span>
                                        </div>
                                        <StatusBadge status={section.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                        {section.feedback}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Skeleton while analyzing */}
            {status === "analyzing" && !result && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse border border-border/50" />
                    ))}
                </div>
            )}
        </div>
    );
}
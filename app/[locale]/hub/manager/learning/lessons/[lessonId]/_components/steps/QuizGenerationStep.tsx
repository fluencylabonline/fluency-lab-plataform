"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    Brain,
    ChevronRight,
    Zap,
    Puzzle
} from "lucide-react";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizGenerationStepProps {
    lessonId: string;
    onComplete: () => void;
    hasData?: boolean;
}

export function QuizGenerationStep({ lessonId, onComplete, hasData }: QuizGenerationStepProps) {
    const t = useTranslations("Learning");

    const [status, setStatus] = useState<"idle" | "generating" | "completed" | "error">(
        hasData ? "completed" : "idle"
    );
    const [progress, setProgress] = useState(hasData ? 100 : 0);
    const [currentTask, setCurrentTask] = useState(hasData ? (t("quiz_ready") || "Quiz is ready!") : "");
    const [streamedText, setStreamedText] = useState("");

    // Simulate progress while generating
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (status === "generating") {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 98) return prev;
                    const increment = prev < 30 ? 1.5 : prev < 70 ? 0.8 : 0.3;
                    return prev + increment;
                });
            }, 300);
        }

        // Cleanup function clears the interval when status changes or component unmounts
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status]);

    const startGeneration = async () => {
        try {
            setStatus("generating");
            setProgress(0);
            setStreamedText("");
            setCurrentTask(t("preparing_quiz_engine") || "Preparing pedagogical engine...");

            const eventSource = new EventSource(`/api/curriculum/stream?lessonId=${lessonId}&step=9`);

            eventSource.addEventListener("chunk", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    setStreamedText(prev => prev + data);

                    // Update task based on progress
                    setProgress(p => {
                        if (p < 25) setCurrentTask(t("designing_vocabulary_questions") || "Designing vocabulary questions...");
                        else if (p < 50) setCurrentTask(t("crafting_grammar_challenges") || "Crafting grammar challenges...");
                        else if (p < 75) setCurrentTask(t("analyzing_audio_segments") || "Analyzing audio segments for deep listening...");
                        else setCurrentTask(t("finalizing_pedagogical_feedback") || "Finalizing pedagogical feedback...");
                        return p;
                    });
                } catch (err) {
                    console.error("Error parsing chunk", err);
                }
            });

            eventSource.addEventListener("status", (e) => {
                const data = JSON.parse(e.data);
                if (data === "completed") {
                    // Update EVERYTHING together here in the event handler!
                    setStatus("completed");
                    setProgress(100);
                    setCurrentTask(t("quiz_generation_done") || "Quiz generated successfully!");
                    eventSource.close();
                }
            });

            eventSource.addEventListener("error", (e) => {
                console.error("SSE Error:", e);
                setStatus("error");
                notify.error(t("quiz_generation_error") || "Error generating quiz");
                eventSource.close();
            });

        } catch (error) {
            console.error(error);
            setStatus("error");
            notify.error(t("quiz_generation_error") || "Error starting quiz generation");
        }
    };

    return (
        <div className="step-content max-w-4xl mx-auto">
            {/* ── Header ── */}
            <div className="text-center space-y-4 mb-8">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto relative z-10 transition-transform hover:scale-105 duration-500">
                        <Puzzle className={cn("w-12 h-12 text-primary", status === "generating" && "animate-pulse")} />
                    </div>
                    {status === "generating" && (
                        <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-ping scale-110 opacity-10" />
                    )}
                </div>
                <div>
                    <h2 className="text-4xl font-black tracking-tight">{t("quiz_generation_title") || "Pedagogical Quiz"}</h2>
                    <p className="text-muted-foreground mt-3 max-w-md mx-auto text-lg leading-relaxed">
                        {t("quiz_generation_desc") || "AI is creating a customized evaluation based on your lesson content and audio transcription."}
                    </p>
                </div>
            </div>

            {status === "idle" ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-[40px] bg-muted/20 hover:bg-muted/30 transition-all group cursor-default shadow-inner">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                        <Zap className="w-10 h-10 text-amber-500" />
                    </div>
                    <Button onClick={startGeneration}>
                        <Sparkles className="w-6 h-6 mr-3" />
                        {t("generate_quiz_now") || "Generate Smart Quiz"}
                    </Button>
                    <p className="mt-6 text-sm font-medium text-muted-foreground/60 uppercase tracking-widest italic">
                        {t("estimated_time") || "Takes about 30-45 seconds"}
                    </p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* ── Progress Section ── */}
                    <div className="bg-card rounded-md p-10 border border-border shadow-xl shadow-primary/5 space-y-8 relative overflow-hidden">
                        {status === "generating" && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/60 to-primary/10 animate-shimmer" />
                        )}

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-sm",
                                    status === "completed" ? "bg-emerald-500/10 text-emerald-500 scale-110" : "bg-primary/10 text-primary"
                                )}>
                                    {status === "generating" ? <Loader2 className="w-8 h-8 animate-spin" /> : <CheckCircle2 className="w-8 h-8" />}
                                </div>
                                <div className="flex flex-col items-start">
                                    <h3 className="font-black text-2xl">
                                        {status === "generating" ? t("ai_is_crafting") || "AI is Crafting..." : t("quiz_is_ready") || "Masterpiece Ready!"}
                                    </h3>
                                    <p className="text-base text-muted-foreground font-medium mt-1">
                                        {currentTask}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className="text-4xl font-black text-primary/30 select-none tabular-nums">
                                    {Math.round(progress)}%
                                </span>
                                {status === "completed" && (
                                    <Button onClick={onComplete}>
                                        {t("review_quiz") || "Review Quiz"}
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Progress value={progress} className="h-4 rounded-full bg-muted/50 border border-border/20" />
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">
                                <span>{t("pedagogical_logic") || "Pedagogical Logic"}</span>
                                <span>{t("final_polish") || "Final Polish"}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Streaming Visualization (Optional/Subtle) ── */}
                    {status === "generating" && streamedText && (
                        <div className="bg-muted/30 rounded-md p-6 border border-border/50 font-mono text-[10px] text-muted-foreground/60 overflow-hidden max-h-[120px] relative transition-all animate-in fade-in duration-1000">
                            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-muted/30 to-transparent z-10" />
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-muted/30 to-transparent z-10" />
                            <div className="whitespace-pre-wrap break-all animate-pulse">
                                {streamedText}
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center gap-4 p-10 bg-destructive/5 rounded-[32px] border border-destructive/20 text-center animate-in shake-1">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                                <Brain className="w-8 h-8 text-destructive" />
                            </div>
                            <h3 className="text-xl font-bold text-destructive">{t("generation_failed") || "Generation Failed"}</h3>
                            <Button variant="outline" onClick={startGeneration}>
                                {t("try_again") || "Try Again"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Check,
    ArrowRight,
    MessageSquare,
    Trash2,
    Plus,
    Loader2,
    Play,
    Pause
} from "lucide-react";
import { useRef } from "react";
import {
    updateQuizAction,
    finalizeLessonAction
} from "@/modules/curriculum/curriculum.actions";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";
import { QuizData, QuizQuestion } from "@/modules/curriculum/curriculum.types";

interface QuizReviewStepProps {
    lessonId: string;
    initialData: QuizData;
    onComplete: () => void;
    mediaUrl?: string;
    status?: string;
}

export function QuizReviewStep({ lessonId, initialData, onComplete, mediaUrl, status }: QuizReviewStepProps) {
    const t = useTranslations("Learning");
    const [quiz] = useState<QuizData>(initialData);
    const [isPending, setIsPending] = useState(false);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const stopTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!mediaUrl) return;
        const audio = new Audio(mediaUrl);
        audioRef.current = audio;

        const handleEnded = () => setPlayingId(null);
        const handleTimeUpdate = () => {
            if (stopTimeRef.current !== null && audio.currentTime >= stopTimeRef.current) {
                audio.pause();
                stopTimeRef.current = null;
                setPlayingId(null);
            }
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("pause", handleEnded);
        audio.addEventListener("timeupdate", handleTimeUpdate);

        return () => {
            audio.pause();
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("pause", handleEnded);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audioRef.current = null;
        };
    }, [mediaUrl]);

    const handlePlayRange = async (questionId: string, range: { start: number; end: number }) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playingId === questionId) {
            audio.pause();
            stopTimeRef.current = null;
            setPlayingId(null);
            return;
        }

        audio.currentTime = range.start;
        stopTimeRef.current = range.end;
        setPlayingId(questionId);
        await audio.play();
    };

    const handleSave = async () => {
        if (status === "ready") {
            onComplete();
            return;
        }

        try {
            setIsPending(true);
            const res = await updateQuizAction({ lessonId, quizData: quiz });
            if (res?.data?.success) {
                notify.success(t("quiz_updated") || "Quiz updated!");
                onComplete();
            }
        } catch {
            notify.error(t("save_error") || "Error saving quiz");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="step-content">
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col items-start">
                    <h2 className="text-2xl font-bold">{t("review_quiz_title") || "Review Quiz Questions"}</h2>
                    <p className="text-muted-foreground">{t("review_quiz_desc") || "Review and edit the generated quiz questions."}</p>
                </div>
                {status === "ready" ? (
                    <Button onClick={onComplete} disabled={isPending}>
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                        {t("next_step") || "Next Step"}
                    </Button>
                ) : (
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                        {t("finalize_lesson") || "Finalize Lesson"}
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-4 h-dvh overflow-y-scroll pb-68">
                {(quiz.quiz_sections || []).map((section, sectionIdx) => (
                    <div key={sectionIdx} className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                                {t(`quiz_section_${section.type}`) || section.type}
                            </h3>
                        </div>

                        <div className="grid gap-6">
                            {(section.questions || []).map((q: QuizQuestion, i: number) => (
                                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                                    {t("question_label") || "Question"} {i + 1}
                                                </span>
                                                {q.audioRange && (
                                                    <button
                                                        onClick={() => handlePlayRange(`${sectionIdx}-${i}`, q.audioRange!)}
                                                        className="flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold hover:bg-primary/20 transition-colors"
                                                    >
                                                        {playingId === `${sectionIdx}-${i}` ? (
                                                            <Pause className="w-3 h-3 fill-current" />
                                                        ) : (
                                                            <Play className="w-3 h-3 fill-current" />
                                                        )}
                                                        {Math.floor(q.audioRange.start / 60)}:{(q.audioRange.start % 60).toString().padStart(2, '0')} - {Math.floor(q.audioRange.end / 60)}:{(q.audioRange.end % 60).toString().padStart(2, '0')}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="font-bold text-lg">{q.text}</p>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        {q.options.map((opt: string, optIdx: number) => (
                                            <div
                                                key={optIdx}
                                                className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${optIdx === q.correctIndex
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold"
                                                    : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400"
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${optIdx === q.correctIndex ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                                                    }`}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </div>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 flex gap-3 items-start border border-gray-100 dark:border-gray-800">
                                        <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 not-italic mr-1">
                                                {t("explanation_label") || "Explanation"}:
                                            </span>
                                            {q.explanation}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <Button variant="outline">
                    <Plus className="w-5 h-5 mr-2" />
                    {t("add_question") || "Add Manual Question"}
                </Button>
            </div>
        </div>
    );
}
export function FinalizationStep({ lessonId, onComplete, isReady }: { lessonId: string; onComplete: () => void; isReady?: boolean }) {
    const t = useTranslations("Learning");

    // 1. Initialize state directly to "finalizing" if not ready. 
    // This entirely removes the need to synchronously update state inside the effect!
    const [status, setStatus] = useState<"idle" | "finalizing" | "completed" | "error">(
        isReady ? "completed" : "finalizing"
    );

    useEffect(() => {
        // 2. Move the logic INSIDE the useEffect to fix the missing dependency warning
        const finalize = async () => {
            if (isReady) {
                onComplete();
                return;
            }

            try {
                // Notice we removed setStatus("finalizing") here because it's already the default state
                const res = await finalizeLessonAction({ lessonId });

                if (res?.data?.success) {
                    setStatus("completed");
                    setTimeout(() => onComplete(), 2000);
                }
            } catch {
                setStatus("error");
                notify.error(t("finalization_failed") || "Finalization failed");
            }
        };

        finalize();

        // 3. Disable exhaustive deps here specifically to avoid infinite loops if the parent 
        // component didn't wrap 'onComplete' in a useCallback hook.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId, isReady]);

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Check className={`w-10 h-10 transition-all duration-500 ${status === "completed" ? "text-emerald-500 scale-125" : "text-primary opacity-20"}`} />
            </div>
            <h2 className="text-3xl font-bold mb-2">
                {status === "finalizing" ? (t("finalizing_title") || "Applying Finishing Touches") : (t("lesson_ready_title") || "Mission Accomplished!")}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
                {status === "finalizing"
                    ? (t("finalizing_desc") || "Generating embeddings for search and building the final practice session modules.")
                    : (t("lesson_ready_desc") || "Your lesson is now live and ready for students to start learning.")}
            </p>
        </div>
    );
}
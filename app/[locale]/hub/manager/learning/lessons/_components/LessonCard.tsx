"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    MoreHorizontal,
    ArrowRight,
    Languages,
    Layers,
    Copy,
    PlayCircle,
    FileAudio,
    Dna,
    FileText,
    Sparkles,
    Clock,
    MessageSquare,
    Wand2,
    ListChecks,
    Trophy,
    AlertCircle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { DeleteLessonVault } from "./DeleteLessonVault";
import { useTransition } from "react";
import { cloneLessonAction } from "@/modules/curriculum/curriculum.actions";
import { notify } from "@/components/ui/toaster";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";

interface LessonCardProps {
    lesson: LessonSummary;
}

export function LessonCard({ lesson }: LessonCardProps) {
    const t = useTranslations("Learning");
    const [isPending, startTransition] = useTransition();

    const statusColors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        analyzing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        processing_items: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        error: "bg-destructive/10 text-destructive border-destructive/20",
    };

    const cefrColors: Record<string, string> = {
        A1: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
        A2: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        B1: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        B2: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800",
        C1: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        C2: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
    };

    const handleClone = () => {
        startTransition(async () => {
            const result = await cloneLessonAction({ lessonId: lesson.id });
            if (result?.data) {
                notify.success(t("lesson_cloned_success") || "Lesson cloned!");
            } else {
                notify.error(result?.serverError || "Error cloning lesson");
            }
        });
    };

    // creationStep icons — maps step number (index+1) to an icon
    const stepIcons = [
        <Clock key={1} className="w-3 h-3" />, // 1: Draft Ready
        <FileAudio key={2} className="w-3 h-3" />, // 2: Upload & Transcribe
        <MessageSquare key={3} className="w-3 h-3" />, // 3: Transcription Review
        <Dna key={4} className="w-3 h-3" />, // 4: Transcription Analysis
        <FileText key={5} className="w-3 h-3" />, // 5: Lesson Content
        <Dna key={6} className="w-3 h-3" />, // 6: Lesson Analysis
        <ListChecks key={7} className="w-3 h-3" />, // 7: Review Learning Items
        <Wand2 key={8} className="w-3 h-3" />, // 8: Enrich Items
        <Sparkles key={9} className="w-3 h-3" />, // 9: Generate Quiz
        <Layers key={10} className="w-3 h-3" />, // 10: Quiz Review
        <Trophy key={11} className="w-3 h-3" />, // 11: Finalize
    ];

    return (
        <div className="group relative flex flex-col card p-5">
            {/* Header Info */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-md">
                        {lesson.media?.type === "video" ? (
                            <PlayCircle className="w-5 h-5 text-primary" />
                        ) : (
                            <FileAudio className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                            {lesson.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`h-5 px-2 text-[10px] uppercase tracking-wider font-bold ${cefrColors[lesson.difficulty] || ""}`}>
                                {lesson.difficulty}
                            </Badge>
                            <Badge variant="outline" className="h-5 px-2 bg-gray-50 dark:bg-gray-800 text-[10px] uppercase tracking-wider font-bold">
                                <Languages className="w-3 h-3 mr-1" />
                                {lesson.language?.name || "N/A"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors outline-none">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-md border-gray-200 dark:border-gray-800">
                        <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-lg">
                            <Link href={`/hub/manager/learning/lessons/${lesson.id}`}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                {t("edit_details") || "Edit Lesson"}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleClone}
                            disabled={isPending}
                            className="cursor-pointer py-2.5 rounded-lg"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            {t("clone_lesson") || "Clone Version"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DeleteLessonVault
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Progress & Status */}
            <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-tight">
                            {t("status") || "Status"}:
                        </span>
                        <Badge className={`h-5 px-2 text-[10px] uppercase tracking-wider font-bold border ${statusColors[lesson.status] || statusColors.draft}`}>
                            {lesson.status === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
                            {t(`status_${lesson.status}`) || lesson.status}
                        </Badge>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                        {t("version") || "v"}{lesson.version}
                    </span>
                </div>

                {/* Pipeline Steps (1-11) */}
                <div className="flex items-center justify-between gap-1 mt-2">
                    {Array.from({ length: 11 }).map((_, i) => {
                        const stepNum = i + 1;
                        const isCompleted = stepNum < lesson.creationStep;
                        const isCurrent = stepNum === lesson.creationStep;

                        return (
                            <div
                                key={stepNum}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${isCompleted
                                    ? "bg-primary"
                                    : isCurrent
                                        ? "bg-primary/40 animate-pulse"
                                        : "bg-gray-100 dark:bg-gray-800"
                                    }`}
                                title={`Step ${stepNum}: ${isCompleted ? "Completed" : isCurrent ? "Current" : "Pending"}`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    <span className="flex items-center gap-1">
                        {stepIcons[Math.min(lesson.creationStep - 1, 10)]}
                        {t("step_progress") || "Progress"}
                    </span>
                    <span>{Math.min(lesson.creationStep, 11)}/11</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
                <Link
                    href={`/hub/manager/learning/lessons/${lesson.id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 transition-all"
                >
                    {t("continue_editing") || "Continue"}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

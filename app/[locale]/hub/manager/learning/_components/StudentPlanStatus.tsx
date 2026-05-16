"use client";

import useSWR from "swr";
import { getStudentPlanGapAction } from "@/modules/learning/learning.actions";
import { useTranslations } from "next-intl";
import {
    CheckCircle2,
    Calendar,
    BookOpen,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudentPlanStatusProps {
    studentId: string;
}

export function StudentPlanStatus({ studentId }: StudentPlanStatusProps) {
    const t = useTranslations("Learning");

    const { data: result, isLoading } = useSWR(
        studentId ? ["student-plan-gap", studentId] : null,
        () => getStudentPlanGapAction({ studentId })
    );

    const gapData = result?.data?.success ? result.data.data : null;

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("analyzing_curriculum_gap") || "Analyzing curriculum gap..."}
            </div>
        );
    }

    if (!gapData) return null;

    const hasGap = gapData.hasGap;

    return (
        <div className={`p-4 rounded-2xl border transition-all ${hasGap
                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/50"
                : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50"
            }`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md ${hasGap ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
                    }`}>
                    {hasGap ? (
                        <AlertTriangle className={`w-5 h-5 ${hasGap ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                    ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">
                            {hasGap ? t("curriculum_gap_detected") || "Curriculum Gap Detected" : t("curriculum_optimized") || "Curriculum Optimized"}
                        </h4>
                        <Badge variant={hasGap ? "destructive" : "default"} className="font-bold">
                            {hasGap ? `-${gapData.gap} ${t("lessons") || "Lessons"}` : t("completed") || "Completed"}
                        </Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        {hasGap
                            ? t("gap_desc", { count: gapData.gap }) || `This student has ${gapData.gap} upcoming classes without an assigned lesson. You need to expand their plan.`
                            : t("no_gap_desc") || "All upcoming scheduled classes have a assigned lesson from the active plan."
                        }
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <Calendar className="w-4 h-4 text-primary" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t("empty_slots") || "Empty Slots"}</span>
                                <span className="text-sm font-bold">{gapData.upcomingClassesCount}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t("plan_lessons") || "Plan Lessons"}</span>
                                <span className="text-sm font-bold">{gapData.planLessonsCount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

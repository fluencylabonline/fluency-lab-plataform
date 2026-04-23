"use client";

import { useMemo, useState, useTransition } from "react";
import { Reorder, AnimatePresence } from "framer-motion";
import { LessonItemCard } from "./LessonItemCard";
import { AddLessonVault } from "./AddLessonVault";
import {
    reorderLessonsAction,
    addLessonToPlanAction,
    removeLessonFromPlanAction
} from "@/modules/learning/learning.actions";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";
import { Loader2, Save, AlertCircle, GripVertical } from "lucide-react";

interface Lesson {
    id: string;
    title: string;
    difficulty: string;
}

type LessonItem = Lesson & { uniqueKey: string };

interface PathEditorProps {
    plan: {
        id: string;
        name: string;
        lessons: Array<{
            lessonId: string;
            order: number;
            lesson: Lesson;
        }>;
    };
    availableLessons: Lesson[];
}

// 1. Helper function to keep our formatting logic clean
const formatLessons = (planLessons: PathEditorProps["plan"]["lessons"]): LessonItem[] => {
    return [...planLessons]
        .sort((a, b) => a.order - b.order)
        .map(l => ({ ...l.lesson, uniqueKey: l.lessonId }));
};

export function PathEditor({ plan, availableLessons }: PathEditorProps) {
    const t = useTranslations("Learning");
    const [isPending, startTransition] = useTransition();

    // 2. Generate a signature for the incoming props to know when they change
    // Incorporating both ID and order ensures we catch additions, removals, and external reorders
    const currentLessonsSig = plan.lessons.map(l => `${l.lessonId}-${l.order}`).join(',');

    // 3. Track the previous signature
    const [prevLessonsSig, setPrevLessonsSig] = useState(currentLessonsSig);

    // 4. Initialize our local editable state
    const [lessons, setLessons] = useState<LessonItem[]>(() => formatLessons(plan.lessons));

    // 5. The React-recommended way to sync state from props (No useEffect!)
    // If the props changed (e.g., a server action finished and revalidated data), 
    // we update the state immediately during the render phase.
    if (currentLessonsSig !== prevLessonsSig) {
        setPrevLessonsSig(currentLessonsSig);
        setLessons(formatLessons(plan.lessons));
    }

    const handleReorder = (newOrder: LessonItem[]) => {
        const prev = lessons;
        setLessons(newOrder);

        startTransition(async () => {
            const result = await reorderLessonsAction({
                planId: plan.id,
                lessonIds: newOrder.map(l => l.id)
            });

            if (!result?.data?.success) {
                setLessons(prev);
                notify.error("Failed to save new order");
            }
        });
    };

    const handleAddLesson = async (lessonId: string) => {
        const lessonToAdd = availableLessons.find(l => l.id === lessonId);
        if (!lessonToAdd) return;

        startTransition(async () => {
            const result = await addLessonToPlanAction({
                planId: plan.id,
                lessonId
            });

            if (result?.data?.success) {
                notify.success(t("lesson_added") || "Lesson added to plan");
            } else {
                notify.error(result?.serverError || "Failed to add lesson");
            }
        });
    };

    const handleRemoveLesson = (lessonId: string) => {
        startTransition(async () => {
            const result = await removeLessonFromPlanAction({
                planId: plan.id,
                lessonId
            });

            if (result?.data?.success) {
                notify.success(t("lesson_removed") || "Lesson removed from plan");
            } else {
                notify.error(result?.serverError || "Failed to remove lesson");
            }
        });
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...lessons];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;

        handleReorder(newOrder);
    };

    const filteredAvailable = useMemo(() =>
        availableLessons.filter(
            available => !lessons.some(planLesson => planLesson.id === available.id)
        ),
        [availableLessons, lessons]
    );

    return (
        <div className="space-y-8">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-3xl sticky top-20 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                        <span className="font-bold text-primary">{lessons.length}</span>
                        {t("lessons_count") || "Lessons in sequence"}
                    </div>
                    {isPending && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {t("saving") || "Saving changes..."}
                        </div>
                    )}
                </div>

                <AddLessonVault
                    availableLessons={filteredAvailable}
                    onAdd={handleAddLesson}
                    isAdding={isPending}
                />
            </div>

            {/* Path List */}
            <div className="space-y-4">
                {lessons.length > 0 ? (
                    <Reorder.Group
                        axis="y"
                        values={lessons}
                        onReorder={handleReorder}
                        className="space-y-3"
                    >
                        <AnimatePresence mode="popLayout">
                            {lessons.map((lesson, index) => (
                                <Reorder.Item
                                    key={lesson.uniqueKey}
                                    value={lesson}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <LessonItemCard
                                        lesson={lesson}
                                        order={index}
                                        isFirst={index === 0}
                                        isLast={index === lessons.length - 1}
                                        onMoveUp={() => moveStep(index, 'up')}
                                        onMoveDown={() => moveStep(index, 'down')}
                                        onRemove={() => handleRemoveLesson(lesson.id)}
                                    />
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>
                    </Reorder.Group>
                ) : (
                    <div className="py-20 flex flex-col items-center text-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-4">
                            <AlertCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">
                            {t("empty_path_title") || "No lessons in this path yet"}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs mb-6">
                            {t("empty_path_desc") || "Start building the learning sequence by adding lessons from the curriculum."}
                        </p>
                        <AddLessonVault
                            availableLessons={filteredAvailable}
                            onAdd={handleAddLesson}
                            isAdding={isPending}
                        />
                    </div>
                )}
            </div>

            {/* Footer Legend */}
            <div className="flex items-center justify-center gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">
                <span className="flex items-center gap-1.5">
                    <Save className="w-3 h-3" />
                    Auto-saving enabled
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span className="flex items-center gap-1.5">
                    <GripVertical className="w-3 h-3" />
                    Drag to reorder
                </span>
            </div>
        </div>
    );
}
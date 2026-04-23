"use client";

import { Badge } from "@/components/ui/badge";
import { 
    GripVertical, 
    Trash2, 
    ChevronUp, 
    ChevronDown,
    BookOpen,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonItemCardProps {
    lesson: {
        id: string;
        title: string;
        difficulty: string;
    };
    order: number;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
}

export function LessonItemCard({
    lesson,
    order,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onRemove
}: LessonItemCardProps) {
    return (
        <div className="group relative flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl hover:border-primary/30 transition-all">
            {/* Order & Drag Handle Placeholder */}
            <div className="flex items-center gap-3 text-gray-400">
                <span className="text-sm font-mono font-bold w-6 text-center">
                    {(order + 1).toString().padStart(2, '0')}
                </span>
                <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
            </div>

            {/* Lesson Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                        {lesson.title}
                    </h4>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-wider">
                        {lesson.difficulty}
                    </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Interactive Lesson
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~20 min
                    </span>
                </div>
            </div>

            {/* Reorder Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={isFirst}
                    onClick={onMoveUp}
                >
                    <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={isLast}
                    onClick={onMoveDown}
                >
                    <ChevronDown className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    onClick={onRemove}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

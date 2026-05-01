"use client";

import { CheckCircle2, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RoadmapLesson {
  lessonId: string;
  order: number;
  scheduledDate: Date | null;
  completedPracticeDays: number;
  isCompleted: boolean;
  status: "completed" | "current" | "future";
  lesson?: {
    title: string;
  };
}

interface RoadmapTimelineProps {
  lessons: RoadmapLesson[];
}

export function RoadmapTimeline({ lessons }: RoadmapTimelineProps) {
  return (
    <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {lessons.map((lesson) => {
        const isCurrent = lesson.status === "current";
        const isCompleted = lesson.status === "completed";
        const isFuture = lesson.status === "future";

        return (
          <div key={lesson.lessonId} className="relative">
            {/* Icon/Indicator */}
            <div
              className={cn(
                "absolute -left-[25px] top-1 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center z-10",
                isCompleted ? "bg-primary text-primary-foreground" :
                  isCurrent ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isCurrent ? (
                <Play className="w-4 h-4 fill-current" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>

            {/* Content Card */}
            <div
              className={cn(
                "p-4 rounded-xl border transition-all duration-200",
                isCurrent ? "bg-card border-primary shadow-sm ring-1 ring-primary/20" : "bg-card/50 border-border"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={cn("font-bold text-base", isFuture && "text-muted-foreground")}>
                    {lesson.lesson?.title || `Lição ${lesson.order + 1}`}
                  </h3>
                  {lesson.scheduledDate && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(lesson.scheduledDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                  )}
                </div>
                {isCurrent && (
                  <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Atual
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-muted-foreground">
                  <span>Prática Adaptativa</span>
                  <span>{lesson.completedPracticeDays}/6 Dias</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(lesson.completedPracticeDays / 6) * 100}%` }}
                  />
                </div>
              </div>

              {isCurrent && (
                <Button className="w-full mt-4 h-9 text-xs font-bold gap-2" size="sm">
                  Continuar Prática
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

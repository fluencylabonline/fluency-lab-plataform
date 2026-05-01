"use client";

import { cn } from "@/lib/utils";
import { Check, Clock, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StudentPracticeProgressProps {
  completedDays: number; // 0 to 6
  isOverdue?: boolean;
  className?: string;
}

export function StudentPracticeProgress({ completedDays, isOverdue, className }: StudentPracticeProgressProps) {
  const days = [1, 2, 3, 4, 5, 6];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
        <span>Progresso do Ciclo</span>
        <span>{completedDays}/6 Dias</span>
      </div>

      <div className="flex gap-1.5 h-8">
        <TooltipProvider>
          {days.map((day) => {
            const isCompleted = day <= completedDays;
            const isCurrent = day === completedDays + 1;

            return (
              <Tooltip key={day}>
                <TooltipTrigger>
                  <div
                    className={cn(
                      "flex-1 rounded-md flex items-center justify-center transition-all border-2",
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent && isOverdue
                          ? "bg-destructive/10 border-destructive text-destructive animate-pulse"
                          : isCurrent
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-secondary border-secondary text-muted-foreground/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : isCurrent && isOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <span className="text-[10px] font-black">{day}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">Dia {day}</p>
                  <p className="text-xs">
                    {isCompleted
                      ? "Concluído"
                      : isCurrent && isOverdue
                        ? "Atrasado!"
                        : isCurrent
                          ? "Pendente hoje"
                          : "Futuro"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}

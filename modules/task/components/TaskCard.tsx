"use client";

import { TaskWithAssignees } from "@/modules/task/task.types";
import { TaskStatus } from "@/modules/task/task.schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Repeat, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TaskDetailVault } from "./TaskDetailVault";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { completeTaskAction } from "@/modules/task/task.actions";
import { notify } from "@/components/ui/toaster";
import { useSWRConfig } from "swr";

interface TaskCardProps {
  task: TaskWithAssignees;
  mode: "list" | "kanban";
  onMove?: (direction: "prev" | "next") => void;
  isFirst?: boolean;
  isLast?: boolean;
  initialInboxStatuses?: TaskStatus[];
}

export function TaskCard({ 
  task, 
  mode, 
  onMove, 
  isFirst, 
  isLast,
  initialInboxStatuses = [] 
}: TaskCardProps) {
  const t = useTranslations("Tasks");
  const { mutate } = useSWRConfig();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [manualDone, setManualDone] = useState<boolean | null>(null);

  const isOptimisticDone = manualDone !== null ? manualDone : !!task.status?.isFinal;

  const formattedDate = task.dueDate 
    ? format(new Date(task.dueDate), "dd 'de' MMM, HH:mm", { locale: ptBR })
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && isOptimisticDone !== true;

  const handleToggleComplete = async (checked: boolean) => {
    if (!checked || isPending) return;

    setIsPending(true);
    setManualDone(true);
    
    const promise = completeTaskAction({ id: task.id });

    notify.promise(promise, {
      loading: t("markingAsCompleted"),
      success: (result) => {
        if (result?.data?.success) {
        const projectKey = task.projectId ? ["tasks", task.projectId] : "tasks-inbox";
        mutate(projectKey);
        mutate("tasks-inbox"); // Always good to revalidate inbox if it was something related to it
          setTimeout(() => setIsPending(false), 1000);
          return t("taskCompleted");
        }
        throw new Error(result?.data?.error || t("errorCompletingTask"));
      },
      error: (err: unknown) => {
        setManualDone(false);
        setIsPending(false);
        return (err as Error).message || t("errorCompletingTask");
      },
    });
  };

  return (
    <>
      <div 
        onClick={() => setIsDetailOpen(true)}
        className={cn(
          "bg-card text-card-foreground p-4 border rounded-xl cursor-pointer transition-all active:scale-[0.98]",
          mode === "list" ? "flex items-center gap-4 mb-2" : "flex flex-col gap-3 mb-2",
          "hover:border-primary/50",
          isOptimisticDone && "opacity-60 bg-muted/30"
        )}
      >
        {mode === "list" && (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={isOptimisticDone} 
              onCheckedChange={handleToggleComplete}
              disabled={isOptimisticDone}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "font-semibold text-sm leading-tight line-clamp-2 transition-all",
              isOptimisticDone && "text-muted-foreground line-through decoration-primary/30"
            )}>
              {task.title}
            </h4>
            {task.isRecurring && (
              <Repeat className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {formattedDate && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}>
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </div>
            )}

            <div className="flex -space-x-2">
              {task.assignees.slice(0, 3).map((assignee) => (
                <Avatar key={assignee.user.id} className="w-5 h-5 border-2 border-background">
                  <AvatarImage src={assignee.user.photoUrl || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {assignee.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-background">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>

        {mode === "kanban" && onMove && (
          <div className="pt-3 mt-3 border-t flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isFirst}
              className="h-8 text-[10px] gap-1 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onMove("prev");
              }}
            >
              <ArrowLeft className="w-3 h-3" />
              {t("back")}
            </Button>
            <Button
              variant={isLast ? "outline" : "secondary"}
              size="sm"
              className={cn("h-8 text-[10px] gap-1 px-2", isLast && "text-muted-foreground")}
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                onMove("next");
              }}
            >
              {isLast ? (
                <>
                  <Check className="w-3 h-3" />
                  {t("finished")}
                </>
              ) : (
                <>
                  {t("advance")}
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <TaskDetailVault 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
        task={task} 
        initialInboxStatuses={initialInboxStatuses}
      />
    </>
  );
}

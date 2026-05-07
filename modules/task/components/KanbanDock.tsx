"use client";

import { TaskStatus } from "@/modules/task/task.schema";
import { cn } from "@/lib/utils";
import { ClipboardList, CheckCircle2, Circle } from "lucide-react";

interface KanbanDockProps {
  statuses: TaskStatus[];
  activeId: string;
  onSelect: (id: string) => void;
  taskCounts: Record<string, number>;
}

export function KanbanDock({ statuses, activeId, onSelect, taskCounts }: KanbanDockProps) {
  const getIcon = (status: TaskStatus) => {
    if (status.isDefault) return <Circle className="w-5 h-5" />;
    if (status.isFinal) return <CheckCircle2 className="w-5 h-5" />;
    return <ClipboardList className="w-5 h-5" />;
  };

  return (
    <div className="fixed bottom-10 left-0 right-0 z-10 px-4 pb-6 pt-2 bg-linear-to-t from-background via-background to-transparent pointer-events-none md:hidden">
      <div className="max-w-md mx-auto bg-background/80 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-1.5 flex items-center justify-between pointer-events-auto">
        {statuses.map((status) => {
          const isActive = activeId === status.id;
          const count = taskCounts[status.id] || 0;
          
          return (
            <button
              key={status.id}
              onClick={() => onSelect(status.id)}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200",
                isActive ? "bg-primary text-primary-foreground shadow-lg scale-105" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <div className="relative">
                {getIcon(status)}
                {count > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full border",
                    isActive ? "bg-background text-primary border-primary" : "bg-primary text-primary-foreground border-background"
                  )}>
                    {count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 truncate max-w-[60px]">
                {status.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

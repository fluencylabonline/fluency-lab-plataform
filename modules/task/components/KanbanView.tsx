"use client";

import { useState, useMemo } from "react";
import { TaskProjectWithStatuses, TaskWithAssignees } from "@/modules/task/task.types";
import { TaskStatus } from "@/modules/task/task.schema";
import { TaskCard } from "./TaskCard";
import { KanbanDock } from "./KanbanDock";

import { useTranslations } from "next-intl";
import { moveTaskAction } from "@/modules/task/task.actions";
import { notify } from "@/components/ui/toaster";
import { useSWRConfig } from "swr";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@shimmer-from-structure/react";
import { motion, AnimatePresence } from "framer-motion";

interface KanbanViewProps {
  tasks: TaskWithAssignees[];
  isLoading: boolean;
  project: TaskProjectWithStatuses | null;
  inboxStatuses: TaskStatus[];
}

export function KanbanView({ tasks, isLoading, project, inboxStatuses }: KanbanViewProps) {
  const t = useTranslations("Tasks");
  const { mutate } = useSWRConfig();
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);

  const statuses = useMemo(() => {
    if (project?.statuses && project.statuses.length > 0) {
      return project.statuses;
    }
    
    if (!project && inboxStatuses && inboxStatuses.length > 0) {
      return inboxStatuses;
    }

    // Default statuses if no project or no statuses defined
    return [
      { id: "todo", name: t("todo"), color: "#94a3b8", order: 0 },
      { id: "doing", name: t("doing"), color: "#3b82f6", order: 1 },
      { id: "done", name: t("done"), color: "#10b981", order: 2 },
    ] as TaskStatus[];
  }, [project, inboxStatuses, t]);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, TaskWithAssignees[]> = {};
    statuses.forEach(s => map[s.id] = []);
    tasks.forEach(task => {
      if (task.statusId && map[task.statusId]) {
        map[task.statusId].push(task);
      } else if (statuses[0]) {
        map[statuses[0].id].push(task);
      }
    });
    return map;
  }, [tasks, statuses]);

  const handleMove = async (taskId: string, direction: "prev" | "next") => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentIndex = statuses.findIndex(s => s.id === task.statusId);
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex < 0 || nextIndex >= statuses.length) return;

    const targetStatusId = statuses[nextIndex].id;

    const promise = moveTaskAction({ id: taskId, statusId: targetStatusId });

    notify.promise(promise, {
      loading: t("movingTask"),
      success: (result) => {
        if (result?.data?.success) {
          mutate(project?.id ? ["tasks", project.id] : "tasks-inbox");
          return t("taskMoved");
        }
        throw new Error(result?.data?.error || t("moveError"));
      },
      error: (err: unknown) => (err as Error).message || t("moveError"),
    });
  };

  const mockTasks = Array(3).fill({
    id: "mock",
    title: "Loading task...",
    assignees: [],
    statusId: "todo",
  } as unknown as TaskWithAssignees);

  return (
    <Shimmer loading={isLoading && tasks.length === 0} templateProps={{ tasks: mockTasks }}>
      <div className="h-full flex flex-col relative">
        {/* Desktop View */}
        <div className="hidden md:flex flex-1 overflow-x-auto p-4 gap-4 items-start h-full custom-scrollbar">
          {statuses.map((status) => (
            <div key={status.id} className="w-80 shrink-0 flex flex-col max-h-full bg-muted/20 rounded-md border border-border/50 backdrop-blur-sm">
              <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur rounded-t-xl z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ backgroundColor: status.color || "gray" }} />
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{status.name}</h3>
                  <span className="text-[10px] font-bold text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
                    {tasksByStatus[status.id]?.length || 0}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {tasksByStatus[status.id]?.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                        <TaskCard 
                          task={task} 
                          mode="kanban"
                          onMove={(dir) => handleMove(task.id, dir)}
                          isFirst={status.id === statuses[0].id}
                          isLast={status.id === statuses[statuses.length - 1].id}
                          initialInboxStatuses={inboxStatuses}
                        />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {tasksByStatus[status.id]?.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md opacity-20">
                    <p className="text-xs font-medium">{t("dropHere") || "Empty"}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View: Focus & Dock */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-muted/30 border-b backdrop-blur-md">
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={activeStatusIndex === 0}
              onClick={() => setActiveStatusIndex(i => Math.max(0, i - 1))}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-0.5">
                {t("column") || "Column"} {activeStatusIndex + 1}/{statuses.length}
              </span>
              <h2 className="font-bold text-sm tracking-tight">{statuses[activeStatusIndex].name}</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={activeStatusIndex === statuses.length - 1}
              onClick={() => setActiveStatusIndex(i => Math.min(statuses.length - 1, i + 1))}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={statuses[activeStatusIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {tasksByStatus[statuses[activeStatusIndex].id]?.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      mode="kanban"
                      onMove={(dir) => handleMove(task.id, dir)}
                      isFirst={activeStatusIndex === 0}
                      isLast={activeStatusIndex === statuses.length - 1}
                      initialInboxStatuses={inboxStatuses}
                    />
                ))}
                {tasksByStatus[statuses[activeStatusIndex].id]?.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/40 italic">
                    <p className="text-sm">{t("noTasksInColumn")}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <KanbanDock 
            statuses={statuses} 
            activeId={statuses[activeStatusIndex].id} 
            onSelect={(id) => setActiveStatusIndex(statuses.findIndex(s => s.id === id))}
            taskCounts={Object.fromEntries(Object.entries(tasksByStatus).map(([id, list]) => [id, list.length]))}
          />
        </div>
      </div>
    </Shimmer>
  );
}

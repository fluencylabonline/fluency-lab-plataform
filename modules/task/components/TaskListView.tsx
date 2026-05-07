"use client";

import { useMemo, useState } from "react";
import { TaskWithAssignees } from "@/modules/task/task.types";
import { TaskStatus } from "@/modules/task/task.schema";
import { TaskCard } from "./TaskCard";
import { EmptyResults } from "@/components/ui/empty";
import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shimmer } from "@shimmer-from-structure/react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "@/components/ui/search-bar";

interface TaskListViewProps {
  tasks: TaskWithAssignees[];
  isLoading: boolean;
  initialInboxStatuses: TaskStatus[];
}

export function TaskListView({ tasks, isLoading, initialInboxStatuses }: TaskListViewProps) {
  const t = useTranslations("Tasks");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  }, [tasks, search]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, { name: string; tasks: TaskWithAssignees[] }> = {};
    
    filteredTasks.forEach(task => {
      const statusId = task.statusId || "unassigned";
      const statusName = task.status?.name || t("unassigned");
      
      if (!groups[statusId]) {
        groups[statusId] = { name: statusName, tasks: [] };
      }
      groups[statusId].tasks.push(task);
    });

    return Object.entries(groups).sort((a, b) => {
      // Sort by status order if available
      const statusA = a[1].tasks[0].status;
      const statusB = b[1].tasks[0].status;
      return (statusA?.order || 0) - (statusB?.order || 0);
    });
  }, [filteredTasks, t]);

  const mockTasks = Array(5).fill({
    id: "mock",
    title: "Loading task title...",
    assignees: [],
    statusId: "mock",
  } as unknown as TaskWithAssignees);

  const allGroups = useMemo(() => groupedTasks.map(g => g[0]), [groupedTasks]);
  const [openItems, setOpenItems] = useState<string[]>(allGroups);
  const [prevGroups, setPrevGroups] = useState<string[]>(allGroups);

  // Synchronize open items when allGroups change to ensure visibility
  if (allGroups !== prevGroups) {
    setPrevGroups(allGroups);
    const hasNewGroups = allGroups.some(id => !openItems.includes(id));
    if (hasNewGroups) {
      setOpenItems(prev => Array.from(new Set([...prev, ...allGroups])));
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="max-w-md">
        <SearchBar 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder={t("searchPlaceholder")}
        />
      </div>

      <Shimmer loading={isLoading && tasks.length === 0} templateProps={{ tasks: mockTasks }}>
        {filteredTasks.length === 0 && !isLoading ? (
          <EmptyResults title={t("noTasksFound")} description={t("tryDifferentSearch")} />
        ) : (
          <Accordion 
            multiple
            value={openItems} 
            onValueChange={setOpenItems} 
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {groupedTasks.map(([statusId, group]) => (
                <motion.div
                  key={statusId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccordionItem value={statusId} className="border rounded-xl px-4 overflow-hidden bg-card/50 backdrop-blur-sm">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">{group.name}</span>
                        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                          {group.tasks.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-3">
                      {group.tasks.map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          mode="list" 
                          initialInboxStatuses={initialInboxStatuses}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </Accordion>
        )}
      </Shimmer>
    </div>
  );
}

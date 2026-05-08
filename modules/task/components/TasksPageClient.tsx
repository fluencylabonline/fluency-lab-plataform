"use client";

import { useState, useMemo } from "react";
import { ProjectSidebar } from "./ProjectSidebar";
import { TaskListView } from "./TaskListView";
import { KanbanView } from "./KanbanView";
import { CreateTaskVault } from "./CreateTaskVault";
import { useTasksByProject } from "@/hooks/useTasksByProject";
import { TaskProjectWithStatuses, TaskWithAssignees } from "@/modules/task/task.types";
import { TaskStatus } from "@/modules/task/task.schema";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid, Plus, Menu } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Vault, VaultContent, VaultHeader, VaultTitle } from "@/components/ui/vault";
import { cn } from "@/lib/utils";

interface TasksPageClientProps {
  initialProjects: TaskProjectWithStatuses[];
  initialTasks: TaskWithAssignees[];
  initialInboxStatuses: TaskStatus[];
}

export function TasksPageClient({ initialProjects, initialTasks, initialInboxStatuses }: TasksPageClientProps) {
  const t = useTranslations("Tasks");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [isCreateVaultOpen, setIsCreateVaultOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { data: tasksResult, isLoading } = useTasksByProject(selectedProjectId);
  
  const tasks = tasksResult?.data?.data || (selectedProjectId === null ? initialTasks : []);
  const projects = initialProjects;
  
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId) || null
  , [projects, selectedProjectId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <ProjectSidebar 
          projects={projects}
          selectedId={selectedProjectId}
          onSelect={setSelectedProjectId}
          className={cn(
            "hidden md:flex w-64 border-r transition-all duration-300",
            !isSidebarOpen && "w-0 opacity-0 border-r-0 overflow-hidden pointer-events-none"
          )}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="p-4 border-b flex items-center justify-between gap-4 bg-background/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2 overflow-hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden shrink-0"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setIsMobileSidebarOpen(true);
                }}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold truncate">
                {selectedProject?.name || t("inbox")}
              </h1>
              <Tabs value={view} onValueChange={(v) => setView(v as "list" | "kanban")} className="hidden sm:block ml-2">
                <TabsList className="h-8">
                  <TabsTrigger value="list" className="gap-2 h-7 px-3">
                    <List className="w-3.5 h-3.5" />
                    <span className="text-xs">{t("listView")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="gap-2 h-7 px-3">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="text-xs">{t("kanbanView")}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="sm:hidden text-muted-foreground"
                onClick={() => setView(view === "list" ? "kanban" : "list")}
              >
                {view === "list" ? <LayoutGrid className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </Button>
              <Button 
                onClick={(e) => {
                  e.currentTarget.blur();
                  setIsCreateVaultOpen(true);
                }} 
                size="sm" 
                variant="ghost"
              >
                <Plus className="w-5 h-5 text-primary" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {view === "list" ? (
              <TaskListView 
                tasks={tasks} 
                isLoading={isLoading} 
                initialInboxStatuses={initialInboxStatuses}
              />
            ) : (
              <KanbanView 
                tasks={tasks} 
                isLoading={isLoading} 
                project={selectedProject}
                inboxStatuses={initialInboxStatuses}
              />
            )}
          </div>
        </div>
      </div>

      <Vault 
        open={isMobileSidebarOpen} 
        onOpenChange={setIsMobileSidebarOpen}
      >
        <VaultContent>
          <VaultHeader>
            <VaultTitle>{t("projects") || "Projetos"}</VaultTitle>
          </VaultHeader>
          <div className="p-4">
            <ProjectSidebar 
              projects={projects}
              selectedId={selectedProjectId}
              onSelect={(id) => {
                setSelectedProjectId(id);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full border-none bg-transparent"
              hideTitle={true}
            />
          </div>
        </VaultContent>
      </Vault>

      <CreateTaskVault 
        open={isCreateVaultOpen} 
        onOpenChange={setIsCreateVaultOpen}
        projectId={selectedProjectId}
        projects={projects}
        initialInboxStatuses={initialInboxStatuses}
      />
    </div>
  );
}

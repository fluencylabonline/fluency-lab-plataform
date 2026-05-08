"use client";

import { TaskProjectWithStatuses } from "@/modules/task/task.types";
import { cn } from "@/lib/utils";
import { Inbox, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreateProjectVault } from "./CreateProjectVault";
import { ManageStatusesVault } from "./ManageStatusesVault";

interface ProjectSidebarProps {
  projects: TaskProjectWithStatuses[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
  hideTitle?: boolean;
}

export function ProjectSidebar({ projects, selectedId, onSelect, className, hideTitle }: ProjectSidebarProps) {
  const t = useTranslations("Tasks");
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TaskProjectWithStatuses | null>(null);

  return (
    <aside className={cn("flex flex-col", className)}>
      {!hideTitle && (
        <div className="p-4 border-b">
          <h2 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground/70">
            {t("projects")}
          </h2>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all active:scale-[0.98]",
            selectedId === null 
              ? "bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20" 
              : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
          )}
        >
          <Inbox className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{t("inbox")}</span>
        </button>

        {projects.map((project) => (
          <div key={project.id} className="group relative">
            <button
              onClick={() => onSelect(project.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all pr-12 active:scale-[0.98]",
                selectedId === project.id 
                  ? "text-white font-semibold shadow-lg" 
                  : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              )}
              style={selectedId === project.id ? { 
                backgroundColor: project.color || "var(--primary)",
                boxShadow: `0 10px 15px -3px ${project.color ? `${project.color}33` : 'rgba(var(--primary), 0.2)'}`
              } : {}}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20" 
                style={{ backgroundColor: project.color || "var(--primary)" }} 
              />
              <span className="truncate flex-1 text-left">{project.name}</span>
            </button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity rounded-lg hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setEditingProject(project);
              }}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t mt-auto">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 h-11 rounded-xl border-dashed hover:border-primary hover:text-primary transition-all bg-transparent"
          onClick={() => setIsCreateProjectOpen(true)}
        >
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium">{t("addProject")}</span>
        </Button>
      </div>

      <CreateProjectVault 
        open={isCreateProjectOpen} 
        onOpenChange={setIsCreateProjectOpen} 
      />

      {editingProject && (
        <ManageStatusesVault
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          project={editingProject}
        />
      )}
    </aside>
  );
}

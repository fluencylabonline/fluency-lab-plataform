"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { 
  Vault, 
  VaultContent, 
  VaultHeader, 
  VaultTitle, 
  VaultDescription,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultIcon
} from "@/components/ui/vault";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { createStatusSchema, CreateStatusValues } from "@/modules/task/task.schema";
import { 
  createStatusAction, 
  reorderStatusesAction, 
  deleteProjectAction 
} from "@/modules/task/task.actions";
import { TaskProjectWithStatuses } from "@/modules/task/task.types";
import { Loader2, Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

interface ManageStatusesVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: TaskProjectWithStatuses;
}

export function ManageStatusesVault({ open, onOpenChange, project }: ManageStatusesVaultProps) {
  const t = useTranslations("Tasks");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<CreateStatusValues>({
    resolver: zodResolver(createStatusSchema),
    defaultValues: {
      name: "",
      projectId: project.id,
      color: "#ccc",
      order: project.statuses.length,
      isDefault: false,
      isFinal: false,
    },
  });

  const onAddStatus = async (values: CreateStatusValues) => {
    await notify.promise(createStatusAction(values), {
      loading: t("notifications.addingStatus"),
      success: (result) => {
        if (!result?.data?.success) throw new Error(result?.data?.error || t("notifications.error"));
        
        form.reset({
          name: "",
          projectId: project.id,
          color: "#ccc",
          order: project.statuses.length + 1,
          isDefault: false,
          isFinal: false,
        });
        return t("notifications.statusAdded");
      },
      error: (err: unknown) => (err as Error).message || t("notifications.error"),
    });
  };

  const onMoveStatus = async (index: number, direction: "up" | "down") => {
    const newStatuses = [...project.statuses];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newStatuses.length) return;

    const [moved] = newStatuses.splice(index, 1);
    newStatuses.splice(targetIndex, 0, moved);

    await notify.promise(reorderStatusesAction({
      projectId: project.id,
      statusIds: newStatuses.map(s => s.id),
    }), {
      loading: t("notifications.reordering"),
      success: (result) => {
        if (!result?.data?.success) throw new Error(result?.data?.error || t("notifications.error"));
        return t("notifications.reordered");
      },
      error: (err: unknown) => (err as Error).message || t("notifications.error"),
    });
  };

  const onDeleteProject = async () => {
    await notify.promise(deleteProjectAction({ id: project.id }), {
      loading: t("notifications.deletingProject"),
      success: (result) => {
        if (!result?.data?.success) throw new Error(result?.data?.error || t("notifications.error"));
        setShowDeleteConfirm(false);
        onOpenChange(false);
        return t("notifications.projectDeleted");
      },
      error: (err: unknown) => (err as Error).message || t("notifications.error"),
    });
  };

  return (<>
    <Vault 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <VaultContent>
        <VaultHeader>
          <VaultTitle>{t("manageProject", { name: project.name })}</VaultTitle>
          <VaultDescription>{t("manageProjectDescription")}</VaultDescription>
        </VaultHeader>
      <div className="space-y-8">
        {/* Project Info Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("projectSettings")}
            </h3>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("deleteProject")}
            </Button>
          </div>
        </section>

        {/* Statuses Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("columns")}
          </h3>
          
          <div className="space-y-2">
            {project.statuses.map((status, index) => (
              <div 
                key={status.id} 
                className="flex items-center gap-3 p-3 border rounded-lg bg-background group"
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: status.color || "#ccc" }} 
                />
                <span className="flex-1 font-medium">{status.name}</span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8"
                    disabled={index === 0}
                    onClick={() => onMoveStatus(index, "up")}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8"
                    disabled={index === project.statuses.length - 1}
                    onClick={() => onMoveStatus(index, "down")}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                {status.isDefault && (
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {t("default")}
                  </span>
                )}
                {status.isFinal && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {t("final")}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2 pt-2">
            <Field 
              label={t("statusName")}
              className="flex-1"
              error={form.formState.errors.name?.message}
            >
              <Input 
                placeholder={t("newStatusPlaceholder")} 
                {...form.register("name")} 
              />
            </Field>
            <Button 
              onClick={form.handleSubmit(onAddStatus)}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="ml-2 hidden sm:inline">{t("add")}</span>
            </Button>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </div>
      </div>
    </VaultContent>
  </Vault>

  <Vault open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
    <VaultContent>
      <VaultHeader>
        <VaultIcon type="delete" />
        <VaultTitle>{t("confirmDeleteProject")}</VaultTitle>
        <VaultDescription>{t("deleteProjectWarning") || "Esta ação não pode ser desfeita."}</VaultDescription>
      </VaultHeader>
      
      <VaultFooter>
        <VaultSecondaryButton onClick={() => setShowDeleteConfirm(false)}>
          {t("cancel") || "Cancelar"}
        </VaultSecondaryButton>
        <VaultPrimaryButton 
          variant="destructive" 
          onClick={onDeleteProject}
        >
          {t("delete") || "Excluir"}
        </VaultPrimaryButton>
      </VaultFooter>
    </VaultContent>
  </Vault>
  </>
  );
}

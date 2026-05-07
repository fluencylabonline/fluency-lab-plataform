"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useMemo } from "react";
import { 
  Vault, 
  VaultContent, 
  VaultHeader, 
  VaultTitle, 
  VaultDescription, 
  VaultIcon, 
  VaultFooter, 
  VaultPrimaryButton, 
  VaultSecondaryButton 
} from "@/components/ui/vault";
import { User } from "@/modules/user/user.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CalendarVault } from "@/components/ui/calendar";
import { updateTaskSchema, UpdateTaskValues, TaskStatus } from "@/modules/task/task.schema";
import { updateTaskAction, deleteTaskAction, getAssignableUsersAction, getProjectsAction } from "@/modules/task/task.actions";
import { TaskWithAssignees, TaskProjectWithStatuses } from "@/modules/task/task.types";
import { useSWRConfig } from "swr";
import { Loader2, Trash2 } from "lucide-react";

interface TaskDetailVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithAssignees;
  initialInboxStatuses?: TaskStatus[];
}

export function TaskDetailVault({ open, onOpenChange, task, initialInboxStatuses = [] }: TaskDetailVaultProps) {
  const t = useTranslations("Tasks");
  const { mutate } = useSWRConfig();
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<TaskProjectWithStatuses[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const form = useForm<UpdateTaskValues>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      id: task.id,
      title: task.title,
      description: task.description || "",
      projectId: task.projectId || undefined,
      statusId: task.statusId || undefined,
      isRecurring: task.isRecurring,
      recurringCycle: task.recurringCycle,
      assigneeIds: task.assignees.map(a => a.user.id),
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    },
  });

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [usersRes, projectsRes] = await Promise.all([
            getAssignableUsersAction(),
            getProjectsAction()
          ]);
          
          if (usersRes?.data?.success) setAssignableUsers(usersRes.data.data);
          if (projectsRes?.data?.success) setProjects(projectsRes.data.data);
        } catch {
          console.error("Failed to fetch data");
        }
      };
      void fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (open && task) {
      form.reset({
        id: task.id,
        title: task.title,
        description: task.description || "",
        projectId: task.projectId || undefined,
        statusId: task.statusId || undefined,
        isRecurring: task.isRecurring,
        recurringCycle: task.recurringCycle,
        assigneeIds: task.assignees.map(a => a.user.id),
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      });
    }
  }, [open, task, form]);

  const onSubmit = async (values: UpdateTaskValues) => {
    // Optimistic Update for current project tasks
    const projectKey = task.projectId ? ["tasks", task.projectId] : "tasks-inbox";
    
    await notify.promise(updateTaskAction(values), {
      loading: t("notifications.updatingTask"),
      success: (result) => {
        if (!result?.data?.success) throw new Error(result?.data?.error || t("notifications.error"));
        mutate(projectKey); // Revalidate current project
        if (values.projectId !== task.projectId) {
          // If project changed, revalidate target project too
          const targetKey = values.projectId ? ["tasks", values.projectId] : "tasks-inbox";
          mutate(targetKey);
        }
        onOpenChange(false);
        return t("notifications.taskUpdated");
      },
      error: (err: unknown) => (err as Error).message || t("notifications.error"),
    });
  };

  const handleDelete = async () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteConfirmOpen(false);
    
    // Optimistic Update
    const projectKey = task.projectId ? ["tasks", task.projectId] : "tasks-inbox";
    mutate(projectKey, (current: { data?: { data?: TaskWithAssignees[] } } | undefined) => {
      if (!current?.data?.data) return current;
      return {
        ...current,
        data: {
          ...current.data,
          data: current.data.data.filter((t: TaskWithAssignees) => t.id !== task.id)
        }
      };
    }, false);

    await notify.promise(deleteTaskAction({ id: task.id }), {
      loading: t("notifications.deletingTask"),
      success: (result) => {
        if (!result?.data?.success) {
          mutate(projectKey); // Rollback on error
          throw new Error(result?.data?.error || t("notifications.error"));
        }
        onOpenChange(false);
        return t("notifications.taskDeleted");
      },
      error: (err: unknown) => {
        mutate(projectKey); // Rollback on error
        return (err as Error).message || t("notifications.error");
      },
    });
  };

  const watchProjectId = useWatch({
    control: form.control,
    name: "projectId"
  });

  const watchIsRecurring = useWatch({
    control: form.control,
    name: "isRecurring"
  });

  const statuses = useMemo(() => {
    const project = projects.find(p => p.id === watchProjectId);
    return project ? project.statuses : initialInboxStatuses;
  }, [projects, watchProjectId, initialInboxStatuses]);

  return (
    <Vault 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <VaultContent>
        <VaultHeader>
          <VaultTitle>{t("taskDetail")}</VaultTitle>
          <VaultDescription>{t("taskDetailDescription")}</VaultDescription>
        </VaultHeader>
        
        <div className="space-y-6">
          <Field 
            label={t("title")} 
            error={form.formState.errors.title?.message}
          >
            <Input placeholder={t("titlePlaceholder")} {...form.register("title")} />
          </Field>

          <Field 
            label={t("description")} 
            error={form.formState.errors.description?.message}
          >
            <Textarea 
              placeholder={t("descriptionPlaceholder")} 
              className="min-h-[100px]"
              {...form.register("description")} 
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <Field label={t("project")} error={form.formState.errors.projectId?.message}>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val === "none" ? null : val);
                      form.setValue("statusId", undefined);
                    }} 
                    value={field.value || undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectProject")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("noProject")}</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || "#ccc" }} />
                            {p.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="statusId"
              render={({ field }) => (
                <Field label={t("status")} error={form.formState.errors.statusId?.message}>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || "#ccc" }} />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <Field label={t("dueDate")} error={form.formState.errors.dueDate?.message} className="flex flex-col">
                  <CalendarVault
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    placeholder={t("pickADate")}
                    label={t("dueDate")}
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="assigneeIds"
              render={({ field }) => (
                <Field label={t("assignees")} error={form.formState.errors.assigneeIds?.message}>
                  <div className="space-y-2">
                    <Select 
                      onValueChange={(userId) => {
                        const currentValues = field.value || [];
                        if (!currentValues.includes(userId)) {
                          field.onChange([...currentValues, userId]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("addAssignee")} />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.value?.map((userId) => {
                        const user = assignableUsers.find(u => u.id === userId);
                        return (
                          <Badge key={userId} variant="secondary" className="gap-1">
                            {user?.name || userId}
                            <button 
                              type="button"
                              className="ml-1 hover:text-destructive"
                              onClick={() => field.onChange((field.value || []).filter(id => id !== userId))}
                            >
                              &times;
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </Field>
              )}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <span className="text-base font-medium">{t("isRecurring")}</span>
              <div className="text-sm text-muted-foreground">
                {t("isRecurringDescription")}
              </div>
            </div>
            <Controller
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {watchIsRecurring && (
            <Controller
              control={form.control}
              name="recurringCycle"
              render={({ field }) => (
                <Field label={t("recurringCycle")} error={form.formState.errors.recurringCycle?.message}>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectCycle")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t("daily")}</SelectItem>
                      <SelectItem value="weekly">{t("weekly")}</SelectItem>
                      <SelectItem value="biweekly">{t("biweekly")}</SelectItem>
                      <SelectItem value="monthly">{t("monthly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          )}

          <div className="flex items-center justify-between pt-4">
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("delete")}
            </Button>
            
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      </VaultContent>

      <Vault open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <VaultContent>
          <VaultHeader>
            <div className="flex justify-center mb-4">
              <VaultIcon type="delete" />
            </div>
            <VaultTitle className="text-center">{t("confirmDeleteTask")}</VaultTitle>
            <VaultDescription className="text-center">
              {t("deleteTaskDescription") || "Esta ação não pode ser desfeita."}
            </VaultDescription>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setIsDeleteConfirmOpen(false)}>
              {t("cancel")}
            </VaultSecondaryButton>
            <VaultPrimaryButton variant="destructive" onClick={confirmDelete}>
              {t("delete")}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </Vault>
  );
}

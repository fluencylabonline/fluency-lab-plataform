"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { Vault, VaultContent, VaultHeader, VaultTitle, VaultDescription, VaultFooter, VaultSecondaryButton, VaultPrimaryButton } from "@/components/ui/vault";
import { User } from "@/modules/user/user.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/components/ui/toaster";
import { createTaskSchema, CreateTaskValues, TaskStatus } from "@/modules/task/task.schema";
import { createTaskAction, getAssignableUsersAction } from "@/modules/task/task.actions";
import { TaskProjectWithStatuses, TaskWithAssignees } from "@/modules/task/task.types";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { CalendarVault } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useSWRConfig } from "swr";

interface CreateTaskVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  projects: TaskProjectWithStatuses[];
  initialInboxStatuses: TaskStatus[];
}

export function CreateTaskVault({ open, onOpenChange, projectId, projects, initialInboxStatuses }: CreateTaskVaultProps) {
  const { mutate } = useSWRConfig();
  const t = useTranslations("Tasks");
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: projectId || undefined,
      statusId: undefined,
      isRecurring: false,
      recurringCycle: null,
      assigneeIds: [],
      dueDate: null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        projectId: projectId || undefined,
        statusId: undefined,
        isRecurring: false,
        recurringCycle: null,
        assigneeIds: [],
        dueDate: null,
      });
      fetchUsers();
    }
  }, [open, projectId, form]);

  const fetchUsers = async () => {
    try {
      const result = await getAssignableUsersAction();
      if (result?.data?.success) {
        setAssignableUsers(result.data.data);
      }
    } catch {
      console.error("Failed to fetch users");
    } finally {
    }
  };

  const onSubmit = async (values: CreateTaskValues) => {
    const projectKey = values.projectId ? ["tasks", values.projectId] : "tasks-inbox";
    
    // Optimistic Update
    const optimisticTask = {
      id: "temp-" + Date.now(),
      title: values.title,
      description: values.description,
      statusId: values.statusId,
      projectId: values.projectId,
      dueDate: values.dueDate,
      isRecurring: values.isRecurring,
      assignees: [], 
      status: statuses.find(s => s.id === values.statusId),
    };

    mutate(projectKey, (current: { data?: { data?: TaskWithAssignees[] } } | undefined) => {
      if (!current?.data?.data) return current;
      return {
        ...current,
        data: {
          ...current.data,
          data: [optimisticTask as unknown as TaskWithAssignees, ...current.data.data]
        }
      };
    }, false);

    const promise = createTaskAction(values);

    notify.promise(promise, {
      loading: t("notifications.creatingTask") || "Criando tarefa...",
      success: (result) => {
        if (result?.data?.success) {
          mutate(projectKey); // Refresh to get the real ID and data
          onOpenChange(false);
          return t("notifications.taskCreated");
        }
        mutate(projectKey); // Rollback on error
        throw new Error(result?.data?.error || t("notifications.error"));
      },
      error: (err: unknown) => {
        mutate(projectKey); // Rollback on error
        return (err as Error).message || t("notifications.error");
      }
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
    const result = project ? project.statuses : initialInboxStatuses;
    return result || [];
  }, [projects, watchProjectId, initialInboxStatuses]);

  return (
    <Vault 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <VaultContent>
        <VaultHeader>
          <VaultTitle>{t("newTask")}</VaultTitle>
          <VaultDescription>{t("newTaskDescription")}</VaultDescription>
        </VaultHeader>
      <div className="space-y-6">
        <Field label={t("title")} error={form.formState.errors.title?.message} required>
          <Input placeholder={t("titlePlaceholder")} {...form.register("title")} />
        </Field>

        <Field label={t("description")} error={form.formState.errors.description?.message}>
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
              <Field label={t("dueDate")} error={form.formState.errors.dueDate?.message}>
                <CalendarVault
                  date={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date?.toISOString())}
                  placeholder={t("pickADate")}
                  label={t("dueDate")}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
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
                    {(field.value || []).map((userId) => {
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

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </VaultSecondaryButton>
          <VaultPrimaryButton onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("createTask")}
          </VaultPrimaryButton>
        </VaultFooter>
      </div>
    </VaultContent>
  </Vault>
  );
}

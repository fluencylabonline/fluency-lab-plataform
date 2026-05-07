"use client";
import { cn } from "@/lib/utils";

import { useForm, useWatch, Control, UseFormRegister, UseFormSetValue, FieldArrayWithId } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Vault, VaultContent, VaultHeader, VaultTitle, VaultDescription } from "@/components/ui/vault";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { createProjectSchema, CreateProjectValues } from "@/modules/task/task.schema";
import { createProjectAction } from "@/modules/task/task.actions";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { Field } from "@/components/ui/field";
import { useFieldArray } from "react-hook-form";

interface CreateProjectVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", 
  "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899",
  "#71717a", "#000000"
];

interface StatusItemProps {
  index: number;
  control: Control<CreateProjectValues>;
  register: UseFormRegister<CreateProjectValues>;
  setValue: UseFormSetValue<CreateProjectValues>;
  remove: (index: number) => void;
  allFields: FieldArrayWithId<CreateProjectValues, "statuses">[];
  t: (key: string) => string;
}

function StatusItem({ index, control, register, setValue, remove, allFields, t }: StatusItemProps) {
  const color = useWatch({ control, name: `statuses.${index}.color` });
  const isDefault = useWatch({ control, name: `statuses.${index}.isDefault` });
  const isFinal = useWatch({ control, name: `statuses.${index}.isFinal` });

  return (
    <div className="flex items-center gap-2 group animate-in fade-in slide-in-from-top-2">
      <GripVertical className="w-4 h-4 text-muted-foreground/30" />
      <div className="flex-1 flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-transparent focus-within:border-primary/50 transition-all">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 overflow-x-auto max-w-[80px] no-scrollbar py-1">
            {COLORS.slice(0, 5).map(c => (
              <button
                key={c}
                type="button"
                className={cn(
                  "w-3 h-3 rounded-full shrink-0 ring-offset-1 transition-all",
                  color === c ? "ring-1 ring-primary scale-110" : "hover:scale-110"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setValue(`statuses.${index}.color`, c)}
              />
            ))}
          </div>
          <Input 
            {...register(`statuses.${index}.name`)} 
            placeholder={t("columnName")}
            className="border-none bg-transparent h-8 focus-visible:ring-0 px-1"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (!isDefault) {
                allFields.forEach((_, i) => setValue(`statuses.${i}.isDefault`, i === index));
              }
            }}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full transition-colors",
              isDefault 
                ? "bg-primary text-primary-foreground font-bold" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t("default")}
          </button>
          <button
            type="button"
            onClick={() => setValue(`statuses.${index}.isFinal`, !isFinal)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full transition-colors",
              isFinal 
                ? "bg-green-500 text-white font-bold" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t("final")}
          </button>
        </div>
      </div>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="w-8 h-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => remove(index)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function CreateProjectVault({ open, onOpenChange }: CreateProjectVaultProps) {
  const t = useTranslations("Tasks");

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      color: COLORS[0],
      icon: "hash",
      statuses: [
        { name: "Pendente", color: "#94a3b8", isDefault: true, isFinal: false },
        { name: "Em progresso", color: "#3b82f6", isDefault: false, isFinal: false },
        { name: "Concluído", color: "#10b981", isDefault: false, isFinal: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "statuses",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        color: COLORS[0],
        icon: "hash",
        statuses: [
          { name: "Pendente", color: "#94a3b8", isDefault: true, isFinal: false },
          { name: "Em progresso", color: "#3b82f6", isDefault: false, isFinal: false },
          { name: "Concluído", color: "#10b981", isDefault: false, isFinal: true },
        ],
      });
    }
  }, [open, form]);

  const watchColor = useWatch({
    control: form.control,
    name: "color"
  });

  const onSubmit = async (values: CreateProjectValues) => {
    const promise = createProjectAction(values);

    notify.promise(promise, {
      loading: t("notifications.creatingProject"),
      success: (result) => {
        if (result?.data?.success) {
          onOpenChange(false);
          return t("notifications.projectCreated");
        }
        throw new Error(result?.data?.error || t("notifications.error"));
      },
      error: (err: unknown) => {
        return (err as Error).message || t("notifications.error");
      }
    });
  };

  return (
    <Vault 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <VaultContent>
        <VaultHeader>
          <VaultTitle>{t("newProject")}</VaultTitle>
          <VaultDescription>{t("newProjectDescription")}</VaultDescription>
        </VaultHeader>
      <div className="space-y-6">
        <Field label={t("projectName")} error={form.formState.errors.name?.message} required>
          <Input placeholder={t("projectNamePlaceholder")} {...form.register("name")} />
        </Field>

        <Field label={t("projectColor")} error={form.formState.errors.color?.message}>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-8 h-8 rounded-full transition-all",
                  watchColor === color ? "scale-110 ring-2 ring-primary ring-offset-2" : "hover:scale-105"
                )}
                style={{ backgroundColor: color }}
                onClick={() => form.setValue("color", color)}
              />
            ))}
          </div>
        </Field>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("columns")}
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => append({ name: "", color: "#ccc", isDefault: false, isFinal: false })}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addColumn")}
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {fields.map((field, index) => (
              <StatusItem 
                key={field.id}
                index={index}
                control={form.control}
                register={form.register}
                setValue={form.setValue}
                remove={remove}
                allFields={fields}
                t={t}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("createProject")}
          </Button>
        </div>
      </div>
    </VaultContent>
  </Vault>
  );
}

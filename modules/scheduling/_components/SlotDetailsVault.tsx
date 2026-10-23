"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { format, isSameDay } from "date-fns";
import {
  Clock,
  User as UserIcon,
  ArrowRightLeft,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Info,
  BookOpen,
  Trash2,
  Edit2,
  AlertTriangle,
  Repeat,
} from "lucide-react";
import { useIsMobile } from "@/hooks/ui/use-device";
import { useUserStore } from "@/modules/user/user.store";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { notify } from "@/components/ui/toaster";
import {
  deleteSlotAction,
  updateSlotAction,
  checkSlotConflictAction,
  updateClassStatusAction,
} from "@/modules/scheduling/scheduling.actions";
import {
  ChangeClassTimeVault,
  type ChangeClassTimeTarget,
} from "@/modules/scheduling/_components/ChangeClassTimeVault";
import { updateSlotStatusSchema } from "@/modules/scheduling/scheduling.schema";
import { z } from "zod";
import { getLessonsAction } from "@/modules/curriculum/curriculum.actions";
import { CalendarEvent } from "@/components/ui/calendar-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultIcon,
} from "@/components/ui/vault";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarVault } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { LessonSummary } from "@/modules/curriculum/curriculum.types";

interface SlotDetailsVaultProps {
  teacherId: string;
  event: CalendarEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SlotDetailsVault({
  teacherId,
  event,
  isOpen,
  onOpenChange,
  onSuccess,
}: SlotDetailsVaultProps) {
  const t = useTranslations("UserManagement");
  const tClasses = useTranslations("ClassesCard");
  const tChangeTime = useTranslations("ChangeClassTime");
  const isMobile = useIsMobile();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteScope, setShowDeleteScope] = useState(false);
  const [showEditScope, setShowEditScope] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "delete" | "edit" | "status" | null;
    scope: "single" | "future" | null;
    pendingStatus?: string;
  }>({ isOpen: false, type: null, scope: null });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    editDate: new Date(),
    startTime: "",
    endTime: "",
    lessonTitle: "",
    lessonId: null as string | null,
    planId: null as string | null,
    planName: null as string | null,
  });

  const [conflict, setConflict] = useState<{
    kind: "teacher" | "student";
    startAt: Date;
    endAt: Date;
  } | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const [lessonsSearch, setLessonsSearch] = useState("");
  const [lessonsResults, setLessonsResults] = useState<LessonSummary[]>([]);
  const [isSearchingLessons, setIsSearchingLessons] = useState(false);
  const [editScope] = useState<"single">("single");
  const [showRetimeVault, setShowRetimeVault] = useState(false);

  const changeTimeTarget = useMemo<ChangeClassTimeTarget | null>(
    () =>
      event
        ? {
            id: event.id,
            ruleId: (event.ruleId as string | undefined) ?? null,
            teacherId,
            studentId: event.studentId ?? null,
            startAt: new Date(event.start),
            endAt: new Date(event.end || event.start),
          }
        : null,
    [event, teacherId],
  );

  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sync form when event changes or editing starts
  useEffect(() => {
    if (event && isOpen) {
      setEditForm({
        editDate: new Date(event.start),
        startTime: format(event.start, "HH:mm"),
        endTime: format(event.end || event.start, "HH:mm"),
        lessonTitle: event.location || "",
        lessonId: event.lessonId || null,
        planId: event.assignedPlanId || null,
        planName: event.location || null,
      });
      setCurrentStatus(event.status || "");
      setIsEditing(false);
    }
  }, [event, isOpen]);

  // Lessons search
  useEffect(() => {
    if (
      !lessonsSearch ||
      lessonsSearch.length < 2 ||
      !event?.studentId ||
      !event?.assignedPlanId
    ) {
      setLessonsResults([]);
      return;
    }

    const searchLessons = async () => {
      setIsSearchingLessons(true);
      try {
        const result = await getLessonsAction({
          search: lessonsSearch,
        });
        if (result?.data) {
          setLessonsResults(result.data);
        }
      } catch (err) {
        console.error("Error searching lessons:", err);
      } finally {
        setIsSearchingLessons(false);
      }
    };

    const timer = setTimeout(searchLessons, 300);
    return () => clearTimeout(timer);
  }, [lessonsSearch, event]);

  // Conflict check
  useEffect(() => {
    if (!isEditing || !event || !editForm.startTime || !editForm.endTime) {
      setConflict(null);
      return;
    }

    const checkConflict = async () => {
      setIsCheckingConflict(true);
      try {
        // Use editDate as the base date (supports day changes in single scope)
        const start = new Date(editForm.editDate);
        const [sH, sM] = editForm.startTime.split(":").map(Number);
        start.setHours(sH, sM, 0, 0);

        const end = new Date(editForm.editDate);
        const [eH, eM] = editForm.endTime.split(":").map(Number);
        end.setHours(eH, eM, 0, 0);

        if (end <= start) {
          setConflict(null);
          return;
        }

        const result = await checkSlotConflictAction({
          teacherId,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          excludeSlotId: event.id,
          studentId: event.studentId,
        });

        const data = result?.data;
        if (data?.success && data.hasConflict && data.conflict) {
          setConflict({
            kind: data.conflict.kind,
            startAt: new Date(data.conflict.startAt),
            endAt: new Date(data.conflict.endAt),
          });
        } else {
          setConflict(null);
        }
      } catch (err) {
        console.error("Error checking conflict:", err);
      } finally {
        setIsCheckingConflict(false);
      }
    };

    const timer = setTimeout(checkConflict, 500);
    return () => clearTimeout(timer);
  }, [editForm.startTime, editForm.endTime, editForm.editDate, event, teacherId, isEditing]);

  const handleEditClick = () => {
    if (event?.isRecurring) {
      setShowEditScope(true);
    } else {
      setIsEditing(true);
    }
  };

  const requestEdit = () => {
    setShowEditScope(false);
    setIsEditing(true);
  };

  const openRetimeVault = () => {
    setShowEditScope(false);
    setShowRetimeVault(true);
  };

  const requestDelete = (scope: "single" | "future") => {
    setShowDeleteScope(false);
    setConfirmDialog({ isOpen: true, type: "delete", scope });
  };

  const handleSaveClick = () => {
    setConfirmDialog({ isOpen: true, type: "edit", scope: editScope });
  };

  // Professor só marca o que aconteceu na aula; admin/manager mantêm todas as opções.
  const isTeacherView = useUserStore((s) => s.user?.role) === "teacher";

  const statusConfig = useMemo(() => ({
    scheduled: {
      label: tClasses("scheduled"),
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
      icon: "📅"
    },
    completed: {
      label: isTeacherView ? "Aula dada" : tClasses("completed"),
      color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
      icon: "✅"
    },
    "canceled-student": {
      label: tClasses("canceled-student"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "❌"
    },
    "canceled-teacher": {
      label: isTeacherView ? "Cancelada por mim" : tClasses("canceled-teacher"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "❌"
    },
    "canceled-admin": {
      label: tClasses("canceled-admin"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "🛡️"
    },
    "canceled-credit": {
      label: tClasses("canceled-credit"),
      color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
      icon: "💳"
    },
    "no-show": {
      label: isTeacherView ? "Aluno faltou" : tClasses("no-show"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "👤"
    },
    rescheduled: {
      label: tClasses("rescheduled"),
      color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
      icon: "📅"
    },
    "teacher-recess": {
      label: tClasses("teacher-recess"),
      color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
      icon: "🏖️"
    },
    overdue: {
      label: tClasses("overdue"),
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
      icon: "⏰"
    },
  }), [tClasses, isTeacherView]);

  const handleStatusChange = async (status: string) => {
    if (!event) return;

    if (status === "canceled-teacher" || status === "no-show") {
      setConfirmDialog({
        isOpen: true,
        type: "status",
        scope: "single",
        pendingStatus: status
      });
      return;
    }

    // Direct update
    setIsUpdatingStatus(true);
    const toastId = "update-status-toast";
    notify.loading(tClasses("updatingStatus") || "Atualizando status...", undefined, toastId);

    try {
      const result = await updateClassStatusAction({
        classId: event.id,
        status: status as z.infer<typeof updateSlotStatusSchema>["status"]
      });

      if (result?.data?.success) {
        notify.success(tClasses("statusUpdated") || "Status atualizado!", undefined, toastId);
        setCurrentStatus(status);
        onSuccess();
      } else {
        notify.error(result?.data?.error || tClasses("statusUpdateError") || "Erro ao atualizar status", undefined, toastId);
      }
    } catch {
      notify.error(tClasses("statusUpdateError") || "Erro ao atualizar status", undefined, toastId);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!event || !confirmDialog.type || !confirmDialog.scope) return;

    if (confirmDialog.type === "delete") {
      setIsDeleting(true);
      try {
        const result = await deleteSlotAction({
          slotId: event.id,
          scope: confirmDialog.scope,
        });
        if (result?.data?.success) {
          notify.success(t("slotDeleted") || "Horário excluído com sucesso!");
          onOpenChange(false);
          onSuccess();
        } else {
          notify.error(
            result?.data?.error ||
              t("deleteError") ||
              "Erro ao excluir horário.",
          );
        }
      } catch {
        notify.error(t("deleteError") || "Erro ao excluir horário.");
      } finally {
        setIsDeleting(false);
        setConfirmDialog({ isOpen: false, type: null, scope: null });
      }
    } else if (confirmDialog.type === "status") {
      setIsUpdating(true);
      try {
        const result = await updateClassStatusAction({
          classId: event.id,
          status: confirmDialog.pendingStatus as z.infer<typeof updateSlotStatusSchema>["status"]
        });

        if (result?.data?.success) {
          notify.success(tClasses("statusUpdated") || "Status atualizado!");
          setCurrentStatus(confirmDialog.pendingStatus!);
          onSuccess();
        } else {
          notify.error(result?.data?.error || tClasses("statusUpdateError") || "Erro ao atualizar status");
        }
      } catch {
        notify.error(tClasses("statusUpdateError") || "Erro ao atualizar status");
      } finally {
        setIsUpdating(false);
        setConfirmDialog({ isOpen: false, type: null, scope: null });
      }
    } else {
      // confirmDialog.type === "edit"
      setIsUpdating(true);
      try {
        // For single scope: use editDate (allows day changes).
        // For future scope: keep the original day but apply the new time.
        const baseDate = confirmDialog.scope === "single"
          ? new Date(editForm.editDate)
          : new Date(event.start);

        const start = new Date(baseDate);
        const [sH, sM] = editForm.startTime.split(":").map(Number);
        start.setHours(sH, sM, 0, 0);

        const end = new Date(baseDate);
        const [eH, eM] = editForm.endTime.split(":").map(Number);
        end.setHours(eH, eM, 0, 0);

        const result = await updateSlotAction({
          slotId: event.id,
          scope: confirmDialog.scope,
          data: {
            lessonTitle: editForm.lessonTitle,
            lessonId: editForm.lessonId,
            planId: editForm.planId,
            planName: editForm.planName,
            startAt: start.toISOString(),
            endAt: end.toISOString(),
          },
        });

        if (result?.data?.success) {
          notify.success(t("slotUpdated") || "Horário atualizado com sucesso!");
          setIsEditing(false);
          onSuccess();
        } else {
          notify.error(
            result?.data?.error ||
              t("updateError") ||
              "Erro ao atualizar horário.",
          );
        }
      } catch {
        notify.error(t("updateError") || "Erro ao atualizar horário.");
      } finally {
        setIsUpdating(false);
        setConfirmDialog({ isOpen: false, type: null, scope: null });
      }
    }
  };

  if (!event) return null;

  return (
    <>
      <Vault open={isOpen} onClose={() => onOpenChange(false)}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type={isEditing ? "edit" : "confirm"} />
            <div className="flex flex-col items-center">
              <VaultTitle>
                {isEditing ? "Editar Aula" : "Detalhes da Aula"}
              </VaultTitle>
              <VaultDescription>
                {isEditing
                  ? "Altere as informações desta aula e escolha o alcance da mudança."
                  : "Confira as informações completas desta reserva."}
              </VaultDescription>
              {event.status === "canceled-student" &&
                !event.convertedToAvailableSlot && (
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/convert-class/${event.id}`);
                    }}
                    className="w-fit flex flex-row items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25 transition-colors"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Converter
                  </button>
                )}
            </div>
          </VaultHeader>

          <VaultBody>
            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-md bg-muted-foreground/15 border border-white/10">
                  <div className="min-w-12 min-h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <UserIcon className="min-w-6 min-h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{event.title}</h3>
                    <div className="flex items-start gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-black uppercase",
                          event.type === "REPOSICAO"
                            ? "text-orange-500 border-orange-500/20"
                            : "text-blue-500 border-blue-500/20",
                          isMobile &&
                            "flex items-center justify-center p-1.5 h-6 w-6",
                        )}
                      >
                        {isMobile ? (
                          event.type === "REPOSICAO" ? (
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5" />
                          )
                        ) : event.type === "REPOSICAO" ? (
                          "Reposição"
                        ) : (
                          "Aula Regular"
                        )}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] font-black uppercase",
                          isMobile &&
                            "flex items-center justify-center p-1.5 h-6 w-6",
                        )}
                      >
                        {isMobile ? (
                          event.isRecurring ? (
                            <Repeat className="w-3.5 h-3.5" />
                          ) : (
                            <CalendarIcon className="w-3.5 h-3.5" />
                          )
                        ) : event.isRecurring ? (
                          "Recorrente"
                        ) : (
                          "Aula Única"
                        )}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-[10px] font-black uppercase border",
                          statusConfig[currentStatus as keyof typeof statusConfig]?.color || ""
                        )}
                      >
                        <span className="mr-1">{statusConfig[currentStatus as keyof typeof statusConfig]?.icon}</span>
                        {statusConfig[currentStatus as keyof typeof statusConfig]?.label || currentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Data
                      </span>
                    </div>
                    <p className="text-sm font-bold text-text">
                      {format(event.start, "dd 'de' MMMM, yyyy")}
                    </p>
                  </div>
                  <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Horário
                      </span>
                    </div>
                    <p className="text-sm font-bold text-text">
                      {format(event.start, "HH:mm")} -{" "}
                      {format(event.end || event.start, "HH:mm")}
                    </p>
                  </div>
                </div>

                {event.isRecurring && event.ruleStartDate && (
                  <div className="p-4 rounded-md bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <ArrowRightLeft className="w-4 h-4" />
                      <h4 className="text-xs font-black uppercase tracking-widest">
                        Período da Recorrência
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                          Início
                        </span>
                        <p className="text-sm font-bold text-text">
                          {format(event.ruleStartDate, "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                          Término
                        </span>
                        <p className="text-sm font-bold text-text">
                          {event.ruleEndDate
                            ? format(event.ruleEndDate, "dd/MM/yyyy")
                            : "Indeterminado"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Conteúdo / Plano
                      </h4>
                      <p className="text-sm font-bold text-text">
                        {event.location || "Nenhum conteúdo definido"}
                      </p>
                    </div>
                  </div>

                  {event.notes && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          Notas
                        </h4>
                        <p className="text-sm text-text/80 leading-relaxed">
                          {event.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {event.studentId && event.assignedPlanId && event.isActive ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Buscar Aula (Curriculum)
                      </label>
                      <Command className="rounded-lg border border-white/10 bg-white/5">
                        <CommandInput
                          placeholder="Buscar por título..."
                          value={lessonsSearch}
                          onValueChange={setLessonsSearch}
                          className="h-9"
                        />
                        <CommandList className="max-h-[200px]">
                          {isSearchingLessons && (
                            <div className="p-4 text-xs text-center text-muted-foreground">
                              Buscando...
                            </div>
                          )}
                          {!isSearchingLessons &&
                            lessonsResults.length === 0 &&
                            lessonsSearch.length >= 2 && (
                              <CommandEmpty>
                                Nenhuma aula encontrada.
                              </CommandEmpty>
                            )}
                          {!isSearchingLessons && lessonsResults.length > 0 && (
                            <CommandGroup>
                              {lessonsResults.map((lesson) => (
                                <CommandItem
                                  key={lesson.id}
                                  onSelect={() => {
                                    setEditForm((prev) => ({
                                      ...prev,
                                      lessonTitle: lesson.title,
                                      lessonId: lesson.id,
                                      planId: event.assignedPlanId || null,
                                      planName: lesson.title,
                                    }));
                                    setLessonsSearch("");
                                    setLessonsResults([]);
                                  }}
                                  className="text-xs flex items-center justify-between"
                                >
                                  <span>{lesson.title}</span>
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] font-black"
                                  >
                                    {lesson.difficulty}
                                  </Badge>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                      {editForm.lessonTitle && (
                        <div className="p-2 rounded bg-primary/10 border border-primary/20 flex items-center justify-between">
                          <span className="text-xs font-bold text-primary truncate max-w-[80%]">
                            {editForm.lessonTitle}
                          </span>
                          <button
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                lessonTitle: "",
                                lessonId: null,
                              }))
                            }
                            className="text-primary hover:text-primary/80"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Date picker: only shown in single scope — future scope keeps dates per-occurrence */}
                  {editScope === "single" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="w-3 h-3" />
                        Data da Aula
                      </label>
                      <CalendarVault
                        date={editForm.editDate}
                        onSelect={(date) =>
                          date && setEditForm((prev) => ({ ...prev, editDate: date }))
                        }
                        placeholder="Selecione uma data"
                        label="Data da Aula"
                        className="h-10 bg-white/5 border-white/10 rounded-md"
                      />
                      {!isSameDay(editForm.editDate, new Date(event!.start)) && (
                        <p className="text-[10px] text-amber-400 font-medium">
                          ⚡ Data alterada — lembretes serão re-agendados para o novo dia.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Horário de Início
                      </label>
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Horário de Término
                      </label>
                      <input
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {conflict && (
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-rose-500 leading-tight font-medium">
                        {(conflict.kind === "student"
                          ? tChangeTime("studentConflict", {
                              start: format(conflict.startAt, "HH:mm"),
                              end: format(conflict.endAt, "HH:mm"),
                            })
                          : t("conflictWarning", {
                              start: format(conflict.startAt, "HH:mm"),
                              end: format(conflict.endAt, "HH:mm"),
                            })) ||
                          `Conflito detectado: O professor já possui uma aula das ${format(conflict.startAt, "HH:mm")} às ${format(conflict.endAt, "HH:mm")}.`}
                      </p>
                    </div>
                  )}

                  {editForm.endTime &&
                    editForm.startTime &&
                    editForm.endTime <= editForm.startTime && (
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-500 leading-tight font-medium">
                          {t("invalidTimeWarning") ||
                            "Horário inválido: O término deve ser após o início."}
                        </p>
                      </div>
                    )}
                </div>

                <div className="p-4 rounded-md bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                    Atenção: Ao alterar o horário de uma aula recorrente, você
                    poderá escolher se a mudança afetará apenas este dia ou
                    todos os próximos horários desta regra.
                  </p>
                </div>
              </div>
            )}
          </VaultBody>

          <VaultFooter>
            {!isEditing ? (
              <>
                {event.studentId ? (
                  <Select
                    value={currentStatus}
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger
                      className="flex-1 h-14! bg-white/5 border border-white/10 hover:bg-white/10 text-text rounded-md px-3 text-xs font-bold uppercase select-none flex items-center justify-between"
                    >
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{statusConfig[currentStatus as keyof typeof statusConfig]?.icon}</span>
                          <span>{statusConfig[currentStatus as keyof typeof statusConfig]?.label || currentStatus}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {Object.entries(statusConfig).map(([key, itemConfig]) => {
                        const allowedKeys = isTeacherView
                          ? ["completed", "no-show", "canceled-teacher"]
                          : ["completed", "canceled-teacher", "no-show", "scheduled"];
                        const isAllowed = allowedKeys.includes(key) || key === currentStatus;
                        if (!isAllowed) return null;

                        return (
                          <SelectItem key={key} value={key} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{itemConfig.icon}</span>
                              <span className="font-medium">{itemConfig.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <VaultSecondaryButton
                    onClick={() => {
                      if (event.isRecurring) {
                        setShowDeleteScope(true);
                      } else {
                        requestDelete("single");
                      }
                    }}
                    disabled={isUpdating || isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </VaultSecondaryButton>
                )}
                <VaultPrimaryButton
                  onClick={handleEditClick}
                  disabled={isUpdating || isDeleting}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </VaultPrimaryButton>
              </>
            ) : (
              <>
                <VaultSecondaryButton onClick={() => setIsEditing(false)}>
                  Cancelar
                </VaultSecondaryButton>
                <VaultPrimaryButton
                  onClick={handleSaveClick}
                  disabled={
                    isUpdating ||
                    !!conflict ||
                    editForm.endTime <= editForm.startTime ||
                    isCheckingConflict
                  }
                >
                  {isUpdating ? "Salvando..." : "Salvar Alterações"}
                </VaultPrimaryButton>
              </>
            )}
          </VaultFooter>
        </VaultContent>
      </Vault>

      {/* Scope Selection Vault for Deletion */}
      <Vault open={showDeleteScope} onClose={() => setShowDeleteScope(false)}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="warning" />
            <div className="flex flex-col">
              <VaultTitle>Excluir Aula</VaultTitle>
              <VaultDescription>
                Como você deseja prosseguir com a exclusão?
              </VaultDescription>
            </div>
          </VaultHeader>
          <VaultBody>
            <div className="space-y-4">
              <button
                onClick={() => requestDelete("single")}
                disabled={isDeleting}
                className="w-full p-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-text">
                  Apenas esta aula
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Remove apenas o horário selecionado do calendário.
                </p>
              </button>

              <button
                onClick={() => requestDelete("future")}
                disabled={isDeleting}
                className="w-full p-4 rounded-md border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-rose-500">
                  Esta e todas as próximas
                </h4>
                <p className="text-xs text-rose-500/60 mt-1">
                  Remove a aula atual e encerra a recorrência para datas
                  futuras.
                </p>
              </button>
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>

      {/* Scope Selection Vault for Edit */}
      <Vault open={showEditScope} onClose={() => setShowEditScope(false)}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="warning" />
            <div className="flex flex-col">
              <VaultTitle>Alcance da Edição</VaultTitle>
              <VaultDescription>
                Esta aula faz parte de uma recorrência. Onde deseja aplicar as
                mudanças?
              </VaultDescription>
            </div>
          </VaultHeader>
          <VaultBody>
            <div className="space-y-4">
              <button
                onClick={() => requestEdit()}
                disabled={isUpdating}
                className="w-full p-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-text">
                  Apenas esta aula
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  A mudança de horário e conteúdo afetará somente este dia.
                </p>
              </button>

              {!!event?.ruleId && (
                <button
                  onClick={openRetimeVault}
                  disabled={isUpdating}
                  className="w-full p-4 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-left transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Repeat className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-bold text-primary">
                      {tChangeTime("scopeFuture") || "Esta e as próximas aulas"}
                    </h4>
                  </div>
                  <p className="text-xs text-primary/60">
                    {tChangeTime("scopeFutureHint") ||
                      "A partir desta aula, todas as seguintes passam para o novo horário. As anteriores não mudam."}
                  </p>
                </button>
              )}
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>

      {/* Change time of this and following classes */}
      <ChangeClassTimeVault
        slot={changeTimeTarget}
        initialScope="future"
        open={showRetimeVault}
        onOpenChange={setShowRetimeVault}
        onSuccess={() => {
          onOpenChange(false);
          onSuccess();
        }}
      />

      {/* Confirmation Vault */}
      <Vault
        open={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, type: null, scope: null })
        }
      >
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="warning" />
            <div className="flex flex-col">
              <VaultTitle>
                {confirmDialog.type === "delete"
                  ? "Confirmar Exclusão"
                  : confirmDialog.type === "status"
                    ? (tClasses("confirmStatusChange") || "Confirmar Alteração")
                    : "Confirmar Alterações"}
              </VaultTitle>
              <VaultDescription>
                {confirmDialog.type === "delete"
                  ? confirmDialog.scope === "future"
                    ? "Tem certeza que deseja excluir esta e TODAS as próximas aulas vinculadas a esta regra? Esta ação não pode ser desfeita."
                    : "Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita."
                  : confirmDialog.type === "status"
                    ? <>
                        {tClasses("confirmStatusDescription") || "Você tem certeza que deseja alterar o status desta aula para"}{" "}
                        <strong>
                          {confirmDialog.pendingStatus &&
                            (statusConfig[confirmDialog.pendingStatus as keyof typeof statusConfig]?.label || confirmDialog.pendingStatus)}
                        </strong>?
                      </>
                    : confirmDialog.scope === "future"
                      ? "Tem certeza que deseja aplicar as edições de horário/conteúdo nesta e em TODAS as próximas aulas vinculadas?"
                      : "Tem certeza que deseja aplicar as edições apenas nesta aula?"}
              </VaultDescription>
            </div>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton
              onClick={() =>
                setConfirmDialog({ isOpen: false, type: null, scope: null })
              }
              disabled={isDeleting || isUpdating}
            >
              Cancelar
            </VaultSecondaryButton>
            <VaultPrimaryButton
              onClick={executeConfirmAction}
              disabled={isDeleting || isUpdating}
            >
              {isDeleting || isUpdating ? "Processando..." : "Sim, confirmar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
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
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { notify } from "@/components/ui/toaster";
import {
  deleteSlotAction,
  updateSlotAction,
  checkSlotConflictAction
} from "@/modules/scheduling/scheduling.actions";
import { getLessonsAction } from "@/modules/curriculum/curriculum.actions";
import { CalendarEvent } from "@/components/ui/calendar-view";
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
  VaultIcon
} from "@/components/ui/vault";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteScope, setShowDeleteScope] = useState(false);
  const [showEditScope, setShowEditScope] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "delete" | "edit" | null;
    scope: "single" | "future" | null;
  }>({ isOpen: false, type: null, scope: null });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    startTime: "",
    endTime: "",
    lessonTitle: "",
    lessonId: null as string | null,
    planId: null as string | null,
    planName: null as string | null,
  });

  const [conflict, setConflict] = useState<{ startAt: Date; endAt: Date } | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const [lessonsSearch, setLessonsSearch] = useState("");
  const [lessonsResults, setLessonsResults] = useState<LessonSummary[]>([]);
  const [isSearchingLessons, setIsSearchingLessons] = useState(false);
  const [editScope, setEditScope] = useState<"single" | "future">("single");

  // Sync form when event changes or editing starts
  useEffect(() => {
    if (event && isOpen) {
      setEditForm({
        startTime: format(event.start, "HH:mm"),
        endTime: format(event.end || event.start, "HH:mm"),
        lessonTitle: event.location || "",
        lessonId: event.lessonId || null,
        planId: event.assignedPlanId || null,
        planName: event.location || null,
      });
      setIsEditing(false);
    }
  }, [event, isOpen]);

  // Lessons search
  useEffect(() => {
    if (!lessonsSearch || lessonsSearch.length < 2 || !event?.studentId || !event?.assignedPlanId) {
      setLessonsResults([]);
      return;
    }

    const searchLessons = async () => {
      setIsSearchingLessons(true);
      try {
        const result = await getLessonsAction({
          search: lessonsSearch
        });
        if (result?.data?.success) {
          setLessonsResults(result.data.data as unknown as LessonSummary[]);
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
        const start = new Date(event.start);
        const [sH, sM] = editForm.startTime.split(":").map(Number);
        start.setHours(sH, sM, 0, 0);

        const end = new Date(event.start);
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
          excludeSlotId: event.id
        });

        const data = result?.data;
        if (data?.success && data.hasConflict && data.conflict) {
          setConflict({
            startAt: new Date(data.conflict.startAt),
            endAt: new Date(data.conflict.endAt)
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
  }, [editForm.startTime, editForm.endTime, event, teacherId, isEditing]);

  const handleEditClick = () => {
    if (event?.isRecurring) {
      setShowEditScope(true);
    } else {
      setEditScope("single");
      setIsEditing(true);
    }
  };

  const requestEdit = (scope: "single" | "future") => {
    setShowEditScope(false);
    setEditScope(scope);
    setIsEditing(true);
  };

  const requestDelete = (scope: "single" | "future") => {
    setShowDeleteScope(false);
    setConfirmDialog({ isOpen: true, type: "delete", scope });
  };

  const handleSaveClick = () => {
    setConfirmDialog({ isOpen: true, type: "edit", scope: editScope });
  };

  const executeConfirmAction = async () => {
    if (!event || !confirmDialog.type || !confirmDialog.scope) return;

    if (confirmDialog.type === "delete") {
      setIsDeleting(true);
      try {
        const result = await deleteSlotAction({
          slotId: event.id,
          scope: confirmDialog.scope
        });
        if (result?.data?.success) {
          notify.success(t("slotDeleted") || "Horário excluído com sucesso!");
          onOpenChange(false);
          onSuccess();
        } else {
          notify.error(result?.data?.error || t("deleteError") || "Erro ao excluir horário.");
        }
      } catch {
        notify.error(t("deleteError") || "Erro ao excluir horário.");
      } finally {
        setIsDeleting(false);
        setConfirmDialog({ isOpen: false, type: null, scope: null });
      }
    } else {
      // confirmDialog.type === "edit"
      setIsUpdating(true);
      try {
        const start = new Date(event.start);
        const [sH, sM] = editForm.startTime.split(":").map(Number);
        start.setHours(sH, sM, 0, 0);

        const end = new Date(event.start);
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
          }
        });

        if (result?.data?.success) {
          notify.success(t("slotUpdated") || "Horário atualizado com sucesso!");
          setIsEditing(false);
          onSuccess();
        } else {
          notify.error(result?.data?.error || t("updateError") || "Erro ao atualizar horário.");
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
            <div className="flex flex-col">
              <VaultTitle>{isEditing ? "Editar Aula" : "Detalhes da Aula"}</VaultTitle>
              <VaultDescription>
                {isEditing
                  ? "Altere as informações desta aula e escolha o alcance da mudança."
                  : "Confira as informações completas desta reserva."
                }
              </VaultDescription>
            </div>
          </VaultHeader>

          <VaultBody>
            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-md bg-muted-foreground/15 border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{event.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-black uppercase",
                        event.type === "REPOSICAO" ? "text-orange-500 border-orange-500/20" : "text-blue-500 border-blue-500/20"
                      )}>
                        {event.type === "REPOSICAO" ? "Reposição" : "Aula Regular"}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-black uppercase">
                        {event.isRecurring ? "Recorrente" : "Aula Única"}
                      </Badge>
                      <Badge className="text-[10px] font-black uppercase">{event.status}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Data</span>
                    </div>
                    <p className="text-sm font-bold text-text">{format(event.start, "dd 'de' MMMM, yyyy")}</p>
                  </div>
                  <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Horário</span>
                    </div>
                    <p className="text-sm font-bold text-text">
                      {format(event.start, "HH:mm")} - {format(event.end || event.start, "HH:mm")}
                    </p>
                  </div>
                </div>

                {event.isRecurring && event.ruleStartDate && (
                  <div className="p-4 rounded-md bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <ArrowRightLeft className="w-4 h-4" />
                      <h4 className="text-xs font-black uppercase tracking-widest">Período da Recorrência</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Início</span>
                        <p className="text-sm font-bold text-text">{format(event.ruleStartDate, "dd/MM/yyyy")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">Término</span>
                        <p className="text-sm font-bold text-text">
                          {event.ruleEndDate ? format(event.ruleEndDate, "dd/MM/yyyy") : "Indeterminado"}
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
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Conteúdo / Plano</h4>
                      <p className="text-sm font-bold text-text">{event.location || "Nenhum conteúdo definido"}</p>
                    </div>
                  </div>

                  {event.notes && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notas</h4>
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
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Buscar Aula (Curriculum)</label>
                      <Command className="rounded-lg border border-white/10 bg-white/5">
                        <CommandInput
                          placeholder="Buscar por título..."
                          value={lessonsSearch}
                          onValueChange={setLessonsSearch}
                          className="h-9"
                        />
                        <CommandList className="max-h-[200px]">
                          {isSearchingLessons && (
                            <div className="p-4 text-xs text-center text-muted-foreground">Buscando...</div>
                          )}
                          {!isSearchingLessons && lessonsResults.length === 0 && lessonsSearch.length >= 2 && (
                            <CommandEmpty>Nenhuma aula encontrada.</CommandEmpty>
                          )}
                          {!isSearchingLessons && lessonsResults.length > 0 && (
                            <CommandGroup>
                              {lessonsResults.map((lesson) => (
                                <CommandItem
                                  key={lesson.id}
                                  onSelect={() => {
                                    setEditForm(prev => ({
                                      ...prev,
                                      lessonTitle: lesson.title,
                                      lessonId: lesson.id,
                                      planId: event.assignedPlanId || null,
                                      planName: lesson.title
                                    }));
                                    setLessonsSearch("");
                                    setLessonsResults([]);
                                  }}
                                  className="text-xs flex items-center justify-between"
                                >
                                  <span>{lesson.title}</span>
                                  <Badge variant="outline" className="text-[8px] font-black">{lesson.difficulty}</Badge>
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
                            onClick={() => setEditForm(prev => ({ ...prev, lessonTitle: "", lessonId: null }))}
                            className="text-primary hover:text-primary/80"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horário de Início</label>
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horário de Término</label>
                      <input
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {conflict && (
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-rose-500 leading-tight font-medium">
                        {t("conflictWarning", { 
                          start: format(conflict.startAt, "HH:mm"), 
                          end: format(conflict.endAt, "HH:mm") 
                        }) || `Conflito detectado: O professor já possui uma aula das ${format(conflict.startAt, "HH:mm")} às ${format(conflict.endAt, "HH:mm")}.`}
                      </p>
                    </div>
                  )}

                  {editForm.endTime && editForm.startTime && editForm.endTime <= editForm.startTime && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-amber-500 leading-tight font-medium">
                        {t("invalidTimeWarning") || "Horário inválido: O término deve ser após o início."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-md bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                    Atenção: Ao alterar o horário de uma aula recorrente, você poderá escolher se a mudança afetará apenas este dia ou todos os próximos horários desta regra.
                  </p>
                </div>
              </div>
            )}
          </VaultBody>

          <VaultFooter>
            {!isEditing ? (
              <>
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
                  disabled={isUpdating || !!conflict || (editForm.endTime <= editForm.startTime) || isCheckingConflict}
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
              <VaultDescription>Como você deseja prosseguir com a exclusão?</VaultDescription>
            </div>
          </VaultHeader>
          <VaultBody>
            <div className="space-y-4">
              <button
                onClick={() => requestDelete("single")}
                disabled={isDeleting}
                className="w-full p-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-text">Apenas esta aula</h4>
                <p className="text-xs text-muted-foreground mt-1">Remove apenas o horário selecionado do calendário.</p>
              </button>

              <button
                onClick={() => requestDelete("future")}
                disabled={isDeleting}
                className="w-full p-4 rounded-md border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-rose-500">Esta e todas as próximas</h4>
                <p className="text-xs text-rose-500/60 mt-1">Remove a aula atual e encerra a recorrência para datas futuras.</p>
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
              <VaultDescription>Esta aula faz parte de uma recorrência. Onde deseja aplicar as mudanças?</VaultDescription>
            </div>
          </VaultHeader>
          <VaultBody>
            <div className="space-y-4">
              <button
                onClick={() => requestEdit("single")}
                disabled={isUpdating}
                className="w-full p-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-text">Apenas esta aula</h4>
                <p className="text-xs text-muted-foreground mt-1">A mudança de horário e conteúdo afetará somente este dia.</p>
              </button>

              <button
                onClick={() => requestEdit("future")}
                disabled={isUpdating}
                className="w-full p-4 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-left transition-all"
              >
                <h4 className="text-sm font-bold text-primary">Esta e todas as próximas</h4>
                <p className="text-xs text-primary/60 mt-1">Atualiza a regra de recorrência, afetando todas as aulas futuras.</p>
              </button>
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>

      {/* Confirmation Vault */}
      <Vault open={confirmDialog.isOpen} onClose={() => setConfirmDialog({ isOpen: false, type: null, scope: null })}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="warning" />
            <div className="flex flex-col">
              <VaultTitle>
                {confirmDialog.type === "delete" ? "Confirmar Exclusão" : "Confirmar Alterações"}
              </VaultTitle>
              <VaultDescription>
                {confirmDialog.type === "delete"
                  ? confirmDialog.scope === "future"
                    ? "Tem certeza que deseja excluir esta e TODAS as próximas aulas vinculadas a esta regra? Esta ação não pode ser desfeita."
                    : "Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita."
                  : confirmDialog.scope === "future"
                    ? "Tem certeza que deseja aplicar as edições de horário/conteúdo nesta e em TODAS as próximas aulas vinculadas?"
                    : "Tem certeza que deseja aplicar as edições apenas nesta aula?"}
              </VaultDescription>
            </div>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton
              onClick={() => setConfirmDialog({ isOpen: false, type: null, scope: null })}
              disabled={isDeleting || isUpdating}
            >
              Cancelar
            </VaultSecondaryButton>
            <VaultPrimaryButton
              onClick={executeConfirmAction}
              disabled={isDeleting || isUpdating}
            >
              {(isDeleting || isUpdating) ? "Processando..." : "Sim, confirmar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </>
  );
}

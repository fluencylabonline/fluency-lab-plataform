"use client";

import React, { useState } from "react";
import {
  User,
  BookOpen,
  Check,
  Search,
  Users,
  Clock,
  Trash2,
  CalendarDays,
  History,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultSecondaryButton,
  VaultPrimaryButton,
  VaultIcon,
} from "@/components/ui/vault";
import { Progress } from "@/components/ui/progress";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CurriculumVaultsProps {
  // Common
  studentId: string;
  isUpdating: boolean;

  // Swap Teacher
  swapSlot: any;
  setSwapSlot: (slot: any) => void;
  teachers: any[];
  onConfirmSwap: (slotId: string, teacherId: string) => void;

  // Update Lesson
  lessonSlot: any;
  setLessonSlot: (slot: any) => void;
  lessons: any[];
  onConfirmLesson: (slotId: string, lessonId: string, lessonTitle: string) => void;

  // Assign Plan
  showAssignPlan: boolean;
  setShowAssignPlan: (show: boolean) => void;
  plans: any[];
  activePlanName?: string;
  upcomingClasses: any[];
  onConfirmAssignPlan: (planId: string, startClassId?: string) => void;

  // Plan History
  showPlanHistory: boolean;
  setShowPlanHistory: (show: boolean) => void;
  studentPlans: any[];

  // Manage Recurring Schedule
  showManageSchedule: boolean;
  setShowManageSchedule: (show: boolean) => void;
  studentRules: any[];
  availableRules: any[];
  onConfirmAllocate: (ruleId: string) => void;
  onConfirmDeallocate: (ruleId: string) => void;
}

export function CurriculumVaults({
  studentId,
  isUpdating,
  swapSlot,
  setSwapSlot,
  teachers,
  onConfirmSwap,
  lessonSlot,
  setLessonSlot,
  lessons,
  onConfirmLesson,
  showAssignPlan,
  setShowAssignPlan,
  plans,
  activePlanName,
  upcomingClasses,
  onConfirmAssignPlan,
  showPlanHistory,
  setShowPlanHistory,
  studentPlans,
  showManageSchedule,
  setShowManageSchedule,
  studentRules,
  availableRules,
  onConfirmAllocate,
  onConfirmDeallocate,
}: CurriculumVaultsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [deallocatingId, setDeallocatingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // States for Plan Assignment Step Logic
  const [assignStep, setAssignStep] = useState<"selection" | "confirm-replace" | "select-start-class">("selection");
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [startClassId, setStartClassId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isUpdating) {
      setProgress(0);
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) return 100;
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 95);
        });
      }, 500);
      return () => {
        clearInterval(timer);
        setProgress(100);
      };
    }
  }, [isUpdating]);

  const resetSelection = () => {
    setSelectedId(null);
    setSelectedTitle(null);
  };

  // Reset selection when vaults are closed
  React.useEffect(() => {
    const isAnyVaultOpen = !!swapSlot || !!lessonSlot || showAssignPlan || showManageSchedule || showPlanHistory;
    if (!isAnyVaultOpen) {
      resetSelection();
      setAssignStep("selection");
      setPendingPlanId(null);
      setStartClassId(null);
    }
  }, [swapSlot, lessonSlot, showAssignPlan, showManageSchedule, showPlanHistory]);

  return (
    <>
      {/* 1. Swap Teacher Vault */}
      <Vault open={!!swapSlot} onOpenChange={(open) => !open && setSwapSlot(null)}>
        <VaultContent noPadding>
          <VaultHeader className="px-6 pt-6">
            <VaultTitle>Alterar Professor</VaultTitle>
            <VaultDescription>
              Selecione o novo professor para esta aula específica. O sistema verificará conflitos de horário.
            </VaultDescription>
          </VaultHeader>
          <VaultBody>
            <Command className="border-none">
              <CommandInput placeholder="Buscar professor..." />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>Nenhum professor encontrado.</CommandEmpty>
                <CommandGroup heading="Professores Disponíveis">
                  {teachers.map((teacher) => (
                    <CommandItem
                      key={teacher.id}
                      value={teacher.id}
                      onSelect={() => setSelectedId(teacher.id)}
                      className={cn(
                        "flex items-center justify-between py-3",
                        selectedId === teacher.id && "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{teacher.name}</span>
                      </div>
                      {selectedId === teacher.id && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </VaultBody>
          <VaultFooter className="px-6 pb-6">
            <VaultSecondaryButton onClick={() => setSwapSlot(null)}>Cancelar</VaultSecondaryButton>
            <VaultPrimaryButton
              disabled={!selectedId || isUpdating}
              onClick={() => {
                if (selectedId && swapSlot) onConfirmSwap(swapSlot.id, selectedId);
              }}
            >
              Confirmar Troca
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>

      {/* 2. Update Lesson Vault */}
      <Vault open={!!lessonSlot} onOpenChange={(open) => !open && setLessonSlot(null)}>
        <VaultContent noPadding>
          <VaultHeader className="px-6 pt-6">
            <VaultTitle>Alterar Lição</VaultTitle>
            <VaultDescription>
              Escolha uma nova lição do currículo para esta aula.
            </VaultDescription>
          </VaultHeader>
          <VaultBody>
            <Command className="border-none">
              <CommandInput placeholder="Buscar lição por título..." />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>Nenhuma lição encontrada.</CommandEmpty>
                <CommandGroup>
                  {lessons.map((lesson) => (
                    <CommandItem
                      key={lesson.id}
                      value={lesson.id}
                      onSelect={() => {
                        setSelectedId(lesson.id);
                        setSelectedTitle(lesson.title);
                      }}
                      className={cn(
                        "flex items-center justify-between py-3",
                        selectedId === lesson.id && "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.title}</span>
                      </div>
                      {selectedId === lesson.id && <Check className="h-4 w-4 text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </VaultBody>
          <VaultFooter className="px-6 pb-6">
            <VaultSecondaryButton onClick={() => setLessonSlot(null)}>Cancelar</VaultSecondaryButton>
            <VaultPrimaryButton
              disabled={!selectedId || isUpdating}
              onClick={() => {
                if (selectedId && selectedTitle && lessonSlot) {
                  onConfirmLesson(lessonSlot.id, selectedId, selectedTitle);
                }
              }}
            >
              Atualizar Lição
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>

      {/* 3. Assign Plan Vault */}
      <Vault open={showAssignPlan} onOpenChange={(open) => !open && setShowAssignPlan(false)}>
        <VaultContent noPadding>
          <VaultHeader className="px-6 pt-6">
            <VaultTitle>
              {assignStep === "selection" && "Designar Plano de Aula"}
              {assignStep === "confirm-replace" && "Substituir Plano Atual?"}
              {assignStep === "select-start-class" && "A partir de qual aula?"}
            </VaultTitle>
            <VaultDescription>
              {assignStep === "selection" && "Selecione um template de plano para distribuir lições nas aulas agendadas."}
              {assignStep === "confirm-replace" && `O aluno já possui o plano "${activePlanName}" ativo.`}
              {assignStep === "select-start-class" && "Selecione a primeira aula que deve receber as novas lições deste plano."}
            </VaultDescription>
          </VaultHeader>

          <VaultBody className="max-h-[60vh] overflow-y-auto">
            {upcomingClasses.length === 0 && assignStep === "selection" ? (
              <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Nenhuma aula agendada</p>
                  <p className="text-xs text-muted-foreground">
                    O aluno precisa ter aulas futuras marcadas no calendário antes de designar um plano de aula.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {assignStep === "selection" && (
                  <Command className="border-none">
                    <CommandInput placeholder="Buscar plano..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nenhum plano encontrado.</CommandEmpty>
                      <CommandGroup>
                        {plans.map((plan) => (
                          <CommandItem
                            key={plan.id}
                            value={plan.id}
                            onSelect={() => setSelectedId(plan.id)}
                            className={cn(
                              "flex items-center justify-between py-3",
                              selectedId === plan.id && "bg-primary/10"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span>{plan.name}</span>
                                <span className="text-xs text-muted-foreground">{plan.description || "Sem descrição"}</span>
                              </div>
                            </div>
                            {selectedId === plan.id && <Check className="h-4 w-4 text-primary" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}

                {assignStep === "confirm-replace" && (
                  <div className="px-6 py-4 space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Ao substituir o plano, as lições das aulas futuras que ainda não foram concluídas serão sobrescritas pelas novas lições do plano selecionado.
                      </p>
                    </div>
                    <p className="text-sm font-medium">Deseja prosseguir com a substituição?</p>
                  </div>
                )}

                {assignStep === "select-start-class" && (
                  <Command className="border-none">
                    <CommandInput placeholder="Buscar aula..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nenhuma aula encontrada.</CommandEmpty>
                      <CommandGroup heading="Selecione a aula de início">
                        {upcomingClasses.map((slot) => (
                          <CommandItem
                            key={slot.id}
                            value={slot.id}
                            onSelect={() => setStartClassId(slot.id)}
                            className={cn(
                              "flex items-center justify-between py-3",
                              startClassId === slot.id && "bg-primary/10"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {format(new Date(slot.startAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </span>
                                <span className="text-xs text-muted-foreground italic">
                                  {slot.lessonTitle || "Sem lição vinculada"}
                                </span>
                              </div>
                            </div>
                            {startClassId === slot.id && <Check className="h-4 w-4 text-primary" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </>
            )}

            {isUpdating && (
              <div className="space-y-2 py-4 px-6 border-t bg-accent/5">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Aplicando plano de aula...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-center italic">
                  Distribuindo lições ao longo do cronograma do aluno.
                </p>
              </div>
            )}
          </VaultBody>

          <VaultFooter className="px-6 pb-6">
            {assignStep === "selection" && (
              <>
                <VaultSecondaryButton onClick={() => setShowAssignPlan(false)}>Cancelar</VaultSecondaryButton>
                <VaultPrimaryButton
                  disabled={!selectedId || isUpdating || upcomingClasses.length === 0}
                  onClick={() => {
                    if (activePlanName) {
                      setAssignStep("confirm-replace");
                    } else {
                      setAssignStep("select-start-class");
                    }
                  }}
                >
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </VaultPrimaryButton>
              </>
            )}

            {assignStep === "confirm-replace" && (
              <>
                <VaultSecondaryButton onClick={() => setAssignStep("selection")}>Voltar</VaultSecondaryButton>
                <VaultPrimaryButton
                  onClick={() => setAssignStep("select-start-class")}
                >
                  Sim, Substituir
                </VaultPrimaryButton>
              </>
            )}

            {assignStep === "select-start-class" && (
              <>
                <VaultSecondaryButton onClick={() => setAssignStep(activePlanName ? "confirm-replace" : "selection")}>
                  Voltar
                </VaultSecondaryButton>
                <VaultPrimaryButton
                  disabled={!startClassId || isUpdating}
                  onClick={() => {
                    if (selectedId) onConfirmAssignPlan(selectedId, startClassId || undefined);
                  }}
                >
                  Finalizar Designação
                </VaultPrimaryButton>
              </>
            )}
          </VaultFooter>
        </VaultContent>
      </Vault>
      {/* 4. Manage Recurring Schedule Vault */}
      <Vault open={showManageSchedule} onOpenChange={(open) => !open && setShowManageSchedule(false)}>
        <VaultContent noPadding>
          <VaultHeader className="px-6 pt-6">
            <VaultTitle>Gerenciar Horários Recorrentes</VaultTitle>
            <VaultDescription>
              Visualize os horários fixos deste aluno ou aloque-o em novos slots disponíveis.
            </VaultDescription>
          </VaultHeader>
          <VaultBody className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-6 px-6">
              {/* Seção: Horários Atuais */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> Horários Atuais
                </h4>
                {studentRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-accent/30 p-4 rounded-lg border border-dashed">
                    Nenhum horário recorrente vinculado a este aluno.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg border">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{rule.startTime} - {rule.endTime}</span>
                          <span className="text-xs text-muted-foreground capitalize">Freq: {rule.frequency}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeallocatingId(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUpdating && (
                <div className="space-y-2 py-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Sincronizando calendário...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-[10px] text-muted-foreground text-center italic">
                    Isso pode levar alguns segundos dependendo do tempo de contrato.
                  </p>
                </div>
              )}

              {/* Seção: Slots Disponíveis para Alocação */}
              <div className="space-y-3 pb-6">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Slots Disponíveis
                </h4>
                <Command className="border rounded-lg overflow-hidden">
                  <CommandInput placeholder="Filtrar por horário ou professor..." />
                  <CommandList className="max-h-[250px]">
                    <CommandEmpty>Nenhum slot disponível encontrado.</CommandEmpty>
                    <CommandGroup>
                      {availableRules.map((rule) => {
                        const teacher = teachers.find(t => t.id === rule.teacherId);
                        return (
                          <CommandItem
                            key={rule.id}
                            value={rule.id}
                            onSelect={() => setSelectedId(rule.id)}
                            className={cn(
                              "flex items-center justify-between py-3",
                              selectedId === rule.id && "bg-primary/10"
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{rule.startTime} - {rule.endTime}</span>
                              <span className="text-xs text-muted-foreground">
                                {teacher?.name || "Professor"} • {rule.frequency}
                              </span>
                            </div>
                            {selectedId === rule.id && <Check className="h-4 w-4 text-primary" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </div>
          </VaultBody>
          <VaultFooter className="px-6 pb-6 border-t pt-4">
            <VaultSecondaryButton onClick={() => setShowManageSchedule(false)}>Fechar</VaultSecondaryButton>
            <VaultPrimaryButton
              disabled={!selectedId || isUpdating}
              onClick={() => {
                if (selectedId) onConfirmAllocate(selectedId);
              }}
            >
              Alocar Aluno
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>

      {/* 6. Plan History Vault */}
      <Vault open={showPlanHistory} onOpenChange={(open) => !open && setShowPlanHistory(false)}>
        <VaultContent noPadding>
          <VaultHeader className="px-6 pt-6">
            <VaultTitle>Histórico de Planos</VaultTitle>
            <VaultDescription>
              Todos os planos de aula que já foram associados a este aluno.
            </VaultDescription>
          </VaultHeader>
          <VaultBody className="max-h-[60vh] overflow-y-auto">
            <div className="px-6 pb-6 space-y-4">
              {studentPlans.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="flex justify-center">
                    <History className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhum plano encontrado no histórico.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {studentPlans.map((plan) => (
                    <div key={plan.id} className="p-4 border rounded-xl flex items-center justify-between bg-accent/10">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{plan.name}</span>
                          <Badge variant={plan.status === "active" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                            {plan.status === "active" ? "Ativo" : "Finalizado"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {plan.lessons.length} lições • Criado em {format(new Date(plan.createdAt), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>
    </>
  );
}

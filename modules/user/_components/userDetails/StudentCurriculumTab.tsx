"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  Clock,
  History,
  Coins
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import {
  getStudentScheduleAction,
  updateClassStatusAction,
  swapSlotTeacherAction,
  updateSlotLessonAction,
  getAvailableRulesAction,
  getStudentRulesAction,
  allocateStudentAction,
  deallocateStudentAction
} from "@/modules/scheduling/scheduling.actions";
import {
  assignPlanAction,
  getStudentPlanGapAction,
  getTemplatesAction,
  getStudentPlansAction
} from "@/modules/learning/learning.actions";
import { getTeachersAction } from "@/modules/user/user.actions";
import { getLessonsAction } from "@/modules/curriculum/curriculum.actions";

import { CurriculumMonthView } from "./CurriculumMonthView";
import { CurriculumVaults } from "./CurriculumVaults";
import { ManageCreditsVault } from "./ManageCreditsVault";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shimmer } from "@shimmer-from-structure/react";

interface StudentCurriculumTabProps {
  studentId: string;
  isAdmin: boolean;
}

export function StudentCurriculumTab({ studentId, isAdmin }: StudentCurriculumTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [gap, setGap] = useState<any>(null);

  // Data for Vaults
  const [teachers, setTeachers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  // Selection States for Vaults
  const [swapSlot, setSwapSlot] = useState<any>(null);
  const [lessonSlot, setLessonSlot] = useState<any>(null);
  const [showAssignPlan, setShowAssignPlan] = useState(false);
  const [showManageSchedule, setShowManageSchedule] = useState(false);
  const [availableRules, setAvailableRules] = useState<any[]>([]);
  const [studentRules, setStudentRules] = useState<any[]>([]);

  // Plan History
  const [showPlanHistory, setShowPlanHistory] = useState(false);
  const [studentPlans, setStudentPlans] = useState<any[]>([]);

  // Credits
  const [showManageCredits, setShowManageCredits] = useState(false);

  const mockSlots = Array.from({ length: 6 }).map((_, i) => ({
    id: `mock-${i}`,
    startAt: new Date(),
    endAt: new Date(),
    status: "scheduled",
    teacherName: "Professor Loading...",
    planName: "Plan Name...",
    lessonTitle: "Lesson Title...",
    type: "NORMAL"
  }));

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    const result = await getStudentScheduleAction({
      studentId,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    });

    const response = result?.data;
    if (response?.success) {
      setSlots(response.data || []);
    } else {
      const errorMsg = (response as any)?.error || "Erro desconhecido";
      notify.error("Erro ao carregar agenda: " + errorMsg);
    }
    setIsLoading(false);
  }, [studentId, currentDate]);

  const fetchGap = useCallback(async () => {
    const result = await getStudentPlanGapAction({ studentId });
    const response = result?.data;
    if (response?.success) setGap(response.data);
  }, [studentId]);

  const fetchStaticData = useCallback(async () => {
    if (!isAdmin) return;

    const [tResult, pResult, lResult] = await Promise.all([
      getTeachersAction({}),
      getTemplatesAction({}),
      getLessonsAction({ limit: 100 })
    ]);

    const tData = tResult?.data;
    const pData = pResult?.data;
    const lData = lResult?.data;

    if (tData?.success) setTeachers(tData.data || []);
    if (pData?.success) setPlans(pData.data || []);
    if (lData?.success) setLessons(lData.data || []);
  }, [isAdmin]);

  const fetchPlans = useCallback(async () => {
    const result = await getStudentPlansAction({ studentId });
    const response = result?.data;
    if (response?.success) setStudentPlans(response.data || []);
  }, [studentId]);

  const fetchRules = useCallback(async () => {
    if (!isAdmin) return;
    const [aResult, sResult] = await Promise.all([
      getAvailableRulesAction({}),
      getStudentRulesAction({ studentId })
    ]);

    const aData = aResult?.data;
    const sData = sResult?.data;

    if (aData?.success) setAvailableRules(aData.data || []);
    if (sData?.success) setStudentRules(sData.data || []);
  }, [isAdmin, studentId]);

  useEffect(() => {
    fetchSchedule();
    fetchGap();
    fetchRules();
    fetchPlans();
  }, [fetchSchedule, fetchGap, fetchRules, fetchPlans]);

  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  const handleUpdateStatus = async (slotId: string, status: any) => {
    setIsUpdating(true);
    const result = await updateClassStatusAction({ classId: slotId, status });
    if (result?.data?.success) {
      notify.success("Status atualizado!");
      fetchSchedule();
    } else {
      const errorMsg = (result?.data as any)?.error || "Erro ao atualizar status";
      notify.error(errorMsg);
    }
    setIsUpdating(false);
  };

  const handleSwapTeacher = async (slotId: string, newTeacherId: string) => {
    setIsUpdating(true);
    const result = await swapSlotTeacherAction({ slotId, newTeacherId });
    if (result?.data?.success) {
      notify.success("Professor alterado com sucesso!");
      setSwapSlot(null);
      fetchSchedule();
    } else {
      const errorMsg = (result?.data as any)?.error || "Erro ao trocar professor";
      notify.error(errorMsg);
    }
    setIsUpdating(false);
  };

  const handleUpdateLesson = async (slotId: string, lessonId: string, lessonTitle: string) => {
    setIsUpdating(true);
    const result = await updateSlotLessonAction({ slotId, lessonId, lessonTitle });
    if (result?.data?.success) {
      notify.success("Lição vinculada à aula!");
      setLessonSlot(null);
      fetchSchedule();
    } else {
      const errorMsg = (result?.data as any)?.error || "Erro ao vincular lição";
      notify.error(errorMsg);
    }
    setIsUpdating(false);
  };

  const handleAllocate = async (ruleId: string) => {
    setIsUpdating(true);
    const result = await allocateStudentAction({ ruleId, studentId });
    if (result?.data?.success) {
      notify.success("Aluno alocado com sucesso!");
      fetchRules();
      fetchSchedule();
    } else {
      const errorMsg = (result?.data as any)?.error || "Erro ao alocar aluno";
      notify.error(errorMsg);
    }
    setIsUpdating(false);
  };

  const handleDeallocate = async (ruleId: string) => {
    setIsUpdating(true);
    const result = await deallocateStudentAction({ ruleId });
    if (result?.data?.success) {
      notify.success("Horário removido com sucesso!");
      fetchRules();
      fetchSchedule();
    } else {
      const errorMsg = (result?.data as any)?.error || "Erro ao remover horário";
      notify.error(errorMsg);
    }
    setIsUpdating(false);
  };

  const handleAssignPlan = async (planId: string, startClassId?: string) => {
    setIsUpdating(true);
    const result = await assignPlanAction({ 
      templateId: planId, 
      studentId,
      startClassId
    });
    if (result?.data?.success) {
      notify.success("Plano designado e lições vinculadas!");
      setShowAssignPlan(false);
      fetchSchedule();
      fetchGap();
      fetchPlans();
    } else {
      const errorMsg = (result?.data as any)?.error || "Erro ao designar plano";
      notify.error(errorMsg);
    }
    setIsUpdating(false);
  };

  const upcomingClasses = slots
    .filter(s => s.status === "scheduled" && new Date(s.startAt) > new Date())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <div className="space-y-6">
      {/* 0. Student Overall Progress Dashboard */}
      {gap && gap.totalClasses > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-card border rounded-xl p-5 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold">Progresso Geral do Curso</span>
              <span className="text-xs text-muted-foreground">{gap.completedClasses} / {gap.totalClasses} aulas</span>
            </div>
            <Progress value={(gap.completedClasses / gap.totalClasses) * 100} className="h-3" />
          </div>
          <div className="bg-card border rounded-xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold">{gap.classesWithLesson}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Aulas com Lição</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold min-w-[150px] text-center capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" size="icon" onClick={() => setShowPlanHistory(true)}>
                <History className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowManageCredits(true)}>
                <Coins className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setShowManageSchedule(true)}>
                <Clock className="mr-2 h-4 w-4" /> Gerenciar Horários
              </Button>
              <Button onClick={() => setShowAssignPlan(true)}>
                <BookOpen className="mr-2 h-4 w-4" /> Designar Plano
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Gap Analysis Info */}
      {gap && (gap.upcomingClassesCount > 0 || gap.planLessonsCount > 0) && (
        <div className="bg-accent/30 rounded-xl p-4 flex items-center justify-between border border-accent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Estado do Currículo</p>
              <p className="text-xs text-muted-foreground">
                {gap.planLessonsCount} lições no plano • {gap.upcomingClassesCount} aulas futuras agendadas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {gap.upcomingClassesCount > gap.planLessonsCount && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                <AlertCircle className="mr-1 h-3 w-3" /> {gap.upcomingClassesCount - gap.planLessonsCount} aulas sem lição
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Grid of Classes with Shimmer */}
      <Shimmer loading={isLoading} templateProps={{ slots: mockSlots }}>
        <CurriculumMonthView
          slots={slots}
          isAdmin={isAdmin}
          onUpdateStatus={handleUpdateStatus}
          onSwapTeacher={setSwapSlot}
          onUpdateLesson={setLessonSlot}
        />
      </Shimmer>

      {/* Vaults */}
      <CurriculumVaults
        studentId={studentId}
        isUpdating={isUpdating}
        swapSlot={swapSlot}
        setSwapSlot={setSwapSlot}
        teachers={teachers}
        onConfirmSwap={handleSwapTeacher}
        lessonSlot={lessonSlot}
        setLessonSlot={setLessonSlot}
        lessons={lessons}
        onConfirmLesson={handleUpdateLesson}
        showAssignPlan={showAssignPlan}
        setShowAssignPlan={setShowAssignPlan}
        plans={plans}
        activePlanName={gap?.activePlanName}
        upcomingClasses={upcomingClasses}
        onConfirmAssignPlan={handleAssignPlan}
        showPlanHistory={showPlanHistory}
        setShowPlanHistory={setShowPlanHistory}
        studentPlans={studentPlans}
        showManageSchedule={showManageSchedule}
        setShowManageSchedule={setShowManageSchedule}
        studentRules={studentRules}
        availableRules={availableRules}
        onConfirmAllocate={handleAllocate}
        onConfirmDeallocate={handleDeallocate}
      />

      <ManageCreditsVault
        studentId={studentId}
        open={showManageCredits}
        onOpenChange={setShowManageCredits}
        isAdmin={isAdmin}
      />
    </div>
  );
}

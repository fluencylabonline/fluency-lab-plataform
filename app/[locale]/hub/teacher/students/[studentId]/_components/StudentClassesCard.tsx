"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { format, isToday, isFuture, isPast } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
  Calendar,
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { notify } from "@/components/ui/toaster";
import { EmptyResults } from "@/components/ui/empty";
import {
  updateClassStatusAction,
  updateClassNotesAction,
  getStudentClassesByTeacherAction
} from "@/modules/scheduling/scheduling.actions";
import { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";
import { updateSlotStatusSchema } from "@/modules/scheduling/scheduling.schema";
import { useLocale } from "next-intl";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { VaultLoadingOverlay } from "@/components/ui/vault-loading-overlay";
import { VaultLoadingReportOverlay } from "@/components/ui/vault-loading-report-overlay";

interface StudentClassesCardProps {
  studentId: string;
  initialData: SlotInstanceWithDetails[];
  isMobileMode?: boolean;
}

export function StudentClassesCard({
  studentId,
  initialData,
  isMobileMode = false
}: StudentClassesCardProps) {
  const t = useTranslations("ClassesCard");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [classes, setClasses] = useState<SlotInstanceWithDetails[]>(initialData);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [selectedClass, setSelectedClass] = useState<SlotInstanceWithDetails | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [isConfirmVaultOpen, setIsConfirmVaultOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [updatingClassId, setUpdatingClassId] = useState<string | null>(null);

  // Loading Overlay states for Vault updates
  const [confirmOverlayState, setConfirmOverlayState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [confirmErrorMsg, setConfirmErrorMsg] = useState("");

  const [feedbackOverlayState, setFeedbackOverlayState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState("");

  const statusConfig = useMemo(() => ({
    scheduled: {
      label: t("scheduled"),
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
      icon: "📅"
    },
    completed: {
      label: t("completed"),
      color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
      icon: "✅"
    },
    "canceled-student": {
      label: t("canceled-student"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "❌"
    },
    "canceled-teacher": {
      label: t("canceled-teacher"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "❌"
    },
    "canceled-admin": {
      label: t("canceled-admin"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "🛡️"
    },
    "canceled-credit": {
      label: t("canceled-credit"),
      color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
      icon: "💳"
    },
    "no-show": {
      label: t("no-show"),
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
      icon: "👤"
    },
    rescheduled: {
      label: t("rescheduled"),
      color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
      icon: "📅"
    },
    "teacher-recess": {
      label: t("teacher-recess"),
      color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
      icon: "🏖️"
    },
    overdue: {
      label: t("overdue"),
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
      icon: "⏰"
    },
  }), [t]);

  const fetchClasses = async (month: number, year: number) => {
    const result = await getStudentClassesByTeacherAction({ studentId, month, year });
    if (result?.data?.success) {
      setClasses(result.data.data as SlotInstanceWithDetails[]);
    } else {
      notify.error(result?.data?.error || result?.serverError || "Error fetching classes");
    }
  };

  const handleMonthChange = (month: string) => {
    const m = parseInt(month);
    setSelectedMonth(m);
    fetchClasses(m, selectedYear);
  };

  const handleYearChange = (year: string) => {
    const y = parseInt(year);
    setSelectedYear(y);
    fetchClasses(selectedMonth, y);
  };

  const handleOpenVault = (cls: SlotInstanceWithDetails) => {
    setSelectedClass(cls);
    setFeedback(cls.notes || "");
    setIsVaultOpen(true);
  };

  const handleStatusChange = async (classId: string, status: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    if (status === "canceled-teacher" || status === "no-show") {
      setSelectedClass(cls);
      setPendingStatus(status);
      setIsConfirmVaultOpen(true);
      return;
    }

    await executeStatusUpdate(classId, status);
  };

  const executeStatusUpdate = async (classId: string, status: string) => {
    setUpdatingClassId(classId);
    const res = await updateClassStatusAction({
      classId,
      status: status as z.infer<typeof updateSlotStatusSchema>["status"]
    });

    let success = false;
    let errorMsg = "";

    if (res?.data?.success) {
      //notify.success(t("statusUpdated") || "Status atualizado!");
      await fetchClasses(selectedMonth, selectedYear);
      success = true;
    } else {
      errorMsg = res?.data?.error || res?.serverError || "Erro ao atualizar status";
      //notify.error(errorMsg);
    }
    setUpdatingClassId(null);
    return { success, error: errorMsg };
  };

  const confirmStatusUpdate = async () => {
    if (!selectedClass || !pendingStatus) return;
    
    setConfirmOverlayState("loading");
    const res = await executeStatusUpdate(selectedClass.id, pendingStatus);
    
    if (res.success) {
      setConfirmOverlayState("success");
    } else {
      setConfirmErrorMsg(res.error || "Erro ao atualizar status");
      setConfirmOverlayState("error");
    }
  };

  const handleConfirmOverlayDone = () => {
    if (confirmOverlayState === "success") {
      setConfirmOverlayState("idle");
      setTimeout(() => {
        setIsConfirmVaultOpen(false);
        setPendingStatus(null);
        setSelectedClass(null);
      }, 350);
    } else {
      setConfirmOverlayState("idle");
    }
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setFeedbackOverlayState("loading");

    try {
      // Update notes
      const resNotes = await updateClassNotesAction({
        classId: selectedClass.id,
        notes: feedback
      });
      
      if (resNotes?.data?.success) {
        setFeedbackOverlayState("success");
        await fetchClasses(selectedMonth, selectedYear);
      } else {
        throw new Error(resNotes?.data?.error || resNotes?.serverError || "Error updating notes");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error saving changes";
      setFeedbackErrorMsg(errorMessage);
      setFeedbackOverlayState("error");
    }
  };

  const handleFeedbackOverlayDone = () => {
    if (feedbackOverlayState === "success") {
      setFeedbackOverlayState("idle");
      setTimeout(() => {
        setIsVaultOpen(false);
        setSelectedClass(null);
      }, 350);
    } else {
      setFeedbackOverlayState("idle");
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: format(new Date(2024, i, 1), "MMMM", { locale: dateLocale }),
  }));

  const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  return (
    <div className={cn(
      !isMobileMode && "card p-4",
      "flex flex-col h-full"
    )}>
      <div className={cn(
        "pb-6 sticky top-0 z-10 bg-transparent",
        isMobileMode && "pt-1"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {!isMobileMode && (
            <div className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t("title")}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-0">
        <div className="space-y-3 pr-1">
          {classes.length === 0 ? (
            <EmptyResults
              title={t("noClasses") || "Nenhuma aula encontrada"}
            />
          ) : (
            classes.map((cls) => {
              const config = statusConfig[cls.status as keyof typeof statusConfig] || statusConfig.scheduled;
              const classDate = new Date(cls.startAt);
              const isTodayClass = isToday(classDate);
              const isFutureClass = isFuture(classDate);
              const isPastClass = isPast(classDate);

              return (
                <div
                  key={cls.id}
                  className="item relative overflow-hidden flex items-center gap-2 justify-between p-4 transition-all group"
                >
                  {isTodayClass && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  )}
                  {isFutureClass && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary/35" />
                  )}
                  {isPastClass && !isTodayClass && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400/35" />
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-primary/5 text-primary font-bold border border-primary/10">
                      <span className="text-[10px] uppercase opacity-70">
                        {format(classDate, "EEE", { locale: dateLocale })}
                      </span>
                      <span className="text-lg leading-tight">
                        {format(classDate, "dd")}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-semibold text-text text-sm">
                        {format(new Date(cls.startAt), "HH:mm")} - {format(new Date(cls.endAt), "HH:mm")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {updatingClassId === cls.id ? (
                      <div className={cn(
                        "h-9 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed",
                        isMobileMode
                          ? "w-[140px] sm:w-[180px]"
                          : "w-[140px] md:w-[180px] lg:w-10 xl:w-[180px]"
                      )}>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Select
                        value={cls.status}
                        onValueChange={(val) => handleStatusChange(cls.id, val)}
                        disabled={!!updatingClassId}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9 text-xs border overflow-hidden",
                            isMobileMode
                              ? "w-[140px] sm:w-[180px]"
                              : "w-[140px] md:w-[180px] lg:w-10 xl:w-[180px] lg:px-0 xl:px-3 lg:justify-center xl:justify-between lg:[&_svg]:hidden xl:[&_svg]:block",
                            config.color
                          )}
                        >
                          <SelectValue>
                            <div className="flex items-center gap-2 text-left">
                              <span className="text-sm">{config.icon}</span>
                              <span
                                className={cn(
                                  "truncate font-medium",
                                  !isMobileMode && "lg:hidden xl:inline"
                                )}
                              >
                                {config.label}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                          {Object.entries(statusConfig).map(([key, itemConfig]) => {
                            const isAllowed = ["completed", "canceled-teacher", "no-show", "scheduled"].includes(key) || key === cls.status;
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
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-md transition-colors",
                        cls.notes
                          ? "bg-green-100 hover:bg-green-200 text-green-600 dark:bg-green-950/50 dark:hover:bg-green-900/50 dark:text-green-400"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400"
                      )}
                      onClick={() => handleOpenVault(cls)}
                      disabled={!!updatingClassId}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Vault open={isVaultOpen} onOpenChange={(open) => {
        if (feedbackOverlayState !== "idle") return;
        setIsVaultOpen(open);
      }}>
        <VaultContent>
          <VaultLoadingReportOverlay
            state={feedbackOverlayState}
            loadingLabel={t("updatingFeedback") || "Salvando feedback..."}
            successLabel={t("saveSuccess") || "Feedback salvo com sucesso!"}
            errorLabel={t("saveError") || "Erro ao salvar feedback"}
            errorSub={feedbackErrorMsg}
            onDone={handleFeedbackOverlayDone}
            layoutId="feedback-vault-overlay"
          />
          <VaultHeader>
            <VaultIcon type="calendar" />
            <VaultTitle>{t("updateFeedback") || "Atualizar Feedback"}</VaultTitle>
            <VaultDescription>
              {selectedClass && format(new Date(selectedClass.startAt), "PPPP", { locale: dateLocale })}
            </VaultDescription>
          </VaultHeader>

          <VaultBody className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("feedback")}</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t("feedbackPlaceholder")}
                className="min-h-[120px] rounded-md resize-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </VaultBody>

          <VaultFooter>
            <VaultSecondaryButton onClick={() => setIsVaultOpen(false)} disabled={feedbackOverlayState !== "idle"}>
              {t("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            {feedbackOverlayState === "idle" ? (
              <VaultPrimaryButton
                onClick={handleSave}
                layoutId="feedback-vault-overlay"
              >
                {t("saveFeedback")}
              </VaultPrimaryButton>
            ) : (
              <div className="flex-1 min-w-fit px-7 py-3 h-[46px] opacity-0 pointer-events-none" />
            )}
          </VaultFooter>
        </VaultContent>
      </Vault>

      <Vault open={isConfirmVaultOpen} onOpenChange={(open) => {
        if (confirmOverlayState !== "idle") return;
        setIsConfirmVaultOpen(open);
      }}>
        <VaultContent>
          <VaultLoadingOverlay
            state={confirmOverlayState}
            loadingLabel={t("updatingStatus") || "Atualizando status..."}
            successLabel={t("statusUpdated") || "Status atualizado com sucesso!"}
            errorLabel={t("statusUpdateError") || "Erro ao atualizar status"}
            errorSub={confirmErrorMsg}
            onDone={handleConfirmOverlayDone}
            layoutId="confirm-vault-overlay"
          />
          <VaultHeader>
            <VaultIcon type="warning" />
            <VaultTitle>{t("confirmStatusChange") || "Confirmar Alteração"}</VaultTitle>
            <VaultDescription>
              {t("confirmStatusDescription") || "Você tem certeza que deseja alterar o status desta aula para"} <strong>{pendingStatus && statusConfig[pendingStatus as keyof typeof statusConfig]?.label}</strong>?
            </VaultDescription>
          </VaultHeader>

          <VaultFooter>
            <VaultSecondaryButton onClick={() => setIsConfirmVaultOpen(false)} disabled={confirmOverlayState !== "idle"}>
              {t("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            {confirmOverlayState === "idle" ? (
              <VaultPrimaryButton
                onClick={confirmStatusUpdate}
                layoutId="confirm-vault-overlay"
              >
                {t("confirm") || "Confirmar"}
              </VaultPrimaryButton>
            ) : (
              <div className="flex-1 min-w-fit px-7 py-3 h-[46px] opacity-0 pointer-events-none" />
            )}
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}

"use client";
import { Header } from "@/components/layout/header";
import { useState, useMemo } from "react";
import { CalendarView, type CalendarEvent } from "@/components/ui/calendar-view";
import { useTranslations, useLocale } from "next-intl";
import { CreditsSummary } from "./CreditsSummary";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useIsMobile } from "@/hooks/ui/use-device";
import { Badge } from "@/components/ui/badge";
import { Vault, VaultHeader, VaultTitle, VaultBody, VaultContent } from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, Ticket, HelpCircle } from "lucide-react";
import { StudentHelpWizard } from "../../_components/StudentHelpWizard";
import { useWizard } from "@/hooks/ui/use-wizard";
import { notify } from "@/components/ui/toaster";
import { cancelClassAction } from "@/modules/scheduling/scheduling.actions";
import { useRouter } from "next/navigation";
import { RescheduleVault } from "./RescheduleVault";
import { type ScheduledClass } from "@/modules/scheduling/scheduling.types";

type RescheduleStats = {
  count: number;
  limit: number;
};

type CreditBalance = {
  total: number;
  bonus: number;
  "late-students": number;
  "teacher-cancellation": number;
};

interface ScheduleCalendarProps {
  initialClasses: ScheduledClass[];
  balance: CreditBalance;
  rescheduleStats: RescheduleStats;
}

export function ScheduleCalendar({ initialClasses, balance, rescheduleStats }: ScheduleCalendarProps) {
  const t = useTranslations("Schedule");
  const th = useTranslations("StudentHelpWizard");
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [selectedEvent, setSelectedEvent] = useState<ScheduledClass | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const isMobile = useIsMobile();

  const {
    isOpen: isHelpOpen,
    setIsOpen: setIsHelpOpen,
    completeWizard: handleCompleteHelp,
  } = useWizard("student-schedule");

  const headerActions = useMemo(() => {
    const actions = [
      {
        icon: <HelpCircle className="w-5 h-5" />,
        onClick: () => setIsHelpOpen(true),
        label: th("common.helpLabel") || "Ajuda",
      }
    ];
    if (isMobile) {
      actions.push({
        icon: <Ticket className="w-5 h-5" />,
        onClick: () => setIsCreditsOpen(true),
        label: t("Credits.title") || "Créditos"
      });
    }
    return actions;
  }, [isMobile, t, th, setIsHelpOpen, setIsCreditsOpen]);

  const events = useMemo(() => {
    return initialClasses.map((cls): CalendarEvent => {
      let color = "bg-blue-500";
      switch (cls.status) {
        case "completed": color = "bg-green-500"; break;
        case "canceled-student": color = "bg-slate-400"; break;
        case "canceled-teacher": color = "bg-red-500"; break;
        case "no-show": color = "bg-amber-500"; break;
        case "teacher-recess": color = "bg-purple-500"; break;
      }

      return {
        id: cls.id,
        title: cls.lessonTitle || t("Default.classTitle") || "Aula de Inglês",
        start: new Date(cls.startAt),
        end: new Date(cls.endAt),
        color,
        extendedProps: { ...cls }
      };
    });
  }, [initialClasses, t]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event.extendedProps as ScheduledClass);
    setIsDetailOpen(true);
  };

  const handleCancel = async () => {
    if (!selectedEvent) return;

    const promise = cancelClassAction({
      classId: selectedEvent.id,
      reason: "canceled-student"
    });

    notify.promise(promise, {
      loading: t("Actions.canceling") || "Cancelando aula...",
      success: (result) => {
        if (result?.data?.success) {
          setIsDetailOpen(false);
          router.refresh();
          return t("Success.canceled") || "Aula cancelada com sucesso!";
        }
        throw new Error(result?.data?.error || t("Error.generic") || "Erro ao cancelar aula");
      },
      error: (err: unknown) => (err as Error).message || "Falha na requisição"
    });
  };

  return (
    <>
      <Header
        title={t("title")}
        subtitle={t("description")}
        actions={headerActions}
        className="contents"
      />

      <main className="container">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="order-2 lg:order-1">
            <CalendarView
              events={events}
              onEventClick={handleEventClick}
            />
          </div>

          <div className="hidden lg:flex flex-col gap-6 order-1 lg:order-2">
            <CreditsSummary balance={balance} rescheduleStats={rescheduleStats} />
          </div>

          <Vault open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <VaultContent>
              <VaultHeader>
                <VaultTitle>{selectedEvent?.lessonTitle || t("Default.classTitle") || "Detalhes da Aula"}</VaultTitle>
              </VaultHeader>
              <VaultBody>
                {selectedEvent && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{t("Details.date") || "Data"}</span>
                          <span className="text-sm font-medium">
                            {format(new Date(selectedEvent.startAt), "PPPP", { locale: dateLocale })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{t("Details.time") || "Horário"}</span>
                          <span className="text-sm font-medium">
                            {format(new Date(selectedEvent.startAt), "HH:mm")} - {format(new Date(selectedEvent.endAt), "HH:mm")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{t("Details.teacher") || "Professor"}</span>
                          <span className="text-sm font-medium">{selectedEvent.teacher?.name || "FluencyLab Teacher"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-muted-foreground">{t("Details.status") || "Status"}</span>
                      <div>
                        <Badge variant="outline" className="capitalize">
                          {selectedEvent.status.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>

                    {selectedEvent.status === "scheduled" && (
                      <div className="flex flex-col gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => {
                          setIsDetailOpen(false);
                          setIsRescheduleOpen(true);
                        }}>
                          {t("Actions.reschedule") || "Reagendar Aula"}
                        </Button>

                        <Button variant="destructive" onClick={() => setIsCancelConfirmOpen(true)}>
                          {t("Actions.cancel") || "Cancelar Aula"}
                        </Button>

                        <p className="text-[10px] text-muted-foreground text-center">
                          {t("Details.cancelPolicy") || "Cancelamentos feitos com menos de 4h de antecedência serão considerados No-Show."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </VaultBody>
            </VaultContent>
          </Vault>

          <RescheduleVault
            open={isRescheduleOpen}
            onOpenChange={setIsRescheduleOpen}
            selectedClass={selectedEvent}
            balance={balance}
            rescheduleStats={rescheduleStats}
            onSuccess={() => router.refresh()}
          />

          <Vault open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
            <VaultContent>
              <VaultHeader>
                <VaultTitle>{t("CancelConfirm.title") || "Confirmar Cancelamento"}</VaultTitle>
              </VaultHeader>
              <VaultBody>
                <div className="flex flex-col gap-4 py-2">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("CancelConfirm.description") || "Você tem certeza que deseja cancelar esta aula? Esta ação não pode ser desfeita."}
                  </p>
                  
                  <div className="flex flex-col gap-3 pt-4">
                    <Button variant="destructive" className="w-full" onClick={handleCancel}>
                      {t("CancelConfirm.confirm") || "Sim, cancelar aula"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setIsCancelConfirmOpen(false)}>
                      {t("CancelConfirm.back") || "Voltar"}
                    </Button>
                  </div>
                </div>
              </VaultBody>
            </VaultContent>
          </Vault>
        </div>
      </main>

      <Vault open={isCreditsOpen} onOpenChange={setIsCreditsOpen}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>{t("Credits.title") || "Seus Créditos"}</VaultTitle>
          </VaultHeader>
          <VaultBody>
            <div className="py-4">
              <CreditsSummary balance={balance} rescheduleStats={rescheduleStats} />
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>

      <StudentHelpWizard
        page="schedule"
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        onComplete={handleCompleteHelp}
      />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { CalendarView, CalendarEvent } from "@/components/ui/calendar-view";
import { CreateSlotVault } from "@/modules/scheduling/_components/CreateSlotVault";
import { SlotDetailsVault } from "@/modules/scheduling/_components/SlotDetailsVault";
import { CommunicateRecessVault } from "./CommunicateRecessVault";
import { CheckRecessVault } from "./CheckRecessVault";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useDevice } from "@/hooks/ui/use-device";

interface TeacherScheduleClientProps {
  teacherId: string;
  initialEvents: CalendarEvent[];
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

export function TeacherScheduleClient({
  teacherId,
  initialEvents,
  user,
}: TeacherScheduleClientProps) {
  const t = useTranslations("UserManagement");
  const tRecess = useTranslations("Recess");
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const { isMobile, isStandalone } = useDevice();
  const showInHeader = isMobile || isStandalone;

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOptimisticCreate = (data: {
    startDate: Date;
    startTime: string;
    endTime: string;
    type: string;
    frequency: string;
    endDate?: Date | null;
  }) => {
    const startHour = parseInt(data.startTime.split(":")[0]);
    const startMin = parseInt(data.startTime.split(":")[1]);
    const endHour = parseInt(data.endTime.split(":")[0]);
    const endMin = parseInt(data.endTime.split(":")[1]);

    const newOptimisticEvents: CalendarEvent[] = [];
    const baseDate = new Date(data.startDate);

    const limit = data.frequency === "NONE" ? 1 : 12;
    const current = new Date(baseDate);

    for (let i = 0; i < limit; i++) {
      if (data.endDate && current > new Date(data.endDate)) {
        break;
      }

      const start = new Date(current);
      start.setHours(startHour, startMin, 0, 0);

      const end = new Date(current);
      end.setHours(endHour, endMin, 0, 0);

      newOptimisticEvents.push({
        id: `optimistic-${Date.now()}-${i}`,
        title: data.type === "REPOSICAO" ? "Reposição" : "Disponível",
        start,
        end,
        status: "available",
        type: data.type === "REPOSICAO" ? "replacement" : "normal",
        isOptimistic: true,
      });

      if (data.frequency === "WEEKLY") {
        current.setDate(current.getDate() + 7);
      } else if (data.frequency === "BIWEEKLY") {
        current.setDate(current.getDate() + 14);
      } else if (data.frequency === "MONTHLY") {
        current.setMonth(current.getMonth() + 1);
      } else {
        break;
      }
    }

    setEvents((prev) => [...prev, ...newOptimisticEvents]);
  };

  const handleOptimisticCreateBatch = (rules: {
    startDate: Date;
    startTime: string;
    endTime: string;
    type: string;
    frequency: string;
    endDate?: Date | null;
  }[]) => {
    const newOptimisticEvents: CalendarEvent[] = [];

    rules.forEach((data, ruleIndex) => {
      const startHour = parseInt(data.startTime.split(":")[0]);
      const startMin = parseInt(data.startTime.split(":")[1]);
      const endHour = parseInt(data.endTime.split(":")[0]);
      const endMin = parseInt(data.endTime.split(":")[1]);

      const baseDate = new Date(data.startDate);
      const limit = data.frequency === "NONE" ? 1 : 12;
      const current = new Date(baseDate);

      for (let i = 0; i < limit; i++) {
        if (data.endDate && current > new Date(data.endDate)) {
          break;
        }

        const start = new Date(current);
        start.setHours(startHour, startMin, 0, 0);

        const end = new Date(current);
        end.setHours(endHour, endMin, 0, 0);

        newOptimisticEvents.push({
          id: `optimistic-${Date.now()}-${ruleIndex}-${i}`,
          title: data.type === "REPOSICAO" ? "Reposição" : "Disponível",
          start,
          end,
          status: "available",
          type: data.type === "REPOSICAO" ? "replacement" : "normal",
          isOptimistic: true,
        });

        if (data.frequency === "WEEKLY") {
          current.setDate(current.getDate() + 7);
        } else if (data.frequency === "BIWEEKLY") {
          current.setDate(current.getDate() + 14);
        } else if (data.frequency === "MONTHLY") {
          current.setMonth(current.getMonth() + 1);
        } else {
          break;
        }
      }
    });

    setEvents((prev) => [...prev, ...newOptimisticEvents]);
  };

  const handleOptimisticCancel = () => {
    setEvents((prev) => prev.filter((e) => !e.isOptimistic));
  };

  const renderCreateButton = (iconOnly: boolean) => (
    <Button 
      onClick={() => setIsCreateOpen(true)}
      variant={iconOnly ? "ghost" : "default"}
      size={iconOnly ? "icon" : "sm"}
      className={iconOnly ? "h-10 w-10 text-muted-foreground hover:text-foreground" : "h-10"}
    >
      {iconOnly ? (
        <>
          <Plus className="w-5 h-5 stroke-[3]" />
          <span className="sr-only">{t("createSlot") || "Criar Horário"}</span>
        </>
      ) : (
        <>
          <Plus className="w-3 h-3 mr-2 stroke-[3]" />
          {t("createSlot") || "Criar Horário"}
        </>
      )}
    </Button>
  );

  const renderRecessLibraryButton = (iconOnly: boolean) => (
    <Button
      onClick={() => router.push("/hub/teacher/recess")}
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      className={iconOnly ? "h-10 w-10 text-muted-foreground hover:text-foreground" : "h-10"}
    >
      {iconOnly ? (
        <>
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="sr-only">{tRecess("recessLibrary") || "Atividades de Recesso"}</span>
        </>
      ) : (
        <>
          <BookOpen className="w-4 h-4 mr-2 text-primary" />
          {tRecess("recessLibrary") || "Atividades de Recesso"}
        </>
      )}
    </Button>
  );

  const headerActionsList = [
    {
      component: renderCreateButton(true)
    },
    {
      component: renderRecessLibraryButton(true)
    },
    {
      component: <CheckRecessVault teacherId={teacherId} iconOnly />
    },
    {
      component: <CommunicateRecessVault teacherId={teacherId} iconOnly />
    }
  ];

  const calendarActions = (
    <div className="flex items-center gap-2">
      {renderCreateButton(false)}
      {renderRecessLibraryButton(false)}
      <CheckRecessVault teacherId={teacherId} />
      <CommunicateRecessVault teacherId={teacherId} />
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <Header 
        title="Minha Agenda" 
        subtitle="Gerencie suas aulas e períodos de recesso"
        className="contents"
        user={user}
        actions={showInHeader ? headerActionsList : undefined}
      />

      <div className="px-4 pb-10">
        <CalendarView
          events={events}
          onEventClick={handleEventClick}
          onDateClick={setSelectedDate}
          headerActions={!showInHeader ? calendarActions : undefined}
        />
      </div>

      <CreateSlotVault
        teacherId={teacherId}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleRefresh}
        initialDate={selectedDate}
        onOptimisticCreate={handleOptimisticCreate}
        onOptimisticCreateBatch={handleOptimisticCreateBatch}
        onOptimisticCancel={handleOptimisticCancel}
      />

      {selectedEvent && (
        <SlotDetailsVault
          teacherId={teacherId}
          event={selectedEvent}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

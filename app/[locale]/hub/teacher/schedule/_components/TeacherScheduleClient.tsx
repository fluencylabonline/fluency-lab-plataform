"use client";

import { useState } from "react";
import { CalendarView, CalendarEvent } from "@/components/ui/calendar-view";
import { CreateSlotVault } from "@/modules/scheduling/_components/CreateSlotVault";
import { SlotDetailsVault } from "@/modules/scheduling/_components/SlotDetailsVault";
import { CommunicateRecessVault } from "./CommunicateRecessVault";
import { CheckRecessVault } from "./CheckRecessVault";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { isMobile, isStandalone } = useDevice();
  const showInHeader = isMobile || isStandalone;

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
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

  const headerActionsList = [
    {
      component: renderCreateButton(true)
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
          events={initialEvents}
          onEventClick={handleEventClick}
          headerActions={!showInHeader ? calendarActions : undefined}
        />
      </div>

      <CreateSlotVault
        teacherId={teacherId}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleRefresh}
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

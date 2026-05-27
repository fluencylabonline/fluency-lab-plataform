"use client";

import React, { useState } from "react";
import { CalendarView, CalendarEvent } from "@/components/ui/calendar-view";
import { CreateSlotVault } from "@/modules/scheduling/_components/CreateSlotVault";
import { SlotDetailsVault } from "@/modules/scheduling/_components/SlotDetailsVault";
import { CommunicateRecessVault } from "./CommunicateRecessVault";
import { CheckRecessVault } from "./CheckRecessVault";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface TeacherScheduleClientProps {
  teacherId: string;
  initialEvents: CalendarEvent[];
}

export function TeacherScheduleClient({
  teacherId,
  initialEvents,
}: TeacherScheduleClientProps) {
  const t = useTranslations("UserManagement");
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <CalendarView
        events={initialEvents}
        onEventClick={handleEventClick}
        headerActions={
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsCreateOpen(true)}
              variant="default"
              size="sm"
            >
              <Plus className="w-3 h-3 mr-2 stroke-[3]" />
              {t("createSlot") || "Criar Horário"}
            </Button>
            <CheckRecessVault teacherId={teacherId} />
            <CommunicateRecessVault teacherId={teacherId} />
          </div>
        }
      />

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
    </>
  );
}

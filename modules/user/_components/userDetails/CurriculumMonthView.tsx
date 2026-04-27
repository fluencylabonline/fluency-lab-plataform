"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";
import { ClassCard } from "./ClassCard";


interface CurriculumMonthViewProps {
  slots: SlotInstanceWithDetails[];
  isAdmin: boolean;
  onUpdateStatus: (slotId: string, status: SlotInstanceWithDetails["status"]) => void;
  onSwapTeacher: (slot: SlotInstanceWithDetails) => void;
  onUpdateLesson: (slot: SlotInstanceWithDetails) => void;
}


export function CurriculumMonthView({
  slots,
  isAdmin,
  onUpdateStatus,
  onSwapTeacher,
  onUpdateLesson
}: CurriculumMonthViewProps) {
  // Group slots by month
  const groupedSlots = slots.reduce((acc: Record<string, SlotInstanceWithDetails[]>, slot) => {
    const monthKey = format(new Date(slot.startAt), "yyyy-MM");
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(slot);
    return acc;
  }, {});


  // Sort months chronologically
  const sortedMonths = Object.keys(groupedSlots).sort();

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl border-muted">
        <p className="text-muted-foreground">Nenhuma aula agendada ou gerada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {sortedMonths.map((monthKey) => {
        const monthDate = parseISO(`${monthKey}-01`);
        const monthSlots = [...groupedSlots[monthKey]].sort((a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        );


        return (
          <div key={monthKey} className="space-y-4">
            <h3 className="text-lg font-bold capitalize flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              {format(monthDate, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthSlots.map((slot) => (
                <ClassCard
                  key={slot.id}
                  slot={slot}
                  isAdmin={isAdmin}
                  onUpdateStatus={onUpdateStatus}
                  onSwapTeacher={onSwapTeacher}
                  onUpdateLesson={onUpdateLesson}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

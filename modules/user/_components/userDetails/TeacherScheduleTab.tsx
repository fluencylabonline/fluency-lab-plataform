"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  Clock,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Plus,
  Search
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { notify } from "@/components/ui/toaster";
import { getTeacherScheduleAction } from "@/modules/scheduling/scheduling.actions";
import { CalendarView, CalendarEvent } from "@/components/ui/calendar-view";
import { WeeklyCalendarView } from "@/components/ui/weekly-calendar-view";
import { CreateSlotVault } from "@/modules/scheduling/_components/CreateSlotVault";
import { SlotDetailsVault } from "@/modules/scheduling/_components/SlotDetailsVault";
import { cn } from "@/lib/utils";
import { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeacherScheduleTabProps {
  teacherId: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    case "canceled-student":
    case "canceled-teacher":
    case "canceled-admin":
      return <XCircle className="w-3 h-3 text-rose-500" />;
    case "no-show": return <AlertCircle className="w-3 h-3 text-amber-500" />;
    default: return <Clock className="w-3 h-3 text-primary" />;
  }
};

export function TeacherScheduleTab({ teacherId }: TeacherScheduleTabProps) {
  const t = useTranslations("UserManagement");

  const [schedule, setSchedule] = useState<SlotInstanceWithDetails[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isCreateVaultOpen, setIsCreateVaultOpen] = useState(false);

  const [searchStudent, setSearchStudent] = useState("");
  const [classTypeFilter, setClassTypeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("weekly");

  const fetchedMonths = useRef<Set<string>>(new Set());

  const fetchSchedule = useCallback(async (m: number, y: number, range = 1) => {
    const monthsToFetch = [];
    for (let i = 0; i < range; i++) {
      const d = new Date(y, m + i, 1);
      const monthKey = format(d, "yyyy-MM");
      if (!fetchedMonths.current.has(monthKey)) {
        monthsToFetch.push({ month: d.getMonth(), year: d.getFullYear(), key: monthKey });
      }
    }

    if (monthsToFetch.length === 0) return;

    monthsToFetch.forEach(m => fetchedMonths.current.add(m.key));
    setIsFetching(true);

    try {
      const results = await Promise.all(
        monthsToFetch.map(item => getTeacherScheduleAction({
          teacherId,
          month: item.month,
          year: item.year
        }))
      );

      const allNewData: SlotInstanceWithDetails[] = [];
      results.forEach(result => {
        const response = result?.data;
        if (response?.success) {
          allNewData.push(...(response.data || []));
        }
      });

      if (allNewData.length > 0) {
        setSchedule(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const filtered = allNewData.filter(s => !existingIds.has(s.id));
          return [...prev, ...filtered].sort((a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          );
        });
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      notify.error(t("errorFetchingSchedule"));
      monthsToFetch.forEach(m => fetchedMonths.current.delete(m.key));
    } finally {
      setIsFetching(false);
    }
  }, [teacherId, t]);

  useEffect(() => {
    const init = async () => {
      const now = new Date();
      await fetchSchedule(now.getMonth(), now.getFullYear(), 6);
      setIsInitialLoading(false);
    };
    init();
  }, [fetchSchedule]);

  const handleActionSuccess = () => {
    fetchedMonths.current.clear();
    setSchedule([]);
    const now = new Date();
    fetchSchedule(now.getMonth(), now.getFullYear(), 6);
  };

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    let filtered = schedule;

    if (searchStudent) {
      const lowerSearch = searchStudent.toLowerCase();
      filtered = filtered.filter(slot => 
        slot.student?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    if (classTypeFilter !== "ALL") {
      filtered = filtered.filter(slot => {
        const type = slot.type || "NORMAL";
        if (classTypeFilter === "REPLACEMENT") return type === "REPOSICAO";
        if (classTypeFilter === "REGULAR") return type !== "REPOSICAO";
        return true;
      });
    }

    return filtered.map(slot => ({
      id: slot.id,
      title: slot.student?.name || t("noStudent") || "Sem Aluno",
      studentName: slot.student?.name || undefined,
      start: new Date(slot.startAt),
      end: new Date(slot.endAt),
      status: slot.status,
      type: slot.type || "NORMAL",
      isRecurring: !!slot.ruleId,
      ruleStartDate: slot.rule?.startDate ? new Date(slot.rule.startDate) : undefined,
      ruleEndDate: slot.rule?.endDate ? new Date(slot.rule.endDate) : null,
      location: (slot.lessonTitle || slot.planName) || undefined,
      lessonTitle: slot.lessonTitle || undefined,
      lessonId: slot.lessonId || undefined,
      planId: slot.planId || undefined,
      planName: slot.planName || undefined,
      studentId: slot.studentId || undefined,
      assignedPlanId: slot.student?.assignedPlanId || undefined,
      isActive: slot.student?.isActive ?? undefined,
      rescheduledFrom: slot.rescheduledFrom || undefined
    }));
  }, [schedule, t, searchStudent, classTypeFilter]);

  const renderEventCard = useCallback((event: CalendarEvent) => (
    <div key={event.id} className="p-4 rounded-md border border-white/10 bg-muted space-y-3 hover:border-primary/50 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text group-hover:text-primary transition-colors">
              {event.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              {getStatusIcon(event.status || "")}
              <span className="capitalize">{(event.status || "").replace("-", " ")}</span>
              <span>•</span>
              <span>{event.isRecurring ? "Recorrente" : "Única"}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline" className={cn(
            "text-[8px] font-black uppercase tracking-tighter mb-1",
            event.type === "REPOSICAO" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
          )}>
            {event.type === "REPOSICAO" ? "Reposição" : "Regular"}
          </Badge>
          <div className="text-[10px] font-black text-text tracking-widest uppercase">
            {format(event.start, "HH:mm")}
          </div>
        </div>
      </div>

      {event.location && (
        <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-muted-foreground font-bold italic">
          <BookOpen className="w-3 h-3" />
          {event.location}
        </div>
      )}
    </div>
  ), []);

  const handleMonthChange = useCallback((date: Date) => {
    fetchSchedule(date.getMonth(), date.getFullYear());
  }, [fetchSchedule]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsVaultOpen(true);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="grid lg:grid-cols-[1fr_400px] gap-0 animate-pulse bg-white/5 border border-white/5 rounded-md h-[700px]">
        <div className="border-r border-white/5" />
        <div className="p-6 space-y-4" />
      </div>
    );
  }

  const CreateButton = (
    <Button
      onClick={() => setIsCreateVaultOpen(true)}
      className="rounded-md gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-8 lg:h-9 text-[10px] uppercase tracking-widest px-4"
    >
      <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
      <span className="hidden sm:inline">Novo Horário</span>
      <span className="sm:hidden">Novo</span>
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/50 p-4 rounded-md border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar aluno..." 
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={classTypeFilter} onValueChange={setClassTypeFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Tipo de aula" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as aulas</SelectItem>
              <SelectItem value="REGULAR">Aulas Regulares</SelectItem>
              <SelectItem value="REPLACEMENT">Aulas de Reposição</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 bg-background p-1 rounded-md border border-white/5 w-full sm:w-auto">
          <Button 
            variant={viewMode === "weekly" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("weekly")}
            className="h-7 text-[10px] uppercase tracking-widest font-bold flex-1 sm:flex-none"
          >
            Semanal
          </Button>
          <Button 
            variant={viewMode === "monthly" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("monthly")}
            className="h-7 text-[10px] uppercase tracking-widest font-bold flex-1 sm:flex-none"
          >
            Mensal
          </Button>
        </div>
      </div>

      {viewMode === "weekly" ? (
        <WeeklyCalendarView
          events={calendarEvents}
          onWeekChange={handleMonthChange}
          onEventClick={handleEventClick}
          renderEventCard={renderEventCard}
          isLoading={isFetching || isInitialLoading}
          headerActions={CreateButton}
        />
      ) : (
        <CalendarView
          events={calendarEvents}
          onMonthChange={handleMonthChange}
          onEventClick={handleEventClick}
          renderEventCard={renderEventCard}
          isLoading={isFetching || isInitialLoading}
          headerActions={CreateButton}
        />
      )}

      <CreateSlotVault
        teacherId={teacherId}
        isOpen={isCreateVaultOpen}
        onOpenChange={setIsCreateVaultOpen}
        onSuccess={handleActionSuccess}
      />

      <SlotDetailsVault
        teacherId={teacherId}
        event={selectedEvent}
        isOpen={isVaultOpen}
        onOpenChange={setIsVaultOpen}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
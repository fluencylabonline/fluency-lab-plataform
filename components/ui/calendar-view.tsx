"use client";

import * as React from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  isToday,
  parseISO,
  startOfToday,
  getWeekOfMonth,
  isSameWeek,
  isWithinInterval
} from "date-fns";
import type { Locale as DateLocale } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp, Clock, User } from "lucide-react";
import { Shimmer } from "@shimmer-from-structure/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  color?: string;
  type?: string;
  isRecurring?: boolean;
  ruleStartDate?: Date;
  ruleEndDate?: Date | null;
  status?: string;
  location?: string;
  studentId?: string;
  studentName?: string;
  assignedPlanId?: string;
  lessonId?: string;
  notes?: string;
  isActive?: boolean;
  [key: string]: unknown;
}


interface CalendarViewProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onMonthChange?: (date: Date) => void;
  renderEventCard?: (event: CalendarEvent) => React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  isLoading?: boolean;
}

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date;
  eventsByDay: Record<string, CalendarEvent[]>;
  onDateClick: (date: Date) => void;
  weekDays: string[];
  dateLocale: DateLocale;
}

const CalendarGrid = React.memo(({
  currentDate,
  selectedDate,
  eventsByDay,
  onDateClick,
  weekDays,
  dateLocale
}: CalendarGridProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: dateLocale });
  const endDate = endOfWeek(monthEnd, { locale: dateLocale });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-7 border-y border-white/5 bg-muted-foreground/30">
        {weekDays.map((day: string) => (
          <div key={day} className="py-2 lg:py-4 text-center text-[9px] lg:text-[10px] font-black text-muted-foreground tracking-[0.1em] lg:tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dayEvents = eventsByDay[dateKey] || [];
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={day.toString()}
              onClick={() => onDateClick(day)}
              className={cn(
                "aspect-square lg:aspect-auto lg:min-h-[100px] p-1 lg:p-2 border-b border-r border-white/5 cursor-pointer transition-all duration-200 group relative",
                !isCurrentMonth && "bg-muted-foreground/30 opacity-20",
                isSelected && "bg-primary/10",
                "hover:bg-primary/15"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-[10px] lg:text-xs font-bold w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-sm transition-colors",
                  isToday(day) && !isSelected && "text-primary",
                  isSelected && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {hasEvents && (
                  <div className="lg:hidden flex justify-center mt-auto pb-1">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                  </div>
                )}
                <div className="hidden lg:flex flex-col gap-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event: CalendarEvent) => (
                    <div key={event.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-primary/10 border border-white/10 text-text/20 truncate">
                      {format(event.start, "HH:mm")} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[8px] font-black text-muted-foreground pl-1 uppercase tracking-tighter">
                      + {dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CalendarGrid.displayName = "CalendarGrid";

interface WeekSectionProps {
  weekNumber: number;
  events: CalendarEvent[];
  dateLocale: DateLocale;
  locale: string;
  renderEventCard?: (event: CalendarEvent) => React.ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  isExpandedInitially: boolean;
  selectedDate: Date | null;
  setDayRef: (key: string, el: HTMLDivElement | null) => void;
}

const WeekSection = React.memo(({
  weekNumber,
  events,
  dateLocale,
  locale,
  renderEventCard,
  onEventClick,
  isExpandedInitially,
  selectedDate,
  setDayRef
}: WeekSectionProps) => {
  const [isExpanded, setIsExpanded] = React.useState(isExpandedInitially);

  // Corrigido: Sincroniza estado inicial caso mude via props (navegação externa)
  React.useEffect(() => {
    setIsExpanded(isExpandedInitially);
  }, [isExpandedInitially]);

  const weekStart = startOfWeek(events.length > 0 ? events[0].start : new Date(), { locale: dateLocale });
  const weekEnd = endOfWeek(weekStart, { locale: dateLocale });

  React.useEffect(() => {
    if (selectedDate && isWithinInterval(selectedDate, { start: weekStart, end: weekEnd })) {
      setIsExpanded(true);
    }
  }, [selectedDate, weekStart, weekEnd]);

  const eventsByDay = React.useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event: CalendarEvent) => {
      const dateKey = format(event.start, "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [events]);

  // Corrigido: Gera todos os 7 dias da semana para garantir que o ref exista, mesmo em dias vazios.
  const daysInWeek = React.useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  return (
    <div className="flex flex-col border border-white/5 rounded-md bg-muted/50 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3 lg:p-4 hover:bg-white/[0.05] transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {locale === "pt" ? `Semana ${weekNumber}` : `Week ${weekNumber}`}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground/80">
              {format(weekStart, "d MMM")} - {format(weekEnd, "d MMM")}
            </span>
          </div>
          <Badge variant="outline" className="text-[9px] font-black bg-primary/5 text-primary border-primary/20 px-1.5 h-5">
            {events.length} {locale === "pt" ? "aulas" : "classes"}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 lg:p-4 pt-0 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
          {daysInWeek.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay[dateKey] || [];
            const isDaySelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === dateKey;

            // Corrigido: Dia sem evento recebe o ref, mas fica oculto caso não esteja selecionado.
            if (dayEvents.length === 0 && !isDaySelected) {
              return <div key={dateKey} ref={(el) => setDayRef(dateKey, el)} className="hidden" />;
            }

            return (
              <div
                key={dateKey}
                ref={(el) => setDayRef(dateKey, el)}
                className={cn(
                  "flex flex-col gap-3 p-2 rounded-md transition-all duration-500",
                  isDaySelected && "bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_20px_-10px_rgba(var(--primary),0.3)]"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter opacity-40",
                    isDaySelected && "text-primary opacity-100"
                  )}>
                    {format(day, "EEEE, d MMM", { locale: dateLocale })}
                  </span>
                </div>

                {dayEvents.length === 0 && isDaySelected && (
                  <div className="text-[10px] text-muted-foreground italic px-1">
                    {locale === "pt" ? "Sem eventos neste dia." : "No events on this day."}
                  </div>
                )}

                {dayEvents.map((event) => (
                  <div key={event.id} onClick={() => onEventClick?.(event)} className="cursor-pointer">
                    {renderEventCard ? renderEventCard(event) : (
                      <div className="p-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-all space-y-3 group">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase tracking-tighter border-white/10",
                            event.type === "replacement" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          )}>
                            {event.type === "replacement" ? (locale === "pt" ? "Reposição" : "Replacement") : (locale === "pt" ? "Regular" : "Regular")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {format(event.start, "HH:mm")}
                          </div>
                          {event.studentName && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              {event.studentName}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

WeekSection.displayName = "WeekSection";

interface MonthSectionProps {
  monthKey: string;
  monthEvents: CalendarEvent[];
  dateLocale: DateLocale;
  locale: string;
  renderEventCard?: (event: CalendarEvent) => React.ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  setMonthRef: (key: string, el: HTMLDivElement | null) => void;
  selectedDate: Date | null;
  setDayRef: (key: string, el: HTMLDivElement | null) => void;
}

const MonthSection = React.memo(({
  monthKey,
  monthEvents,
  dateLocale,
  locale,
  renderEventCard,
  onEventClick,
  setMonthRef,
  selectedDate,
  setDayRef
}: MonthSectionProps) => {
  const monthDate = parseISO(`${monthKey}-01`);

  const eventsByWeek = React.useMemo(() => {
    const weeks: Record<number, CalendarEvent[]> = {};
    monthEvents.forEach((event: CalendarEvent) => {
      const weekNum = getWeekOfMonth(event.start, { locale: dateLocale });
      if (!weeks[weekNum]) weeks[weekNum] = [];
      weeks[weekNum].push(event);
    });
    return weeks;
  }, [monthEvents, dateLocale]);

  const sortedWeekNumbers = Object.keys(eventsByWeek).map(Number).sort((a, b) => a - b);
  const today = startOfToday();

  // Corrigido: Função estável para evitar o Warning de Strict Mode
  const assignRef = React.useCallback((el: HTMLDivElement | null) => {
    setMonthRef(monthKey, el);
  }, [monthKey, setMonthRef]);

  return (
    <div
      data-month={monthKey}
      ref={assignRef}
      className="space-y-4"
    >
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80 sticky top-0 bg-muted-foreground/15 backdrop-blur-md px-2 py-3 z-10 border-b border-white/5">
        {format(monthDate, "MMMM 'de' yyyy", { locale: dateLocale })}
      </h3>

      <div className="flex flex-col gap-3 px-2">
        {sortedWeekNumbers.length > 0 ? (
          sortedWeekNumbers.map((weekNum) => {
            const weekEvents = eventsByWeek[weekNum];
            const isCurrentWeek = weekEvents.some(e => isSameWeek(e.start, today, { locale: dateLocale }));
            return (
              <WeekSection
                key={weekNum}
                weekNumber={weekNum}
                events={weekEvents}
                dateLocale={dateLocale}
                locale={locale}
                renderEventCard={renderEventCard}
                onEventClick={onEventClick}
                isExpandedInitially={isCurrentWeek || sortedWeekNumbers.indexOf(weekNum) === 0}
                selectedDate={selectedDate}
                setDayRef={setDayRef}
              />
            );
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center opacity-20 border border-dashed border-white/10 rounded-md">
            <CalendarIcon className="w-6 h-6 mb-2 text-muted-foreground" />
            <p className="text-[9px] font-bold uppercase tracking-widest">
              {locale === "pt" ? "Nenhuma aula programada" : "No classes scheduled"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

MonthSection.displayName = "MonthSection";

export function CalendarView({
  events = [],
  onDateClick,
  onEventClick,
  onMonthChange,
  renderEventCard,
  className,
  headerActions,
  isLoading
}: CalendarViewProps) {
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [currentDate, setCurrentDate] = React.useState(startOfToday());
  const [selectedDate, setSelectedDate] = React.useState(startOfToday());
  const listRef = React.useRef<HTMLDivElement>(null);
  const monthRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const dayRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingManually = React.useRef(false);
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Corrigido: Memory Leak no unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Corrigido: Funções estáveis para guardar Refs sem forçar recriação
  const setMonthRef = React.useCallback((key: string, el: HTMLDivElement | null) => {
    monthRefs.current[key] = el;
  }, []);

  const setDayRef = React.useCallback((key: string, el: HTMLDivElement | null) => {
    dayRefs.current[key] = el;
  }, []);

  // Corrigido: Range de meses dinâmico baseado no histórico + meses adjacentes
  const displayedMonths = React.useMemo(() => {
    const dates = events.map(e => e.start.getTime());
    const today = startOfToday().getTime();

    // Garante no mínimo um escopo de 6 meses no passado e 6 no futuro
    const minBase = subMonths(today, 6).getTime();
    const maxBase = addMonths(today, 6).getTime();

    const minDate = new Date(Math.min(...dates, minBase));
    const maxDate = new Date(Math.max(...dates, maxBase));

    const range: string[] = [];
    let current = startOfMonth(minDate);
    const end = startOfMonth(maxDate);

    while (current <= end) {
      range.push(format(current, "yyyy-MM"));
      current = addMonths(current, 1);
    }
    return range;
  }, [events]);

  const eventsByMonth = React.useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const monthKey = format(event.start, "yyyy-MM");
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(event);
    });
    return groups;
  }, [events]);

  const eventsByDay = React.useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = format(event.start, "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [events]);

  const onMonthChangeRef = React.useRef(onMonthChange);
  React.useEffect(() => {
    onMonthChangeRef.current = onMonthChange;
  }, [onMonthChange]);

  const handleMonthChange = React.useCallback((newDate: Date) => {
    const newMonthKey = format(newDate, "yyyy-MM");
    setCurrentDate((prev) => {
      const prevKey = format(prev, "yyyy-MM");

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onMonthChangeRef.current?.(newDate);
      }, 300);

      if (prevKey === newMonthKey) return prev;
      return newDate;
    });
  }, []);

  const scrollToMonth = React.useCallback((monthKey: string) => {
    const ref = monthRefs.current[monthKey];
    if (ref && listRef.current) {
      isScrollingManually.current = true;

      const [year, month] = monthKey.split("-").map(Number);
      handleMonthChange(new Date(year, month - 1, 1));

      ref.scrollIntoView({ behavior: "smooth", block: "start" });

      setTimeout(() => {
        isScrollingManually.current = false;
      }, 1000);
    }
  }, [handleMonthChange]);

  // Corrigido: Race condition com retentativas e verificação segura
  const scrollToDay = React.useCallback((dateKey: string) => {
    const [year, month] = dateKey.split("-").map(Number);
    const monthKey = dateKey.substring(0, 7);

    isScrollingManually.current = true;
    handleMonthChange(new Date(year, month - 1, 1));

    const attemptScroll = (attempts = 0) => {
      const dayRef = dayRefs.current[dateKey];

      if (dayRef) {
        dayRef.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          isScrollingManually.current = false;
        }, 1000);
      } else if (attempts < 10) {
        // Tenta por ~500ms esperar o react renderizar o WeekSection expandido
        setTimeout(() => attemptScroll(attempts + 1), 50);
      } else {
        // Fallback pro mês
        const mRef = monthRefs.current[monthKey];
        if (mRef) mRef.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          isScrollingManually.current = false;
        }, 1000);
      }
    };

    attemptScroll();
  }, [handleMonthChange]);

  React.useEffect(() => {
    const todayKey = format(startOfToday(), "yyyy-MM");
    setTimeout(() => scrollToMonth(todayKey), 200);
  }, [scrollToMonth]);

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (isScrollingManually.current) return;

      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visibleEntries.length > 0) {
        const topEntry = visibleEntries[0];
        const monthKey = topEntry.target.getAttribute("data-month");
        if (monthKey) {
          const [year, month] = monthKey.split("-").map(Number);
          handleMonthChange(new Date(year, month - 1, 1));
        }
      }
    }, {
      root: listRef.current,
      threshold: [0, 0.1, 0.2, 0.5],
      rootMargin: "-10% 0px -80% 0px"
    });

    const currentRefs = monthRefs.current;
    Object.values(currentRefs).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [handleMonthChange, events, displayedMonths]);

  const weekDays = React.useMemo(() => locale === "pt"
    ? ["DOM.", "SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SÁB."]
    : ["SUN.", "MON.", "TUE.", "WED.", "THU.", "FRI.", "SAT."], [locale]);

  // Corrigido: `onDateClick` encapsulado em useCallback para não quebrar memoização
  const handleGridDateClick = React.useCallback((day: Date) => {
    setSelectedDate(day);
    onDateClick?.(day);
    scrollToDay(format(day, "yyyy-MM-dd"));
  }, [onDateClick, scrollToDay]);

  // Corrigido: Removido `shadow-2xl` e altura baseada em dvh para evitar problemas com header
  return (
    <div className={cn("flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-0 backdrop-blur-xl border border-white/5 rounded-md overflow-hidden h-[85dvh] lg:h-[85dvh]", className)}>
      <div className="flex flex-col border-r border-foreground/10 bg-card/50 sticky top-0 lg:relative z-20">
        <div className="flex items-center justify-between p-4 lg:p-6 bg-background/80 dark:bg-background/40 lg:bg-background dark:lg:bg-background/50 backdrop-blur-md lg:backdrop-blur-none">
          <h2 className="text-md lg:text-xl font-black capitalize tracking-tight text-text">
            {format(currentDate, "MMMM 'de' yyyy", { locale: dateLocale })}
          </h2>
          <div className="flex items-center gap-2">
            {headerActions}
            <Button variant="outline" size="sm" onClick={() => {
              const today = startOfToday();
              setSelectedDate(today);
              scrollToDay(format(today, "yyyy-MM-dd"));
            }} className="h-8 lg:h-9 text-[10px] font-black uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-md">
              {locale === "pt" ? "Hoje" : "Today"}
            </Button>
            <div className="flex items-center bg-white/5 rounded-md border border-white/10 p-1">
              <Button variant="ghost" size="icon" onClick={(e) => {
                e.stopPropagation();
                const prev = subMonths(currentDate, 1);
                scrollToMonth(format(prev, "yyyy-MM"));
              }} className="h-7 w-7 hover:bg-white/10 rounded-sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => {
                e.stopPropagation();
                const next = addMonths(currentDate, 1);
                scrollToMonth(format(next, "yyyy-MM"));
              }} className="h-7 w-7 hover:bg-white/10 rounded-sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          eventsByDay={eventsByDay}
          onDateClick={handleGridDateClick}
          dateLocale={dateLocale}
          weekDays={weekDays}
        />
      </div>

      <div
        ref={listRef}
        className="flex flex-col bg-card relative h-[450px] lg:h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <div className="flex flex-col space-y-12">
          <Shimmer
            loading={isLoading}
            templateProps={{
              monthKey: format(startOfToday(), "yyyy-MM"),
              monthEvents: Array(3).fill(null).map((_, i) => ({
                id: `shimmer-${i}`,
                title: "Loading Event",
                start: new Date(),
                end: new Date(),
                status: "NORMAL",
                type: "NORMAL"
              })),
              dateLocale,
              locale,
              renderEventCard,
              onEventClick: () => { },
              setMonthRef: () => { },
              selectedDate: startOfToday(),
              setDayRef: () => { }
            }}
          >
            {displayedMonths.map((monthKey) => (
              <MonthSection
                key={monthKey}
                monthKey={monthKey}
                monthEvents={eventsByMonth[monthKey] || []}
                dateLocale={dateLocale}
                locale={locale}
                renderEventCard={renderEventCard}
                onEventClick={onEventClick}
                setMonthRef={setMonthRef}
                selectedDate={selectedDate}
                setDayRef={setDayRef}
              />
            ))}
          </Shimmer>
        </div>
      </div>
    </div>
  );
}
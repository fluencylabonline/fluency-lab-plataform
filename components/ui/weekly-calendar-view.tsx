"use client";

import * as React from "react";
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { Shimmer } from "@shimmer-from-structure/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarEvent } from "./calendar-view";

interface WeeklyCalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onWeekChange?: (date: Date) => void;
  renderEventCard?: (event: CalendarEvent) => React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  isLoading?: boolean;
}

export function WeeklyCalendarView({
  events = [],
  onEventClick,
  onWeekChange,
  renderEventCard,
  className,
  headerActions,
  isLoading = false,
}: WeeklyCalendarViewProps) {
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [currentDate, setCurrentDate] = React.useState(new Date());

  const weekStart = startOfWeek(currentDate, { locale: dateLocale });
  const weekEnd = endOfWeek(currentDate, { locale: dateLocale });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePreviousWeek = () => {
    const prev = subWeeks(currentDate, 1);
    setCurrentDate(prev);
    onWeekChange?.(prev);
  };

  const handleNextWeek = () => {
    const next = addWeeks(currentDate, 1);
    setCurrentDate(next);
    onWeekChange?.(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onWeekChange?.(today);
  };

  const eventsByDay = React.useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const dateKey = format(event.start, "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    
    // Sort events within each day by start time
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.start.getTime() - b.start.getTime());
    });
    
    return map;
  }, [events]);

  return (
    <div className={cn("flex flex-col gap-0 backdrop-blur-xl border border-white/5 rounded-md overflow-hidden bg-card/50", className)}>
      <div className="flex items-center justify-between p-4 lg:p-6 bg-background/80 dark:bg-background/40 border-b border-white/5">
        <h2 className="text-md lg:text-xl font-black capitalize tracking-tight text-text">
          {format(weekStart, "d MMM", { locale: dateLocale })} - {format(weekEnd, "d MMM yyyy", { locale: dateLocale })}
        </h2>
        <div className="flex items-center gap-2">
          {headerActions}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 lg:h-9 text-[10px] font-black uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-md"
          >
            {locale === "pt" ? "Hoje" : "Today"}
          </Button>
          <div className="flex items-center bg-white/5 rounded-md border border-white/10 p-1">
            <Button variant="ghost" size="icon" onClick={handlePreviousWeek} className="h-7 w-7 hover:bg-white/10 rounded-sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-7 w-7 hover:bg-white/10 rounded-sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent max-h-[70vh]">
        <Shimmer
          loading={isLoading}
          templateProps={{
            weekStart: new Date(),
            weekEnd: new Date(),
          }}
        >
          <div className="flex flex-col">
            {daysInWeek.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay[dateKey] || [];
              const isCurrentDay = isToday(day);

              return (
                <div 
                  key={dateKey} 
                  className={cn(
                    "flex flex-col lg:flex-row border-b border-white/5 last:border-0",
                    isCurrentDay && "bg-primary/5"
                  )}
                >
                  {/* Day Header Column */}
                  <div className="flex flex-col items-start lg:items-end lg:justify-start lg:w-32 p-4 lg:p-6 shrink-0 lg:border-r border-white/5">
                    <span className={cn(
                      "text-[11px] font-black uppercase tracking-widest text-muted-foreground",
                      isCurrentDay && "text-primary/80"
                    )}>
                      {format(day, "EEEE", { locale: dateLocale })}
                    </span>
                    <span className={cn(
                      "text-2xl font-black mt-1",
                      isCurrentDay ? "text-primary" : "text-text"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Events List Column */}
                  <div className="flex-1 p-4 lg:p-6 flex flex-col gap-3">
                    {dayEvents.length === 0 ? (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic font-medium h-full opacity-60">
                         {locale === "pt" ? "Nenhuma aula programada" : "No classes scheduled"}
                      </div>
                    ) : (
                      dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => !event.isOptimistic && onEventClick?.(event)}
                          className={cn(
                            "cursor-pointer",
                            !!event.isOptimistic && "cursor-not-allowed pointer-events-none"
                          )}
                        >
                          {renderEventCard ? renderEventCard(event) : (
                            <div className={cn(
                              "p-4 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-all space-y-3 group",
                              !!event.isOptimistic && "animate-pulse border-dashed border-primary/20 bg-primary/5 opacity-60"
                            )}>
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                                <Badge variant="outline" className={cn(
                                  "text-[8px] font-black uppercase tracking-tighter border-white/10",
                                  event.type === "REPOSICAO" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                  !!event.isOptimistic && "opacity-50"
                                )}>
                                  {event.isOptimistic ? (locale === "pt" ? "Criando..." : "Creating...") : (event.type === "REPOSICAO" ? (locale === "pt" ? "Reposição" : "Replacement") : (locale === "pt" ? "Regular" : "Regular"))}
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
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Shimmer>
      </div>
    </div>
  );
}

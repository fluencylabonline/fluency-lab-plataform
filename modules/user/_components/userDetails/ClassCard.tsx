"use client";

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";

interface ClassCardProps {
  slot: SlotInstanceWithDetails;
  isAdmin: boolean;
  onUpdateStatus: (slotId: string, status: SlotInstanceWithDetails["status"]) => void;
  onSwapTeacher: (slot: SlotInstanceWithDetails) => void;
  onUpdateLesson: (slot: SlotInstanceWithDetails) => void;
}


export function ClassCard({
  slot,
  isAdmin,
  onUpdateStatus,
  onSwapTeacher,
  onUpdateLesson
}: ClassCardProps) {
  const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    scheduled: { label: "Agendada", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Calendar },
    completed: { label: "Concluída", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
    "canceled-student": { label: "Canc. Aluno", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
    "canceled-teacher": { label: "Canc. Prof", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: XCircle },
    "canceled-admin": { label: "Canc. Admin", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: XCircle },
    "no-show": { label: "No Show", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertCircle },
    overdue: { label: "Expirada", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Clock },
    "teacher-recess": { label: "Recesso", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Clock },
  };

  const config = statusConfig[slot.status] || statusConfig.scheduled;
  const StatusIcon = config.icon;

  return (
    <div className="card overflow-hidden group transition-all p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(slot.startAt), "dd 'de' MMMM", { locale: ptBR })}</span>
            </div>
            <Badge variant="outline" className={cn("font-medium", config.color)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold">
              {format(new Date(slot.startAt), "HH:mm")} - {format(new Date(slot.endAt), "HH:mm")}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">Prof. {slot.teacherName || slot.teacher?.name || "Professor"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="truncate">
                {slot.status === "teacher-recess" ? (
                  slot.fallbackLessonTitle ? `Fallback: ${slot.fallbackLessonTitle}` : "Sem lição de fallback"
                ) : (
                  `${slot.planName || "Sem plano"}${slot.lessonTitle ? ` • ${slot.lessonTitle}` : " (Sem lição)"}`
                )}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Ações da Aula</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onUpdateStatus(slot.id, "completed")}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar Concluída
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(slot.id, "no-show")}>
                <AlertCircle className="mr-2 h-4 w-4" /> Marcar No-Show
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(slot.id, "canceled-admin")}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar (Admin)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSwapTeacher(slot)}>
                <RefreshCw className="mr-2 h-4 w-4" /> Alterar Professor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateLesson(slot)}>
                <BookOpen className="mr-2 h-4 w-4" /> Alterar Lição
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

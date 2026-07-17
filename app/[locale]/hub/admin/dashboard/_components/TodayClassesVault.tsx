"use client";

import { useState } from "react";
import { Calendar, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Vault,
  VaultTrigger,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import { TodayClass, StatCardData } from "@/modules/dashboard/dashboard.types";
import { StatCard } from "./StatCard";
import Image from "next/image";

interface TodayClassesVaultProps {
  cardData: StatCardData;
  classes: TodayClass[];
}

export function TodayClassesVault({ cardData, classes }: TodayClassesVaultProps) {
  const [open, setOpen] = useState(false);

  return (
    <Vault open={open} onOpenChange={setOpen}>
      <VaultTrigger asChild>
        <div className="cursor-pointer">
          <StatCard data={cardData} />
        </div>
      </VaultTrigger>

      <VaultContent aria-label="Aulas de Hoje" className="sm:max-w-lg">
        <VaultHeader>
          <VaultTitle>Aulas de Hoje</VaultTitle>
          <VaultDescription>
            {classes.length} {classes.length === 1 ? "aula agendada" : "aulas agendadas"} para o dia de hoje.
          </VaultDescription>
        </VaultHeader>

        <VaultBody>
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Calendar className="h-8 w-8 opacity-30" />
                <span className="text-sm">Nenhuma aula agendada para hoje.</span>
              </div>
            ) : (
              classes.map((cls) => {
                const startTimeStr = format(new Date(cls.startAt), "HH:mm");
                const endTimeStr = format(new Date(cls.endAt), "HH:mm");

                return (
                  <div
                    key={cls.id}
                    className="item flex flex-col gap-2.5 p-4 rounded-xl border border-border/50 bg-muted/30"
                  >
                    {/* Header: Time and Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{startTimeStr} - {endTimeStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Type Badge */}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                            cls.type === "NORMAL"
                              ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/60"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/60"
                          )}
                        >
                          {cls.type === "NORMAL" ? "Regular" : "Reposição"}
                        </span>
                        {/* Status Badge */}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                          Agendada
                        </span>
                      </div>
                    </div>

                    {/* Users Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                      {/* Student */}
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border/40">
                          {cls.studentPhotoUrl ? (
                            <Image
                              src={cls.studentPhotoUrl}
                              alt={cls.studentName || ""}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {cls.studentName?.charAt(0).toUpperCase() || "A"}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block leading-tight">
                            Aluno
                          </span>
                          <span className="text-xs font-semibold truncate block">
                            {cls.studentName || "Sem Nome"}
                          </span>
                        </div>
                      </div>

                      {/* Teacher */}
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border/40">
                          {cls.teacherPhotoUrl ? (
                            <Image
                              src={cls.teacherPhotoUrl}
                              alt={cls.teacherName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">
                              {cls.teacherName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block leading-tight">
                            Professor
                          </span>
                          <span className="text-xs font-semibold truncate block">
                            {cls.teacherName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lesson name if available */}
                    {cls.lessonTitle && (
                      <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">
                          Lição: <strong className="font-semibold text-foreground/80">{cls.lessonTitle}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

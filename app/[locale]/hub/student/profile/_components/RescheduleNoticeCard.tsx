"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, Clock, RefreshCw, User } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RescheduleVault } from "@/modules/scheduling/_components/RescheduleVault";

export interface PendingReschedule {
  classId: string;
  startAt: Date;
  teacherId: string;
  teacherName: string | null;
  creditExpiresAt: Date;
  hasAvailability: boolean;
}

interface RescheduleNoticeCardProps {
  pending: PendingReschedule;
  /** Próxima aula agendada, mostrada numa linha menor para o aluno não perder essa informação. */
  nextClassStartsAt: Date | null;
}

/**
 * Ocupa o lugar do card de próxima aula quando o professor cancelou uma aula e o aluno
 * ainda pode repô-la com o crédito. Some sozinho quando a próxima aula começa.
 */
export function RescheduleNoticeCard({ pending, nextClassStartsAt }: RescheduleNoticeCardProps) {
  const t = useTranslations("Hub.StudentProfile.NextClass");
  const format = useFormatter();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card p-6 flex flex-col h-full" data-testid="reschedule-notice">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-md bg-red-500/10 text-red-500">
          <CalendarX2 className="w-5 h-5" />
        </div>
        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider">
          {t("canceled_badge")}
        </span>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">{t("canceled_title")}</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <div className="p-1.5 rounded-md bg-muted/50">
                <Clock className="w-4 h-4" />
              </div>
              <span className="capitalize line-through decoration-red-500/40">
                {format.dateTime(pending.startAt, { weekday: "long", day: "numeric", month: "long" })}
                <span className="ml-1">
                  {t("at")} {format.dateTime(pending.startAt, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            </div>
            {pending.teacherName && (
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <div className="p-1.5 rounded-md bg-muted/50">
                  <User className="w-4 h-4" />
                </div>
                <span>{pending.teacherName}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("credit_valid_until", {
            date: format.dateTime(pending.creditExpiresAt, { day: "numeric", month: "long" }),
          })}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {pending.hasAvailability ? (
          <Button className="w-full h-11 gap-2 font-bold" onClick={() => setIsOpen(true)}>
            <RefreshCw className="w-4 h-4" />
            {t("reschedule")}
          </Button>
        ) : (
          <p className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
            {t("no_slots")}
          </p>
        )}

        <p className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {nextClassStartsAt
            ? t("next_line", {
                date: format.dateTime(nextClassStartsAt, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }),
              })
            : t("no_next_class")}
        </p>
      </div>

      <RescheduleVault
        open={isOpen}
        onOpenChange={setIsOpen}
        selectedClass={{ id: pending.classId, teacherId: pending.teacherId, startAt: pending.startAt, status: "canceled-teacher" }}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

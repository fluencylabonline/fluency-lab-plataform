"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  startAt: Date;
  status: "scheduled" | "completed" | "canceled-student" | "canceled-teacher" | "canceled-admin" | "canceled-credit" | "no-show" | "rescheduled" | "teacher-recess" | "overdue" | "available";
  student?: {
    name: string;
  } | null;
}

interface DailyLessonsSummaryProps {
  lessons: Lesson[];
}

export function DailyLessonsSummary({ lessons }: DailyLessonsSummaryProps) {
  const t = useTranslations("Profile.DailySummary");

  const completedCount = lessons.filter(l => l.status === "completed").length;
  const totalCount = lessons.filter(l => l.status !== "available").length;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{t("title") || "Aulas de Hoje"}</h4>
        <div className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
          {completedCount}/{totalCount} {t("completed") || "Concluídas"}
        </div>
      </div>

      <div className="space-y-2">
        {totalCount === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{t("noLessons") || "Nenhuma aula agendada para hoje."}</p>
          </div>
        ) : (
          lessons.filter(l => l.status !== "available").map((lesson) => (
            <div key={lesson.id} className="item flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-full",
                  lesson.status === "completed" ? "bg-green-100 text-green-600" : 
                  lesson.status === "scheduled" ? "bg-blue-100 text-blue-600" :
                  "bg-red-100 text-red-600"
                )}>
                  {lesson.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : 
                   lesson.status === "scheduled" ? <Clock className="w-4 h-4" /> : 
                   <XCircle className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {lesson.student?.name || t("noStudent") || "Sem aluno"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(lesson.startAt), "HH:mm")}
                  </p>
                </div>
              </div>
              <div className={cn(
                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                lesson.status === "completed" ? "bg-green-50 text-green-700" :
                lesson.status === "scheduled" ? "bg-blue-50 text-blue-700" :
                "bg-red-50 text-red-700"
              )}>
                {lesson.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

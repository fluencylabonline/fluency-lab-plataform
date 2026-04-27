"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { SectionLabel, StatBlock } from "./UserDetailsPrimitives";
import type { User } from "../../user.schema";

interface TeacherEarningsTabProps {
  user: User;
  teacherClasses: any[];
  earningsSummary: {
    count: number;
    total: number;
  };
}

export function TeacherEarningsTab({
  user,
  teacherClasses,
  earningsSummary,
}: TeacherEarningsTabProps) {
  const t = useTranslations("UserManagement");

  return (
    <div className="flex flex-col gap-8">
      {/* Earnings Summary */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/10">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            {t("earningsThisMonth")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
          <StatBlock label={t("completedClasses")} value={String(earningsSummary.count)} />
          <StatBlock
            label={t("totalToReceive")}
            value={(earningsSummary.total / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            green
          />
        </div>
      </div>

      {/* Class List */}
      <div>
        <SectionLabel>{t("recentCompletedClasses")}</SectionLabel>
        <div className="flex flex-col gap-2">
          {teacherClasses.length === 0 ? (
            <div className="card py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <GraduationCap className="w-8 h-8 opacity-20" strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">{t("noRecentClasses")}</p>
            </div>
          ) : (
            teacherClasses.map((cls) => (
              <div
                key={cls.id}
                className="item flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-md bg-muted/50 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight">{cls.student?.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {format(new Date(cls.startsAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-600">
                    +{(user.teacherHourlyRate / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-600">
                    {cls.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

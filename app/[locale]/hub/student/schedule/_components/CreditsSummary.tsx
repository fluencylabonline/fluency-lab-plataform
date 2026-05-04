"use client";

import { useTranslations } from "next-intl";
import { Ticket, RotateCcw, Clock, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CreditsSummaryProps {
  balance: {
    bonus: number;
    "late-students": number;
    "teacher-cancellation": number;
    total: number;
  };
  rescheduleStats: {
    count: number;
    limit: number;
  };
}

export function CreditsSummary({ balance, rescheduleStats }: CreditsSummaryProps) {
  const t = useTranslations("Schedule");

  const items = [
    {
      label: t("Credits.teacherCancellation") || "Teacher Cancellation",
      value: balance["teacher-cancellation"],
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: t("Credits.bonus") || "Bonus Credits",
      value: balance.bonus,
      icon: Ticket,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: t("Credits.lateStudents") || "Late Student",
      value: balance["late-students"],
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const reschedulePercent = Math.min((rescheduleStats.count / rescheduleStats.limit) * 100, 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          {t("Credits.title") || "Seus Créditos"}
        </h3>
        
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <span className="font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {t("Reschedule.monthlyQuota") || "Reagendamentos do Mês"}
          </h3>
          <span className="text-xs font-medium">
            {rescheduleStats.count} / {rescheduleStats.limit}
          </span>
        </div>
        
        <Progress value={reschedulePercent} className="h-2" />
        <p className="text-[10px] text-muted-foreground mt-2">
          {t("Reschedule.limitNotice") || "Limite de 2 reagendamentos por mês (não acumulativo)."}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Users, TrendingUp, AlertCircle } from "lucide-react";
import { MEICapacity } from "@/modules/finance/finance.types";

interface MEICapacityCardProps {
  capacity: MEICapacity;
}

export function MEICapacityCard({ capacity }: MEICapacityCardProps) {
  const t = useTranslations("AdminFinances.capacity");
  const format = useFormatter();

  const committedRevenue = capacity.revenueLimit - capacity.remainingRevenue;
  const committedProgress = Math.min(100, (committedRevenue / capacity.revenueLimit) * 100);
  const isNearLimit = committedProgress > 80;

  return (
    <div className="card border-border overflow-hidden bg-linear-to-br from-card to-muted/30">
      <div className="p-6 pb-2">
        <h3 className="subtitle flex items-center gap-2">
          <TrendingUp className="size-5 text-blue-500" />
          {t("title") || "Limite MEI"}
        </h3>
      </div>
      <div className="p-6 flex flex-col gap-6">
        {/* Revenue Limit Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("committedRevenue") || "Comprometido (Pago + Previsto)"}</span>
            <span className="font-bold">
              {format.number(committedRevenue / 100, { style: 'currency', currency: 'BRL' })} /
              {format.number(capacity.revenueLimit / 100, { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
            {/* Committed Progress Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-500/30 transition-all duration-500"
              style={{ width: `${committedProgress}%` }}
            />
            {/* Paid Progress Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(capacity.currentRevenue / capacity.revenueLimit) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground px-0.5">
            <span>{format.number(capacity.currentRevenue / 100, { style: 'currency', currency: 'BRL' })} pagos</span>
            <span>{committedProgress.toFixed(1)}%</span>
          </div>
          {isNearLimit && (
            <div className="flex items-center gap-1.5 text-amber-500 text-[11px] mt-1">
              <AlertCircle className="size-3" />
              {t("nearLimitWarning") || "Você está próximo do limite do MEI!"}
            </div>
          )}
        </div>

        {/* Student Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col p-3 rounded-md bg-background border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="size-3" />
              {t("currentStudents") || "Alunos Ativos"}
            </div>
            <span className="text-xl font-bold">{capacity.currentStudents}</span>
          </div>
          <div className="flex flex-col p-3 rounded-md bg-background border border-border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="size-3" />
              {t("availableSlots") || "Vagas Restantes"}
            </div>
            <span className="text-xl font-bold text-emerald-500">+{capacity.availableSlots}</span>
          </div>
        </div>

        {/* Average Ticket & Max Students */}
        <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t("averageTicket") || "Ticket Médio (Mensal)"}</span>
            <span className="font-medium">{format.number(capacity.averageTicket / 100, { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t("maxEstimatedStudents") || "Capacidade Total Estimada"}</span>
            <span className="font-bold">{capacity.maxStudents}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

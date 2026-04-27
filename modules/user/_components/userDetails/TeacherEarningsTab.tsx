"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Calendar, ChevronLeft, ChevronRight, Loader2, Edit2 } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionLabel, StatBlock } from "./UserDetailsPrimitives";
import type { User } from "../../user.schema";
import { Button } from "@/components/ui/button";
import { getTeacherEarningsAction, updateClassEarningsAction } from "@/modules/scheduling/scheduling.actions";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Vault, VaultContent, VaultHeader, VaultTitle, VaultTrigger } from "@/components/ui/vault";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProcessPayoutVault } from "@/modules/payout/_components/ProcessPayoutVault";
import { Badge } from "@/components/ui/badge";

interface TeacherEarningsTabProps {
  user: User;
  teacherClasses: any[];
  earningsSummary: {
    count: number;
    total: number;
  };
  isAdmin?: boolean;
}

export function TeacherEarningsTab({
  user,
  teacherClasses: initialClasses,
  earningsSummary: initialSummary,
  isAdmin,
}: TeacherEarningsTabProps) {
  const t = useTranslations("UserManagement");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState(initialClasses);
  const [summary, setSummary] = useState(initialSummary);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEarnings = useCallback(async (date: Date) => {
    setIsLoading(true);
    const result = await getTeacherEarningsAction({
      teacherId: user.id,
      month: date.getMonth(),
      year: date.getFullYear(),
    });

    const response = result?.data;
    if (response?.success && response.data) {
      setClasses(response.data.teacherClasses);
      setSummary(response.data.earningsSummary);
    } else {
      notify.error(t("errorFetchingSchedule") || "Erro ao carregar ganhos");
    }
    setIsLoading(false);
  }, [user.id, t]);

  const handleRefresh = () => {
    fetchEarnings(currentDate);
  };

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    fetchEarnings(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    fetchEarnings(newDate);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-card border border-border/50 rounded-xl px-6 py-4">
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            {t("period")}
          </p>
          <p className="text-sm font-black capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isLoading} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isLoading} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className={cn("card overflow-hidden transition-all duration-300", isLoading && "opacity-50 grayscale-[0.5]")}>
        <div className="px-6 py-4 border-b border-border/50 bg-muted/10 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            {t("earningsThisMonth")}
          </p>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
          <StatBlock label={t("completedClasses")} value={String(summary.count)} />
          <StatBlock
            label={t("totalToReceive")}
            value={(summary.total / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            green
          />
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4 px-1">
          <ProcessPayoutVault
            teacherId={user.id}
            month={currentDate.getMonth()}
            year={currentDate.getFullYear()}
            onSuccess={handleRefresh}
          />
        </div>
      )}

      {/* Class List */}
      <div className={cn("transition-all duration-300", isLoading && "opacity-50")}>
        <SectionLabel>{t("recentCompletedClasses")}</SectionLabel>
        <div className="flex flex-col gap-2">
          {classes.length === 0 ? (
            <div className="card py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <GraduationCap className="w-8 h-8 opacity-20" strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">{t("noRecentClasses")}</p>
            </div>
          ) : (
            classes.map((cls) => (
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
                      {format(new Date(cls.startAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-sm font-black text-green-600">
                      +{((cls.teacherHourlyRate ?? user.teacherHourlyRate) / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-600">
                      {t(`status.${cls.status}`) || cls.status}
                    </span>
                    {cls.payoutId && (
                      <Badge variant="secondary" className="ml-2 text-[8px] h-4 font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border-none">
                        PAGA
                      </Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <EditRateVault
                      cls={cls}
                      currentRate={cls.teacherHourlyRate ?? user.teacherHourlyRate}
                      onUpdated={handleRefresh}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EditRateVault({
  cls,
  currentRate,
  onUpdated,
}: {
  cls: any;
  currentRate: number;
  onUpdated: () => void;
}) {
  const t = useTranslations("UserManagement");
  const [rate, setRate] = useState(currentRate / 100);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const result = await updateClassEarningsAction({
        classId: cls.id,
        teacherHourlyRate: Math.round(rate * 100),
      });

      if (result?.data?.success) {
        notify.success(t("success"));
        onUpdated();
      } else {
        notify.error(result?.data?.error || t("error"));
      }
    } catch (error) {
      notify.error(t("error"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Vault>
      <VaultTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-md border-border/50 hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </VaultTrigger>
      <VaultContent>
        <VaultHeader>
          <VaultTitle>{t("editClassRate")}</VaultTitle>
        </VaultHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rate-bonus">{t("rateInReais")}</Label>
            <Input
              id="rate-bonus"
              type="number"
              step="0.01"
              className="input"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <Button className="w-full font-bold" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("saveChanges")}
          </Button>
        </div>
      </VaultContent>
    </Vault>
  );
}

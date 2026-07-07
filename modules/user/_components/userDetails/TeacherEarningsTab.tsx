"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { 
  GraduationCap, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Edit2,
  AlertCircle,
  History,
  DollarSign,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionLabel, StatBlock } from "./UserDetailsPrimitives";
import type { User } from "../../user.schema";
import { Button } from "@/components/ui/button";
import { getTeacherEarningsAction, updateClassEarningsAction } from "@/modules/scheduling/scheduling.actions";
import { getTeacherPayoutHistoryAction } from "@/modules/payout/payout.actions";
import { PayoutDetailsVault } from "@/modules/payout/_components/PayoutDetailsVault";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Vault, VaultContent, VaultHeader, VaultTitle, VaultTrigger } from "@/components/ui/vault";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProcessPayoutVault } from "@/modules/payout/_components/ProcessPayoutVault";
import { Badge } from "@/components/ui/badge";

import { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";

interface PayoutHistoryItem {
  id: string;
  amount: number;
  month: number;
  year: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date | string;
  pixKey: string;
  pixKeyType: string;
  externalId: string;
  description?: string | null;
  receiptUrl?: string | null;
  invoiceUrl?: string | null;
  classes?: Array<{
    id: string;
    startAt: Date | string;
    teacherHourlyRate: number | null;
    student?: {
      name: string | null;
    } | null;
  }>;
}

interface TeacherEarningsTabProps {
  user: User;
  teacherClasses: SlotInstanceWithDetails[];
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
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setIsLoadingHistory(true);
      try {
        const result = await getTeacherPayoutHistoryAction({ teacherId: user.id });
        if (isMounted && result?.data?.success && result.data.data) {
          setPayoutHistory(result.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const handleRefresh = () => {
    fetchEarnings(currentDate);
    
    const isMounted = true;
    getTeacherPayoutHistoryAction({ teacherId: user.id }).then((result) => {
      if (isMounted && result?.data?.success && result.data.data) {
        setPayoutHistory(result.data.data);
      }
    });
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

  const today = new Date();
  const isCurrentOrFutureMonth = currentDate.getFullYear() > today.getFullYear() || 
    (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() >= today.getMonth());

  return (
    <div className="flex flex-col gap-8">
      {/* Month Navigation */}
      <div className="card flex items-center justify-between px-6 py-4">
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

      {/* Close Month Alert and Payout Button */}
      {isAdmin && isCurrentOrFutureMonth && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mt-1">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-500">Recomendação de Fechamento</p>
            <p className="text-xs text-amber-500/80 leading-relaxed font-medium">
              A competência de <strong>{format(currentDate, "MMMM yyyy", { locale: ptBR })}</strong> ainda está em andamento. 
              Para evitar pagamentos incompletos ou divergências caso novas aulas sejam agendadas até o final do período, 
              o processamento do repasse é sugerido apenas a partir de <strong>01/{format(addMonths(currentDate, 1), "MM/yyyy")}</strong>.
            </p>
          </div>
        </div>
      )}

      {isAdmin && !isCurrentOrFutureMonth && (
        <div className="mt-1 px-1">
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
                      <div className="flex flex-col items-end mt-1">
                        <Badge variant="secondary" className="text-[8px] h-4 font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border-none">
                          PAGA
                        </Badge>
                        {cls.payout?.createdAt && (
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 whitespace-nowrap">
                            pago em {format(new Date(cls.payout.createdAt), "dd/MM")}
                          </span>
                        )}
                      </div>
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

      {/* Payout History Section */}
      <div className="mt-8 border-t pt-8 border-border/50">
        <SectionLabel>Histórico de Repasses</SectionLabel>
        <div className="flex flex-col gap-2">
          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : payoutHistory.length === 0 ? (
            <div className="card py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <History className="w-8 h-8 opacity-20" strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum repasse realizado ainda</p>
            </div>
          ) : (
            payoutHistory.map((payout) => (
              <PayoutHistoryRow 
                key={payout.id} 
                payout={payout} 
                teacherId={user.id} 
                isAdmin={isAdmin}
                onSuccess={handleRefresh} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PayoutHistoryRow({
  payout,
  teacherId,
  isAdmin,
  onSuccess
}: {
  payout: PayoutHistoryItem;
  teacherId: string;
  isAdmin?: boolean;
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const monthNames = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  
  return (
    <PayoutDetailsVault
      payout={payout}
      teacherId={teacherId}
      isAdmin={isAdmin}
      onSuccess={onSuccess}
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <div 
          onClick={() => setIsOpen(true)}
          className="item flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-md bg-green-500/10 text-green-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight capitalize">
                {monthNames[payout.month]} {payout.year}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Pago em {format(new Date(payout.createdAt), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-3">
            <div>
              <p className="text-sm font-black text-green-600">
                +{(payout.amount / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}
              </p>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-600">
                CONCLUÍDO
              </span>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      }
    />
  );
}

function EditRateVault({
  cls,
  currentRate,
  onUpdated,
}: {
  cls: SlotInstanceWithDetails;
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
    } catch {
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

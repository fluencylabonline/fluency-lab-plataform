"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Vault, VaultHeader, VaultTitle, VaultBody, VaultContent } from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { getTeacherAvailabilityAction, rescheduleAction } from "@/modules/scheduling/scheduling.actions";
import { format, addDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { notify } from "@/components/ui/toaster";
import { Calendar, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";
import { type ScheduledClass } from "@/modules/scheduling/scheduling.types";

type TeacherSlot = {
  id: string;
  startAt: string;
  endAt: string;
  teacherId: string;
};

type RescheduleStats = {
  count: number;
  limit: number;
};

type CreditBalance = {
  total: number;
  bonus: number;
  "late-students": number;
  "teacher-cancellation": number;
};

interface RescheduleVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: ScheduledClass | null;
  balance: CreditBalance;
  rescheduleStats: RescheduleStats;
  onSuccess: () => void;
}

export function RescheduleVault({ open, onOpenChange, selectedClass, balance, rescheduleStats, onSuccess }: RescheduleVaultProps) {
  const t = useTranslations("Schedule");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [availableSlots, setAvailableSlots] = useState<TeacherSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [useCreditId, setUseCreditId] = useState<string | undefined>(undefined);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!selectedClass?.teacherId) return;
    setIsLoading(true);
    try {
      const result = await getTeacherAvailabilityAction({
        teacherId: selectedClass.teacherId as string,
        startDate: addDays(new Date(), 1), // Only future
        endDate: addDays(new Date(), 15),
      });

      if (result?.data?.success) {
        setAvailableSlots(result.data.data as TeacherSlot[] || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (open && selectedClass) {
      fetchSlots();
    }
  }, [open, selectedClass, fetchSlots]);

  const handleConfirm = async () => {
    if (!selectedSlotId || !selectedClass) return;

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    const promise = rescheduleAction({
      originalClassId: selectedClass.id,
      newSlotId: selectedSlotId,
      creditId: useCreditId,
    });

    notify.promise(promise, {
      loading: t("Reschedule.saving") || "Salvando reagendamento...",
      success: (result) => {
        if (result?.data?.success) {
          onOpenChange(false);
          setIsConfirming(false);
          onSuccess();
          return t("Success.rescheduled") || "Aula reagendada com sucesso!";
        }
        throw new Error(result?.data?.error || t("Error.generic") || "Erro ao reagendar");
      },
      error: (err: unknown) => (err as Error).message || "Falha na requisição"
    });
  };

  return (
    <Vault open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setIsConfirming(false);
    }}>
      <VaultContent>
        <VaultHeader>
          <VaultTitle>
            {isConfirming 
              ? (t("Reschedule.confirmTitle") || "Confirmar Reagendamento")
              : (t("Reschedule.title") || "Reagendar Aula")}
          </VaultTitle>
        </VaultHeader>
        <VaultBody>
          <div className="flex flex-col gap-6">
            {isConfirming ? (
              <div className="flex flex-col gap-6 py-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border bg-muted/20">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">
                      {t("Reschedule.originalClass") || "Aula Original"}
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedClass!.startAt), "dd/MM 'às' HH:mm", { locale: dateLocale })}
                    </p>
                  </div>

                  <div className="flex justify-center py-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Clock className="w-5 h-5 text-primary rotate-180" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-primary bg-primary/5 ring-1 ring-primary">
                    <p className="text-xs text-primary uppercase font-bold mb-2">
                      {t("Reschedule.newDate") || "Nova Data"}
                    </p>
                    <p className="text-sm font-bold">
                      {selectedSlotId && availableSlots.find(s => s.id === selectedSlotId) && 
                        format(new Date(availableSlots.find(s => s.id === selectedSlotId)!.startAt), "dd/MM 'às' HH:mm", { locale: dateLocale })
                      }
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center px-4">
                  {useCreditId === undefined 
                    ? (t("Reschedule.quotaNotice") || "Será consumido 1 crédito da sua cota mensal de reagendamentos.")
                    : (t("Reschedule.creditNoticeConfirm") || "Será consumido 1 crédito de reposição.")
                  }
                </p>
              </div>
            ) : (
              <>
                <Field label={t("Reschedule.selectSlot") || "Escolha um novo horário"}>
                  <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 flex flex-col gap-2">
                    {isLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
                        {t("Reschedule.loadingSlots") || "Buscando horários disponíveis..."}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {t("Reschedule.noSlots") || "Nenhum horário disponível nos próximos 14 dias."}
                      </div>
                    ) : (
                      availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border text-left transition-all hover:bg-muted",
                            selectedSlotId === slot.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-transparent"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(slot.startAt), "dd/MM 'às' HH:mm", { locale: dateLocale })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(slot.startAt), "EEEE", { locale: dateLocale })}
                            </span>
                          </div>
                          {selectedSlotId === slot.id && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                </Field>

                <Field label={t("Reschedule.paymentMethod") || "Método de Reagendamento"}>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      disabled={rescheduleStats?.count >= rescheduleStats?.limit}
                      onClick={() => setUseCreditId(undefined)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                        useCreditId === undefined ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted-foreground/20",
                        rescheduleStats?.count >= rescheduleStats?.limit && "opacity-50 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{t("Reschedule.monthlyQuota") || "Cota Mensal"}</span>
                          <span className="text-xs text-muted-foreground">
                            {rescheduleStats?.count} / {rescheduleStats?.limit} {t("Reschedule.used") || "usados"}
                          </span>
                        </div>
                      </div>
                      {useCreditId === undefined && <Check className="w-4 h-4 text-primary" />}
                    </button>

                    {balance?.total > 0 && (
                      <div className="p-1 border rounded-xl bg-muted/30">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                          {t("Reschedule.useCredit") || "Ou use um crédito"}
                        </p>
                        <p className="text-xs text-muted-foreground px-2 pb-2">
                          {t("Reschedule.creditNotice") || "Se você tiver créditos, eles serão listados aqui para uso."}
                        </p>
                      </div>
                    )}
                  </div>
                </Field>
              </>
            )}

            <div className="pt-4 border-t flex flex-col gap-3">
              <Button
                className="w-full"
                disabled={!selectedSlotId || (useCreditId === undefined && rescheduleStats?.count >= rescheduleStats?.limit)}
                onClick={handleConfirm}
              >
                {isConfirming 
                  ? (t("Reschedule.confirmFinal") || "Confirmar e Salvar")
                  : (t("Reschedule.confirm") || "Confirmar Reagendamento")}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => isConfirming ? setIsConfirming(false) : onOpenChange(false)}
              >
                {isConfirming ? (t("Actions.back") || "Voltar") : (t("Actions.cancel") || "Cancelar")}
              </Button>
            </div>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

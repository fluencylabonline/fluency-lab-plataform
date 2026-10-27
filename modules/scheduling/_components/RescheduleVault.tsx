"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Vault, VaultHeader, VaultTitle, VaultBody, VaultContent, VaultFooter, VaultPrimaryButton, VaultSecondaryButton } from "@/components/ui/vault";
import { VaultLoadingOverlay } from "@/components/ui/vault-loading-overlay";
import { getTeacherAvailabilityAction, rescheduleAction } from "@/modules/scheduling/scheduling.actions";
import { format, addDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Calendar, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field";

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

/** O mínimo que o vault precisa da aula: serve tanto para a agenda quanto para o perfil. */
export interface RescheduleVaultClass {
  id: string;
  teacherId: string;
  startAt: Date | string;
  status: string;
}

interface RescheduleVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: RescheduleVaultClass | null;
  /** Só a agenda mostra a cota; o perfil reagenda apenas aula cancelada pelo professor. */
  rescheduleStats?: RescheduleStats;
  onSuccess: () => void;
}

export function RescheduleVault({ open, onOpenChange, selectedClass, rescheduleStats, onSuccess }: RescheduleVaultProps) {
  const t = useTranslations("Schedule");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [availableSlots, setAvailableSlots] = useState<TeacherSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [overlayState, setOverlayState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Aula cancelada pelo professor só se repõe com o crédito dela (o servidor escolhe qual),
  // nunca com a cota mensal de reagendamentos.
  const usesCredit = selectedClass?.status === "canceled-teacher";
  const quotaExhausted = !!rescheduleStats && rescheduleStats.count >= rescheduleStats.limit;

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

    setOverlayState("loading");

    try {
      const result = await rescheduleAction({
        originalClassId: selectedClass.id,
        newSlotId: selectedSlotId,
      });

      if (result?.data?.success) {
        setOverlayState("success");
      } else {
        const err = result?.data?.error || t("Error.generic") || "Erro ao reagendar";
        setErrorMsg(err);
        setOverlayState("error");
      }
    } catch (err: unknown) {
      const errMsg = (err as Error).message || "Falha na requisição";
      setErrorMsg(errMsg);
      setOverlayState("error");
    }
  };

  const handleOverlayDone = () => {
    if (overlayState === "success") {
      onOpenChange(false);
      setIsConfirming(false);
      onSuccess();
    }
    setOverlayState("idle");
  };

  return (
    <Vault open={open} onOpenChange={(val) => {
      if (overlayState !== "idle") return;
      onOpenChange(val);
      if (!val) setIsConfirming(false);
    }}>
      <VaultContent>
        <VaultLoadingOverlay
          state={overlayState}
          loadingLabel={t("Reschedule.saving") || "Salvando reagendamento..."}
          successLabel={t("Success.rescheduled") || "Aula reagendada com sucesso!"}
          errorLabel={t("Error.generic") || "Erro ao reagendar"}
          errorSub={errorMsg}
          onDone={handleOverlayDone}
        />
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
                  <div className="p-4 rounded-md border bg-muted/20">
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

                  <div className="p-4 rounded-md border border-primary bg-primary/5 ring-1 ring-primary">
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
                  {usesCredit
                    ? (t("Reschedule.creditNoticeConfirm") || "Será consumido 1 crédito de reposição.")
                    : (t("Reschedule.quotaNotice") || "Será consumido 1 crédito da sua cota mensal de reagendamentos.")
                  }
                </p>
              </div>
            ) : (
              <>
                <Field label={t("Reschedule.selectSlot") || "Escolha um novo horário"}>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md p-2 flex flex-col gap-2">
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
                    {usesCredit ? (
                      <div className="flex items-start gap-3 p-3 rounded-md border border-primary bg-primary/5 ring-1 ring-primary">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{t("Reschedule.creditMode") || "Reposição com crédito"}</span>
                          <span className="text-xs text-muted-foreground">
                            {t("Reschedule.creditModeDesc") || "Esta aula foi cancelada pelo professor. Você usa 1 crédito de reposição, sem gastar sua cota mensal."}
                          </span>
                        </div>
                      </div>
                    ) : (
                    <button
                      disabled={quotaExhausted}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border text-left transition-all",
                        "border-primary bg-primary/5 ring-1 ring-primary",
                        quotaExhausted && "opacity-50 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{t("Reschedule.monthlyQuota") || "Cota Mensal"}</span>
                          <span className="text-xs text-muted-foreground">
                            {rescheduleStats?.count ?? 0} / {rescheduleStats?.limit ?? 0} {t("Reschedule.used") || "usados"}
                          </span>
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-primary" />
                    </button>
                    )}
                  </div>
                </Field>
              </>
            )}

            <VaultFooter>
              <VaultSecondaryButton 
                onClick={() => isConfirming ? setIsConfirming(false) : onOpenChange(false)}
                disabled={overlayState !== "idle"}
              >
                {isConfirming ? (t("Actions.back") || "Voltar") : (t("Actions.cancel") || "Cancelar")}
              </VaultSecondaryButton>
              <VaultPrimaryButton
                disabled={overlayState !== "idle" || !selectedSlotId || (!usesCredit && quotaExhausted)}
                onClick={handleConfirm}
              >
                {isConfirming 
                  ? (t("Reschedule.confirmFinal") || "Confirmar e Salvar")
                  : (t("Reschedule.confirm") || "Confirmar Reagendamento")}
              </VaultPrimaryButton>
            </VaultFooter>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Vault, VaultContent, VaultHeader, VaultTitle, VaultTrigger } from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, DollarSign, CheckCircle2, Info, Lock } from "lucide-react";
import { notify } from "@/components/ui/toaster";
import { processTeacherPayoutAction, getTeacherUnpaidClassesAction, checkCurrentSudoRequirementAction } from "../payout.actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessPayoutVaultProps {
  teacherId: string;
  month: number;
  year: number;
  onSuccess: () => void;
}

import { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";

export function ProcessPayoutVault({
  teacherId,
  month,
  year,
  onSuccess,
}: ProcessPayoutVaultProps) {
  const t = useTranslations("UserManagement");
  const tCommon = useTranslations("Common");
  const [classes, setClasses] = useState<SlotInstanceWithDetails[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(true);



  const fetchUnpaid = useCallback(async () => {
    setIsLoading(true);
    const result = await getTeacherUnpaidClassesAction({ teacherId, month, year });
    if (result?.data?.success) {
      setClasses(result.data.data || []);
    }
    setIsLoading(false);
  }, [teacherId, month, year]);

  useEffect(() => {
    const init = async () => {
      if (isOpen) {
        await fetchUnpaid();
        setPassword("");

        // Verificar se o usuário precisa de senha
        const res = await checkCurrentSudoRequirementAction();
        if (res?.data?.success) {
          setNeedsPassword(res.data.hasPassword);
        }
      }
    };
    init();
  }, [isOpen, fetchUnpaid]);

  const total = classes.reduce((sum, cls) => sum + (cls.teacherHourlyRate || 0), 0);

  const handleProcess = async () => {


    if (!password) {
      notify.error("Senha administrativa obrigatória");
      return;
    }

    setIsProcessing(true);
    const result = await processTeacherPayoutAction({
      teacherId,
      month,
      year,
      password
    });
    setIsProcessing(false);

    if (result?.data?.success) {
      notify.success("Pagamento processado e enviado!");
      setIsOpen(false);
      onSuccess();
    } else {
      notify.error(result?.data?.error || "Erro ao processar pagamento.");
    }
  };

  return (
    <Vault open={isOpen} onOpenChange={setIsOpen}>
      <VaultTrigger asChild>
        <Button variant="default" className="w-full gap-2 font-bold h-12">
          <DollarSign className="w-4 h-4" />
          {t("processPayout") || "Processar Pagamento"}
        </Button>
      </VaultTrigger>
      <VaultContent>
        <VaultHeader>
          <VaultTitle>{t("payoutReview") || "Revisão de Pagamento"}</VaultTitle>
        </VaultHeader>

        <div className="p-6 space-y-6">
          {/* Summary Card */}
          <div className="card p-6 bg-primary/5 border-primary/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                {t("totalToPay")}
              </p>
              <p className="text-3xl font-black text-primary">
                {(total / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Classes List */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t("pendingClasses")} ({classes.length})
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : classes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("noPendingClasses")}
                </p>
              ) : (
                classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-sm font-bold">{cls.student?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(cls.startAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <p className="text-sm font-black">
                      {((cls.teacherHourlyRate || 0) / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* Confirmation Info */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-500">{t("payoutConfirmation")}</p>
              <p className="text-xs text-blue-500/80 leading-relaxed">
                {t("payoutConfirmationDesc")}
              </p>
            </div>
          </div>

          {/* Sudo Mode Password */}
          {needsPassword ? (
            <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Confirmação de Identidade
                </Label>
              </div>
              <Input
                type="password"
                placeholder="Sua senha de administrador"
                className="h-10 bg-background"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div className="p-4 rounded-lg border bg-muted/5 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Identidade verificada via Google
              </p>
            </div>
          )}

          {/* Action Button */}
          <Button
            className="w-full h-12 font-black uppercase tracking-widest text-sm"
            disabled={isProcessing || classes.length === 0}
            onClick={handleProcess}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? tCommon("loading") || "..." : t("confirmAndSendPix")}
          </Button>
        </div>
      </VaultContent>
    </Vault>
  );
}

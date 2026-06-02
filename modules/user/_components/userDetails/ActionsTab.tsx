"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Lock, UserMinus, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "./UserDetailsPrimitives";
import { notify } from "@/components/ui/toaster";
import { requestStudentDeactivationAction } from "@/modules/user/user.actions";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionWithPlan, Installment } from "../../../billing/billing.types";
import { useEffect } from "react";

interface ActionsTabProps {
  userId: string;
  userName: string;
  isActive: boolean;
  activeSubscription?: SubscriptionWithPlan | null;
  installments?: Installment[];
}

export function ActionsTab({ 
  userId, 
  userName, 
  isActive,
  activeSubscription,
  installments
}: ActionsTabProps) {
  const t = useTranslations("UserManagement");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [pixData, setPixData] = useState<{ pixCode: string; pixImage: string } | null>(null);

  useEffect(() => {
    if (activeSubscription?.status === "pending_fee" && activeSubscription.cancellationFeeInstallmentId) {
      const feeInstallment = installments?.find(i => i.id === activeSubscription.cancellationFeeInstallmentId);
      if (feeInstallment?.pixPayload && feeInstallment?.pixImage) {
        setPixData({
          pixCode: feeInstallment.pixPayload,
          pixImage: feeInstallment.pixImage
        });
      }
    }
  }, [activeSubscription, installments]);

  const handleDeactivate = async () => {
    if (!password) {
      notify.error(t("adminPasswordRequired"));
      return;
    }

    setIsPending(true);
    try {
      const result = await requestStudentDeactivationAction({ userId, password });
      
      if (result?.data && "success" in result.data && result.data.success) {
        const data = result.data as { feeRequired: boolean; pixCode?: string; pixImage?: string };
        if (data.feeRequired) {
          setPixData({ 
            pixCode: data.pixCode!, 
            pixImage: data.pixImage! 
          });
          notify.warning(t("feeNotification"));
        } else {
          notify.success(t("deactivationSuccess"));
          setPassword("");
        }
      } else {
        const error = (result?.data && "error" in (result.data as object)) ? (result.data as { error: string }).error : t("error");
        notify.error(error);
      }
    } catch {
      notify.error(t("error"));
    } finally {
      setIsPending(false);
    }
  };

  const copyPix = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.pixCode);
      notify.success(t("pixCopySuccess"));
    }
  };

  if (!isActive && !pixData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 border border-dashed rounded-lg bg-muted/5">
        <CheckCircle2 className="w-12 h-12 text-muted-foreground opacity-20" />
        <div className="text-center">
          <p className="font-bold text-sm">{t("alreadyInactive")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("noPendingActions")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionLabel>{t("accountActions")}</SectionLabel>
        
        <div className="card border-destructive/20 bg-destructive/[0.02] overflow-hidden">
          <div className="px-6 py-5 border-b border-destructive/10 bg-destructive/[0.03] flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-sm font-black text-destructive tracking-tight uppercase">Zona de Perigo</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                Ações de alto impacto e irreversíveis
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {!pixData ? (
              <>
                <div className="flex flex-col gap-2">
                  <p className="font-black text-sm tracking-tight">{t("deactivateStudent")}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("deactivateStudentDesc").replace("aluno", userName)}
                  </p>
                </div>

                <div className="flex flex-col gap-4 p-4 border rounded-md bg-background/50">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      {t("sudoModeLabel")}
                    </Label>
                    <Input 
                      type="password" 
                      placeholder={t("adminPasswordPlaceholder")}
                      className="h-11 font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <Button 
                    variant="destructive" 
                    className="w-full gap-2 font-black text-xs uppercase tracking-[0.2em] h-12 shadow-sm"
                    onClick={handleDeactivate}
                    disabled={isPending || !password}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    {isPending ? "..." : t("confirmDeactivation")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-6 items-center">
                <div className="text-center">
                  <Badge variant="outline" className="mb-2 font-black uppercase tracking-widest text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20">{t("waitingPayment")}</Badge>
                  <p className="font-black text-sm tracking-tight">{t("feeGenerated")}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {t("feeGeneratedDesc")}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-md shadow-sm border flex flex-col items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pixData.pixImage} alt="QR Code PIX" className="w-48 h-48" />
                  <Button variant="outline" size="sm" className="w-full gap-2 font-bold text-[10px] uppercase tracking-widest" onClick={copyPix}>
                    <Copy className="w-3 h-3" />
                    {t("copyPix")}
                  </Button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground max-w-xs leading-relaxed">
                  O aluno recebeu este QR Code via E-mail e WhatsApp. Você também pode acompanhá-lo na aba de Pagamentos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Lock, UserMinus, CheckCircle2, Copy, Send, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "./UserDetailsPrimitives";
import { notify } from "@/components/ui/toaster";
import { requestStudentDeactivationAction, resendInviteAction } from "@/modules/user/user.actions";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionWithPlan, Installment } from "../../../billing/billing.types";
import { useEffect } from "react";

interface ActionsTabProps {
  userId: string;
  userName: string;
  userEmail: string;
  userLocale: "pt" | "en";
  userRole: string;
  isActive: boolean;
  activeSubscription?: SubscriptionWithPlan | null;
  installments?: Installment[];
  cancellationPending?: boolean;
  cancellationPixCode?: string | null;
  cancellationPixImage?: string | null;
  cancellationPixExpiresAt?: Date | string | null;
  cancellationAmount?: number | null;
  onResendCancellationFee?: () => Promise<void>;
  onRegenerateCancellationFee?: () => Promise<void>;
  onMarkCancellationFeeAsPaid?: (password: string) => Promise<void>;
  adminPassword?: string;
  setAdminPassword?: (p: string) => void;
}

export function ActionsTab({
  userId,
  userName,
  userEmail,
  userLocale,
  userRole,
  isActive,
  activeSubscription,
  installments,
  cancellationPending,
  cancellationPixCode,
  cancellationPixImage,
  cancellationPixExpiresAt,
  cancellationAmount,
  onResendCancellationFee,
  onRegenerateCancellationFee,
  onMarkCancellationFeeAsPaid,
  adminPassword: adminPasswordProp,
  setAdminPassword: setAdminPasswordProp,
}: ActionsTabProps) {
  const t = useTranslations("UserManagement");
  const [localPassword, setLocalPassword] = useState("");
  const password = adminPasswordProp ?? localPassword;
  const setPassword = setAdminPasswordProp ?? setLocalPassword;
  const [isPending, setIsPending] = useState(false);
  const [isConfirmingFee, setIsConfirmingFee] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRegeneratingFee, setIsRegeneratingFee] = useState(false);
  const [pixData, setPixData] = useState<{ pixCode: string; pixImage: string; amount?: number } | null>(null);

  const isFeeExpired = Boolean(
    cancellationPixExpiresAt && new Date(cancellationPixExpiresAt) < new Date()
  );

  const handleRegenerateFee = async () => {
    if (!onRegenerateCancellationFee) return;
    setIsRegeneratingFee(true);
    try {
      await onRegenerateCancellationFee();
    } finally {
      setIsRegeneratingFee(false);
    }
  };

  useEffect(() => {
    if (cancellationPixCode && cancellationPixImage) {
      setPixData({
        pixCode: cancellationPixCode,
        pixImage: cancellationPixImage,
        amount: cancellationAmount ?? undefined,
      });
    } else if (activeSubscription?.status === "pending_fee" && activeSubscription.cancellationFeeInstallmentId) {
      const feeInstallment = installments?.find(i => i.id === activeSubscription.cancellationFeeInstallmentId);
      if (feeInstallment?.pixPayload && feeInstallment?.pixImage) {
        setPixData({
          pixCode: feeInstallment.pixPayload,
          pixImage: feeInstallment.pixImage,
          amount: feeInstallment.amount,
        });
      }
    }
  }, [cancellationPixCode, cancellationPixImage, cancellationAmount, activeSubscription, installments]);

  const handleDeactivate = async () => {
    if (!password) {
      notify.error(t("adminPasswordRequired"));
      return;
    }

    setIsPending(true);
    try {
      const result = await requestStudentDeactivationAction({ userId, password });
      
      if (result?.data && "success" in result.data && result.data.success) {
        const data = result.data as { feeRequired: boolean; pixCode?: string; pixImage?: string; amount?: number };
        if (data.feeRequired) {
          setPixData({ 
            pixCode: data.pixCode!, 
            pixImage: data.pixImage!,
            amount: data.amount,
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

  const handleResendInvite = async () => {
    setIsResending(true);
    const toastId = "resend-invite-toast";
    notify.loading(t("sendingInvite") || "Enviando convite de acesso...", undefined, toastId);
    try {
      const result = await resendInviteAction({ email: userEmail, locale: userLocale });
      if (result?.data?.success) {
        notify.success(t("success") || "Sucesso", t("inviteSentSuccess") || "Novo convite de acesso enviado por E-mail e WhatsApp!", toastId);
      } else {
        notify.error(t("error") || "Erro", t("inviteSentError") || "Falha ao enviar convite.", toastId);
      }
    } catch (err) {
      console.error(err);
      notify.error(t("error") || "Erro", t("inviteProcessError") || "Erro ao processar o reenvio.", toastId);
    } finally {
      setIsResending(false);
    }
  };

  const copyPix = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.pixCode);
      notify.success(t("pixCopySuccess"));
    }
  };

  const isCancellationPending = cancellationPending || !!cancellationPixCode || activeSubscription?.status === "pending_fee";

  let feeAmount = cancellationAmount;
  if (!feeAmount && activeSubscription?.status === "pending_fee" && activeSubscription.cancellationFeeInstallmentId) {
    const feeInstallment = installments?.find(i => i.id === activeSubscription.cancellationFeeInstallmentId);
    if (feeInstallment) {
      feeAmount = feeInstallment.amount;
    }
  }

  if (!isActive && !isCancellationPending) {
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
      {/* Resend Invite Section */}
      <div>
        <SectionLabel>{t("invitationsAndAccess") || "Convites e Acesso"}</SectionLabel>
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-bold text-sm">{t("resendAccessLink") || "Reenviar Link de Acesso"}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("resendAccessLinkDesc", { name: userName }) || `Envia um e-mail e uma mensagem de WhatsApp (se cadastrado) com as instruções para o primeiro acesso e definição de senha de ${userName}.`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleResendInvite}
            disabled={isResending}
          >
            <Send className="w-3 h-3 mr-2" />
            {isResending ? (t("sending") || "Enviando...") : (t("resendInviteBtn") || "Reenviar Convite")}
          </Button>
        </div>
      </div>

      {userRole === "student" && (
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
              {!isCancellationPending ? (
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
                    {isFeeExpired ? (
                      <Badge variant="outline" className="mb-2 font-black uppercase tracking-widest text-[9px] bg-red-500/10 text-red-500 border-red-500/20">
                        Código PIX expirado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mb-2 font-black uppercase tracking-widest text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20">{t("waitingPayment")}</Badge>
                    )}
                    <p className="font-black text-sm tracking-tight">{t("feeGenerated")}</p>
                    {feeAmount && (
                      <p className="text-xl font-black text-primary mt-1">
                        {(feeAmount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {t("feeGeneratedDesc")}
                    </p>
                  </div>

                  {isFeeExpired && onRegenerateCancellationFee && (
                    <div className="w-full max-w-sm flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 text-left">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-400">
                        Este código venceu no gateway e não pode mais ser pago. &quot;Reenviar&quot; manda o mesmo código morto — gere um novo.
                      </p>
                    </div>
                  )}

                  {onRegenerateCancellationFee && (
                    <div className={isFeeExpired ? "w-full max-w-sm" : "flex flex-col items-center gap-3"}>
                      <Button
                        type="button"
                        variant={isFeeExpired ? "default" : "outline"}
                        size="sm"
                        className="w-full gap-2 font-bold text-xs"
                        onClick={handleRegenerateFee}
                        disabled={isRegeneratingFee}
                      >
                        <RotateCw className={isRegeneratingFee ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
                        {isRegeneratingFee ? "Gerando..." : "Gerar Novo PIX"}
                      </Button>
                    </div>
                  )}

                  {pixData?.pixCode && (
                    <div className="p-4 bg-white rounded-md shadow-sm border flex flex-col items-center gap-4 w-full max-w-sm">
                      {pixData.pixImage && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={pixData.pixImage} alt="QR Code PIX" className="w-48 h-48" />
                      )}
                      <Button variant="outline" size="sm" className="w-full gap-2 font-bold text-[10px] uppercase tracking-widest" onClick={copyPix}>
                        <Copy className="w-3 h-3" />
                        {t("copyPix")}
                      </Button>

                      {onResendCancellationFee && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full gap-2 font-bold text-xs"
                          onClick={onResendCancellationFee}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Reenviar Taxa (E-mail / WhatsApp)
                        </Button>
                      )}
                    </div>
                  )}

                  {!pixData?.pixCode && onResendCancellationFee && (
                    <div className="flex flex-col items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2 font-bold text-xs"
                        onClick={onResendCancellationFee}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Reenviar Taxa (E-mail / WhatsApp)
                      </Button>
                    </div>
                  )}

                  {onMarkCancellationFeeAsPaid && (
                    <div className="flex flex-col gap-3 p-4 border rounded-md bg-background/50 w-full max-w-sm">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        {t("securityConfirmation")}
                      </Label>
                      <Input
                        type="password"
                        placeholder={t("adminPasswordPlaceholder")}
                        className="h-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 font-black text-xs uppercase tracking-widest"
                        onClick={async () => {
                          setIsConfirmingFee(true);
                          try {
                            await onMarkCancellationFeeAsPaid(password);
                          } finally {
                            setIsConfirmingFee(false);
                          }
                        }}
                        disabled={isConfirmingFee || !password}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("confirmAndMarkPaid")}
                      </Button>
                    </div>
                  )}

                  <p className="text-[10px] text-center text-muted-foreground max-w-xs leading-relaxed">
                    O aluno recebeu a cobrança via E-mail e WhatsApp. Você também pode acompanhá-la na aba de Pagamentos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

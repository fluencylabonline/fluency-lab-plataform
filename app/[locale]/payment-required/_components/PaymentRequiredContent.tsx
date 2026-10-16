"use client";

import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { Copy, Check, Lock, Loader2, RotateCw, CreditCard, AlertTriangle } from "lucide-react";
import {
  refreshBlockedPaymentAction,
  getPaymentBlockStatusAction,
  syncInstallmentPaymentAction,
} from "@/modules/billing/billing.actions";

interface PaymentRequiredContentProps {
  info: {
    installmentId: string;
    amount: number;
    currency: string;
    dueDate: string;
    pixPayload: string | null;
    pixImage: string | null;
    paymentExpiresAt: string | null;
    pendingCount: number;
    cancelDate: string;
  };
}

export function PaymentRequiredContent({ info }: PaymentRequiredContentProps) {
  const t = useTranslations("PaymentRequired");
  const formatIntl = useFormatter();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const autoRefreshed = useRef<string | null>(null);

  const isLink = !!info.pixPayload && /^https?:\/\//.test(info.pixPayload);
  const isExpired =
    !info.pixPayload ||
    (!!info.paymentExpiresAt && new Date(info.paymentExpiresAt).getTime() < Date.now());

  const refreshPayment = async () => {
    setIsRefreshing(true);
    setRefreshFailed(false);
    const result = await refreshBlockedPaymentAction({ installmentId: info.installmentId });
    setIsRefreshing(false);
    if (result?.data?.success && result.data.status !== "unavailable") {
      router.refresh();
    } else {
      setRefreshFailed(true);
    }
  };

  // Código ausente ou vencido: gera um novo sozinho, uma vez por parcela.
  useEffect(() => {
    if (isExpired && autoRefreshed.current !== info.installmentId) {
      autoRefreshed.current = info.installmentId;
      void refreshPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired, info.installmentId]);

  // Pagamento confirmado pelo webhook: volta para o hub.
  const { data: status } = useSWR(
    "payment-block-status",
    async () => (await getPaymentBlockStatusAction())?.data,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    if (status && status.blocked === false) {
      notify.success(t("paymentConfirmed") || "Pagamento confirmado! Liberando seu acesso...");
      router.push("/hub");
    }
  }, [status, router, t]);

  const copyCode = async () => {
    if (!info.pixPayload) return;
    try {
      await navigator.clipboard.writeText(info.pixPayload);
      setCopied(true);
      notify.success(t("copied") || "Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error(t("copyError") || "Não foi possível copiar o código.");
    }
  };

  const verifyPayment = async () => {
    setIsVerifying(true);
    const result = await syncInstallmentPaymentAction({ installmentId: info.installmentId });
    setIsVerifying(false);
    if (result?.data?.success && result.data.status === "paid") {
      router.refresh();
    } else if (result?.data?.success) {
      notify.info(t("paymentPending") || "O pagamento ainda não foi confirmado.");
    } else {
      notify.error(t("verifyError") || "Erro ao verificar o pagamento.");
    }
  };

  const amount = formatIntl.number(info.amount / 100, { style: "currency", currency: info.currency });
  const dueDate = formatIntl.dateTime(new Date(info.dueDate), { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="flex-1 container max-w-2xl py-12 px-4 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-8">
        <Lock className="w-10 h-10 text-red-500" />
      </div>

      <h1 className="text-3xl font-bold mb-4 tracking-tight">{t("title") || "Acesso bloqueado"}</h1>
      <p className="text-muted-foreground mb-4 max-w-md">{t("description")}</p>
      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-10 max-w-md">
        {t("cancelNotice", { date: info.cancelDate })}
      </p>

      <div className="card w-full p-6 sm:p-8 space-y-8 border-2" data-tour="payment-required.card">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("amountToPay") || "Valor a pagar"}</p>
          <p className="text-4xl font-black text-primary">{amount}</p>
          <p className="text-xs text-muted-foreground">
            {t("dueDate") || "Vencimento"}: {dueDate}
          </p>
        </div>

        {isRefreshing || (isExpired && !refreshFailed) ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("generating") || "Gerando um código de pagamento válido..."}</p>
          </div>
        ) : refreshFailed ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 text-left w-full">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{t("unavailable")}</p>
            </div>
            <Button onClick={refreshPayment} className="gap-2 w-full sm:w-auto">
              <RotateCw className="w-4 h-4" />
              {t("tryAgain") || "Tentar de novo"}
            </Button>
          </div>
        ) : isLink ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">{t("cardInstructions")}</p>
            <a
              href={info.pixPayload!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground w-full sm:w-auto"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {t("payWithCard") || "Pagar com cartão"}
            </a>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-6">
              <p className="text-sm font-medium">{t("pixInstructions")}</p>
              {info.pixImage && (
                <div className="p-4 bg-white rounded-2xl border-4 border-muted">
                  <Image src={info.pixImage} alt="QR Code PIX" width={256} height={256} className="w-56 h-56 sm:w-64 sm:h-64" unoptimized />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-6 border-t">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("pixCopyPaste")}</p>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 bg-muted/50 p-3 rounded-md border text-left truncate font-mono text-[10px] leading-relaxed select-all">
                  {info.pixPayload}
                </div>
                <Button size="icon" variant="secondary" onClick={copyCode} className="shrink-0 h-10 w-10" aria-label={t("copied")}>
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}

        {!isExpired && !refreshFailed && (
          <Button variant="outline" onClick={verifyPayment} disabled={isVerifying} className="gap-2 w-full sm:w-auto">
            <RotateCw className={isVerifying ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            {isVerifying ? t("verifying") || "Verificando..." : t("verifyPayment") || "Já paguei, verificar"}
          </Button>
        )}
      </div>

      {info.pendingCount > 1 && (
        <p className="mt-6 text-sm text-muted-foreground max-w-md">{t("morePending", { count: info.pendingCount })}</p>
      )}

      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-primary/5 text-primary text-sm font-medium border border-primary/10">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t("waitingPayment")}
        </div>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{t("helpInfo")}</p>
      </div>
    </div>
  );
}

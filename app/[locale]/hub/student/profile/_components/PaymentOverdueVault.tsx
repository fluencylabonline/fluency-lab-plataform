"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { Locale } from "@/i18n/config";
import { notify } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Copy,
  RotateCw,
  CreditCard,
} from "lucide-react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultIcon,
} from "@/components/ui/vault";
import { syncInstallmentPaymentAction, generateInstallmentInvoiceAction } from "@/modules/billing/billing.actions";

interface PaymentOverdueVaultProps {
  subscription: {
    subscriptionId: string;
    subscriptionStatus: string;
    planName: string;
    currency?: string;
    currentInstallment: {
      id: string;
      amount: number;
      dueDate: Date;
      status: string;
      pixCode: string | null;
      pixQrCode: string | null;
      orderIndex: number;
      totalMonths: number;
    } | null;
    lastPaymentDate: Date | null;
  } | null;
}

export function PaymentOverdueVault({ subscription }: PaymentOverdueVaultProps) {
  const t = useTranslations("Hub.StudentProfile.Payment");
  const locale = useLocale();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentInstallment = subscription?.currentInstallment;
  
  const getIsOverdue = () => {
    if (!currentInstallment) return false;
    if (currentInstallment.status === "overdue") return true;
    if (currentInstallment.status === "pending") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return new Date(currentInstallment.dueDate) < todayStart;
    }
    return false;
  };

  const isOverdue = getIsOverdue();

  useEffect(() => {
    if (isOverdue && typeof window !== "undefined") {
      const alreadyShown = sessionStorage.getItem("overdue_vault_shown");
      if (!alreadyShown) {
        setIsOpen(true);
        sessionStorage.setItem("overdue_vault_shown", "true");
      }
    }
  }, [isOverdue]);

  if (!currentInstallment || !isOverdue) return null;

  const isCreditCard = subscription.currency === "USD" || !!currentInstallment.pixCode?.startsWith("http");

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    try {
      const result = await syncInstallmentPaymentAction({
        installmentId: currentInstallment.id,
      });

      if (result?.data?.success) {
        const status = result.data.status;
        if (status === "paid") {
          notify.success(t("paymentConfirmed") || "Pagamento confirmado com sucesso!");
          setIsOpen(false);
          window.location.reload();
        } else {
          notify.info(
            t("paymentPending") ||
              "Seu pagamento ainda consta como pendente no intermediador. Caso já tenha pago, aguarde alguns instantes e tente novamente.",
          );
        }
      } else {
        notify.error(result?.data?.error || t("verifyError") || "Erro ao verificar status do pagamento.");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      notify.error(t("verifyError") || "Erro ao verificar status do pagamento.");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyPixCode = async () => {
    if (currentInstallment.pixCode) {
      try {
        await navigator.clipboard.writeText(currentInstallment.pixCode);
        notify.success(t("copySuccess"));
      } catch {
        notify.error(t("copyError"));
      }
    }
  };


  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    try {
      const result = await generateInstallmentInvoiceAction({
        installmentId: currentInstallment.id,
      });

      if (result?.data?.success) {
        notify.success(t("invoiceGeneratedSuccess") || "Código de pagamento gerado com sucesso!");
        window.location.reload();
      } else {
        notify.error(result?.data?.error || "Erro ao gerar código de pagamento.");
      }
    } catch (error) {
      console.error("Error generating payment code:", error);
      notify.error("Erro ao gerar código de pagamento.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Vault open={isOpen} onOpenChange={setIsOpen}>
      <VaultContent showHandle={true} className="sm:max-w-md">
        <VaultHeader>
          <VaultIcon type="warning" className="text-amber-500 bg-amber-50 dark:bg-amber-950/30" />
          <VaultTitle className="text-xl font-bold text-center text-zinc-900 dark:text-zinc-100">
            {t("overdueVaultTitle") || "Regularize seu acesso"}
          </VaultTitle>
          <VaultDescription className="text-sm text-zinc-500 dark:text-zinc-400 text-center mt-1">
            {t("overdueVaultDesc") || "Detectamos que você possui uma mensalidade em atraso. Efetue o pagamento abaixo para evitar o bloqueio temporário das aulas e demais recursos da plataforma."}
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-4 py-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-0.5">
                {t("value") || "Valor"}
              </p>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(currentInstallment.amount, locale as Locale, subscription.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-0.5">
                {t("nextDue") || "Vencimento"}
              </p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {t("expired") || "Vencida"}
              </p>
            </div>
          </div>

          {currentInstallment.pixCode ? (
            isCreditCard ? (
              <div className="flex flex-col items-center gap-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-violet-500" />
                </div>
                
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {t("creditCardInstructions") || "Pagamento Pendente via Stripe"}
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    {t("stripeInstructions") || "Clique no botão abaixo para ir à página segura de pagamentos da Stripe e efetuar o checkout com cartão de crédito internacional."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-2">
                  <a
                    href={currentInstallment.pixCode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-violet-500 hover:scale-[1.01]"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t("payNowBtn") || "Ir para o Pagamento"}
                  </a>

                  <Button
                    size="default"
                    variant="outline"
                    className="w-full gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    onClick={handleVerifyPayment}
                    disabled={isVerifying}
                  >
                    <RotateCw className={cn("w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400", isVerifying && "animate-spin")} />
                    {isVerifying ? t("verifying") || "Verificando..." : t("verifyPayment") || "Verificar Pagamento"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative shrink-0 group bg-white p-2 rounded-md border-2 border-dashed border-zinc-200 dark:border-zinc-700 shadow-sm">
                  {currentInstallment.pixQrCode && (
                    <Image
                      src={currentInstallment.pixQrCode}
                      alt="QR Code PIX"
                      width={140}
                      height={140}
                      className="rounded-lg mix-blend-multiply dark:mix-blend-normal dark:bg-white"
                    />
                  )}
                  <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                    <span className="bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-pulse text-red-400" />{" "}
                      {t("overdue_badge") || "Vencida"}
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-3 mt-2 text-center">
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    {t("pix_qr_instructions") || "Use o app do seu banco para escanear ou copie o código abaixo."}
                  </p>

                  <div className="w-full flex items-center gap-2 p-1.5 pl-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <code className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate select-all text-left">
                      {currentInstallment.pixCode}
                    </code>
                    <Button
                      size="sm"
                      className="h-8 shadow-sm bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600"
                      onClick={copyPixCode}
                    >
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      {t("copyPix") || "Copiar Código"}
                    </Button>
                  </div>

                  <Button
                    size="default"
                    variant="outline"
                    className="w-full gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    onClick={handleVerifyPayment}
                    disabled={isVerifying}
                  >
                    <RotateCw className={cn("w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400", isVerifying && "animate-spin")} />
                    {isVerifying ? t("verifying") || "Verificando..." : t("verifyPayment") || "Já paguei, verificar pagamento"}
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-400 text-center space-y-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 opacity-40 animate-pulse text-amber-500" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("pixAvailability") || "Fatura em processamento"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px]">
                  {t("pix_processing_desc") || "Seu QR Code está sendo processado e aparecerá aqui automaticamente."}
                </p>
              </div>

              <Button
                size="default"
                variant="outline"
                className="w-full gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                onClick={handleGenerateInvoice}
                disabled={isGenerating}
              >
                <RotateCw className={cn("w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400", isGenerating && "animate-spin")} />
                {isGenerating
                  ? t("generating") || "Gerando..."
                  : t("generatePix") || "Gerar Código de Pagamento"}
              </Button>
            </div>
          )}
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { notify } from "@/components/ui/toaster";
import Image from "next/image";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  AlertTriangle,
  XCircle,
  QrCode,
  Wallet,
  Wallet2,
  RotateCw,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { syncInstallmentPaymentAction } from "@/modules/billing/billing.actions";

interface StudentPaymentStatusCardProps {
  subscription: {
    subscriptionId: string;
    subscriptionStatus: string;
    planName: string;
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

export function StudentPaymentStatusCard({
  subscription,
}: StudentPaymentStatusCardProps) {
  const t = useTranslations("Hub.StudentProfile.Payment");
  const locale = useLocale();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPayment = async () => {
    if (!subscription?.currentInstallment?.id) return;

    setIsVerifying(true);
    try {
      const result = await syncInstallmentPaymentAction({
        installmentId: subscription.currentInstallment.id,
      });

      if (result?.data?.success) {
        const status = result.data.status;
        if (status === "paid") {
          notify.success(
            t("paymentConfirmed") || "Pagamento confirmado com sucesso!",
          );
        } else {
          notify.info(
            t("paymentPending") ||
              "Seu pagamento ainda consta como pendente no intermediador. Caso já tenha pago, aguarde alguns instantes e tente novamente.",
          );
        }
      } else {
        notify.error(
          result?.data?.error ||
            t("verifyError") ||
            "Erro ao verificar status do pagamento.",
        );
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      notify.error(
        t("verifyError") || "Erro ao verificar status do pagamento.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const copyPixCode = async () => {
    if (subscription?.currentInstallment?.pixCode) {
      try {
        await navigator.clipboard.writeText(
          subscription.currentInstallment.pixCode,
        );
        notify.success(t("copySuccess"));
      } catch {
        notify.error(t("copyError"));
      }
    }
  };

  const getDaysUntilDue = () => {
    if (!subscription?.currentInstallment?.dueDate) return null;
    const dueDate = new Date(subscription.currentInstallment.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
      case "paid":
        return {
          bg: "bg-teal-50 dark:bg-teal-900/10",
          text: "text-teal-700 dark:text-teal-400",
          border: "border-teal-200 dark:border-teal-800",
          icon: CheckCircle2,
          label: t("active"),
        };
      case "overdue":
        return {
          bg: "bg-red-50 dark:bg-red-900/10",
          text: "text-red-700 dark:text-red-400",
          border: "border-red-200 dark:border-red-800",
          icon: AlertTriangle,
          label: t("overdue"),
        };
      case "cancelled":
      case "expired":
        return {
          bg: "bg-zinc-100 dark:bg-zinc-800/50",
          text: "text-zinc-600 dark:text-zinc-400",
          border: "border-zinc-200 dark:border-zinc-700",
          icon: XCircle,
          label: t("canceled"),
        };
      default:
        return {
          bg: "bg-amber-50 dark:bg-amber-900/10",
          text: "text-amber-700 dark:text-amber-400",
          border: "border-amber-200 dark:border-amber-800",
          icon: Clock,
          label: t("pending"),
        };
    }
  };

  if (!subscription || !subscription.subscriptionId) {
    return (
      <div className="card-base flex flex-col items-center justify-center p-8 h-full">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-full mb-4 ring-1 ring-amber-200 dark:ring-amber-700">
          <Wallet className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg mb-2 text-center">
          {t("noSubscription")}
        </h3>
        <p className="text-sm text-zinc-500 mb-6 text-center max-w-[250px]">
          {t("no_plan_desc")}
        </p>
        <Button variant="outline" className="gap-2">
          <a
            href={`/${locale}/hub/student/payments`}
            className="flex flex-row items-center gap-2"
          >
            <QrCode className="w-4 h-4 mr-1" />
            {t("managePayments")}
          </a>
        </Button>
      </div>
    );
  }

  const currentStatus =
    subscription.currentInstallment?.status || subscription.subscriptionStatus;
  const statusConfig = getStatusConfig(currentStatus);
  const StatusIcon = statusConfig.icon;
  const daysUntilDue = getDaysUntilDue();
  const isOverdue = currentStatus === "overdue";

  return (
    <div
      className={cn(
        "card flex flex-col h-full transition-all duration-300",
        isOverdue
          ? "border-red-200 dark:border-red-900/50 shadow-red-100 dark:shadow-none"
          : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      <div className="p-5 flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-md shadow-sm border",
              "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400",
            )}
          >
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg leading-tight">
              {subscription.planName}
            </h3>
            <p className="text-xs text-zinc-500">{t("pix")}</p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full text-xs font-semibold border transition-colors",
            statusConfig.bg,
            statusConfig.text,
            statusConfig.border,
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col justify-center">
        <div className="w-full">
          {subscription.currentInstallment &&
          ((daysUntilDue !== null && daysUntilDue <= 7) || isOverdue) ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              {subscription.currentInstallment.pixCode ? (
                <div className="flex flex-col lg:flex-row gap-5 items-center lg:items-start">
                  <div className="relative shrink-0 group bg-white p-2 rounded-md border-2 border-dashed border-zinc-200 dark:border-zinc-700 shadow-sm">
                    {subscription.currentInstallment.pixQrCode && (
                      <Image
                        src={subscription.currentInstallment.pixQrCode}
                        alt="QR Code PIX"
                        width={120}
                        height={120}
                        className="rounded-lg mix-blend-multiply dark:mix-blend-normal dark:bg-white"
                      />
                    )}
                    <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                      <span className="bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {isOverdue ? t("overdue_badge") : t("pending_badge")}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-3 min-w-0">
                    <div className="text-center lg:text-left">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {t("pixInstructions")}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {t("pix_qr_instructions")}
                      </p>
                    </div>

                    <div className="relative flex items-center">
                      <div className="w-full flex items-center gap-2 p-1.5 pl-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                        <code className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate select-all">
                          {subscription.currentInstallment.pixCode}
                        </code>
                        <Button
                          size="sm"
                          className="h-8 shadow-sm bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600"
                          onClick={copyPixCode}
                        >
                          <Copy className="w-3.5 h-3.5 mr-2" />
                          {t("copyPix")}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        size="default"
                        variant="outline"
                        className="w-full gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        onClick={handleVerifyPayment}
                        disabled={isVerifying}
                      >
                        <RotateCw
                          className={cn(
                            "w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400",
                            isVerifying && "animate-spin",
                          )}
                        />
                        {isVerifying
                          ? t("verifying") || "Verificando..."
                          : t("verifyPayment") ||
                            "Já paguei, verificar pagamento"}
                      </Button>

                      <Button
                        size="default"
                        variant="ghost"
                        className="w-full gap-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50"
                      >
                        <a
                          href={`/${locale}/hub/student/payments`}
                          className="flex flex-row items-center gap-2"
                        >
                          <Wallet2 className="w-4 h-4 mr-2 text-zinc-500" />
                          {t("managePayments") || "Gerenciar pagamentos"}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-4">
                      <Wallet2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      {t("pixAvailability")}
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-[200px]">
                      {t("pix_processing_desc")}
                    </p>
                  </div>

                  <Button
                    size="default"
                    variant="outline"
                    className="gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  >
                    <a
                      href={`/${locale}/hub/student/payments`}
                      className="flex flex-row items-center gap-2"
                    >
                      <Wallet2 className="w-4 h-4 mr-2 text-zinc-500" />
                      {t("managePayments") || "Gerenciar pagamentos"}
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-zinc-400 text-center space-y-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("pixAvailability")}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {t("pixRelease", { days: daysUntilDue ?? 0 })}
                </p>
              </div>

              <Button
                size="default"
                variant="outline"
                className="gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
              >
                <a
                  href={`/${locale}/hub/student/payments`}
                  className="flex flex-row items-center gap-2"
                >
                  <Wallet2 className="w-4 h-4 mr-2 text-zinc-500" />
                  {t("managePayments") || "Gerenciar pagamentos"}
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-100 dark:border-zinc-800 p-4 lg:p-5 rounded-b-xl">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
          <div className="flex flex-col col-span-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
              {t("value")}
            </span>
            <span className="text-base lg:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {subscription.currentInstallment?.amount
                ? formatCurrency(subscription.currentInstallment.amount)
                : "-"}
            </span>
          </div>

          <div className="flex flex-col col-span-1 border-l border-zinc-200 dark:border-zinc-800 pl-4 lg:pl-6 min-w-max">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
              {t("nextDue")}
            </span>
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
              {isOverdue ? (
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t("expired")}
                </span>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-sm font-medium">
                    {subscription.currentInstallment?.dueDate
                      ? new Date(
                          subscription.currentInstallment.dueDate,
                        ).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "short",
                        })
                      : "-"}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:flex flex-col border-l border-zinc-200 dark:border-zinc-800 pl-6">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-1">
              {t("lastPayment")}
            </span>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {subscription.lastPaymentDate
                ? new Date(subscription.lastPaymentDate).toLocaleDateString(
                    locale,
                    { day: "2-digit", month: "short", year: "2-digit" },
                  )
                : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

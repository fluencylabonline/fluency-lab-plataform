"use client";

import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Download, ChevronDown, ChevronUp, Copy, RotateCw, CreditCard } from "lucide-react";
import { notify } from "@/components/ui/toaster";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { syncInstallmentPaymentAction } from "@/modules/billing/billing.actions";
import Image from "next/image";

export interface PaymentRecord {
  id: string;
  status: string;
  dueDate: Date | string;
  amount: number;
  subscription?: {
    plan?: {
      name: string;
      currency?: string;
    };
  };
  pixPayload?: string | null;
  pixImage?: string | null;
}

interface PaymentHistoryProps {
  initialData: PaymentRecord[];
}

export function PaymentHistory({ initialData }: PaymentHistoryProps) {
  const t = useTranslations("Hub.Payments");
  const tProfile = useTranslations("Hub.StudentProfile.Payment");
  const router = useRouter();
  const formatIntl = useFormatter();
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  const formatCurrency = (val: number, currency: string = "BRL") =>
    formatIntl.number(val / 100, {
      style: "currency",
      currency,
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-500 bg-green-500/10";
      case "pending":
        return "text-amber-500 bg-amber-500/10";
      case "overdue":
        return "text-red-500 bg-red-500/10";
      case "cancelled":
        return "text-slate-500 bg-slate-500/10";
      default:
        return "text-slate-500 bg-slate-500/10";
    }
  };

  const handleGetInvoice = () => {
    notify.info("A implementar");
  };

  const handleViewReceipt = (id: string) => {
    router.push(`/hub/financial/receipt/${id}`);
  };

  const copyPixCode = async (pixCode: string) => {
    try {
      await navigator.clipboard.writeText(pixCode);
      notify.success(tProfile("copySuccess") || "Código copiado!");
    } catch {
      notify.error(tProfile("copyError") || "Erro ao copiar código.");
    }
  };

  const handleVerifyPayment = async (installmentId: string) => {
    setIsVerifying(installmentId);
    try {
      const result = await syncInstallmentPaymentAction({
        installmentId,
      });

      if (result?.data?.success) {
        const status = result.data.status;
        if (status === "paid") {
          notify.success(
            tProfile("paymentConfirmed") || "Pagamento confirmado com sucesso!",
          );
          router.refresh();
          setExpandedPaymentId(null);
        } else {
          notify.info(
            tProfile("paymentPending") ||
              "Seu pagamento ainda consta como pendente no intermediador. Caso já tenha pago, aguarde alguns instantes e tente novamente.",
          );
        }
      } else {
        notify.error(
          result?.data?.error ||
            tProfile("verifyError") ||
            "Erro ao verificar status do pagamento.",
        );
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      notify.error(
        tProfile("verifyError") || "Erro ao verificar status do pagamento.",
      );
    } finally {
      setIsVerifying(null);
    }
  };

  if (initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
        <Receipt className="w-12 h-12 mb-4" />
        <p>{t("noPayments")}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {initialData.map((payment) => {
        const isPending = payment.status !== "paid";
        const hasActionDetails = isPending && !!payment.pixPayload;
        const isExpanded = expandedPaymentId === payment.id;

        return (
          <motion.div
            key={payment.id}
            variants={itemVariants}
            onClick={() => {
              if (hasActionDetails) {
                setExpandedPaymentId(isExpanded ? null : payment.id);
              }
            }}
            className={cn(
              "item flex flex-col p-4 gap-4 transition-all duration-200",
              hasActionDetails && "cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10"
            )}
          >
            {/* Top row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{payment.subscription?.plan?.name || "Plano"}</p>
                  <p className="text-sm opacity-60">
                    {t("date")}: {formatIntl.dateTime(new Date(payment.dueDate), { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(payment.amount, payment.subscription?.plan?.currency)}</p>
                  <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${getStatusColor(payment.status)}`}>
                    {t(payment.status)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {payment.status === "paid" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReceipt(payment.id);
                      }}
                      className="h-9 gap-2"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{t("viewReceipt")}</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetInvoice();
                    }}
                    className="h-9 gap-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{t("getInvoice")}</span>
                  </Button>

                  {hasActionDetails && (
                    <div className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors ml-1 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Accordion panel */}
            <AnimatePresence initial={false}>
              {hasActionDetails && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking inside content
                  className="border-t border-zinc-100 dark:border-zinc-800/50 pt-4 flex flex-col md:flex-row gap-5 items-center md:items-start w-full overflow-hidden"
                >
                  {payment.pixImage ? (
                    <>
                      <div className="shrink-0 bg-white p-2 rounded-md border border-zinc-200 dark:border-zinc-700">
                        <Image
                          src={payment.pixImage}
                          alt="QR Code PIX"
                          width={120}
                          height={120}
                          className="rounded-lg mix-blend-multiply dark:mix-blend-normal dark:bg-white"
                        />
                      </div>
                      
                      <div className="flex-1 w-full space-y-3 min-w-0">
                        <div className="text-center md:text-left">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {tProfile("pixInstructions") || "Pagamento via PIX"}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {tProfile("pix_qr_instructions") || "Use o app do seu banco para escanear ou copie o código abaixo."}
                          </p>
                        </div>

                        <div className="relative flex items-center w-full">
                          <div className="w-full flex items-center gap-2 p-1.5 pl-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                            <code className="flex-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate select-all">
                              {payment.pixPayload}
                            </code>
                            <Button
                              size="sm"
                              className="h-8 shadow-sm bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPixCode(payment.pixPayload!);
                              }}
                            >
                              <Copy className="w-3.5 h-3.5 mr-2" />
                              {tProfile("copyPix") || "Copiar Código"}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <Button
                            size="default"
                            variant="outline"
                            className="w-full sm:w-auto gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyPayment(payment.id);
                            }}
                            disabled={isVerifying === payment.id}
                          >
                            <RotateCw
                              className={cn(
                                "w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400",
                                isVerifying === payment.id && "animate-spin",
                              )}
                            />
                            {isVerifying === payment.id
                              ? tProfile("verifying") || "Verificando..."
                              : tProfile("verifyPayment") || "Já paguei, verificar pagamento"}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 w-full space-y-3 min-w-0">
                      <div className="text-center md:text-left">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {tProfile("stripeInstructions") || "Pagamento via Cartão de Crédito"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {tProfile("stripe_instructions_desc") || "Para efetuar o pagamento, clique no botão abaixo para ir ao checkout seguro."}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
                        {payment.pixPayload && (
                          <a
                            href={payment.pixPayload}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-violet-500 hover:scale-[1.01] w-full sm:w-auto"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            {tProfile("payNowBtn") || "Ir para o Pagamento"}
                          </a>
                        )}

                        <Button
                          size="default"
                          variant="outline"
                          className="w-full sm:w-auto gap-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyPayment(payment.id);
                          }}
                          disabled={isVerifying === payment.id}
                        >
                          <RotateCw
                            className={cn(
                              "w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400",
                              isVerifying === payment.id && "animate-spin",
                            )}
                          />
                          {isVerifying === payment.id
                            ? tProfile("verifying") || "Verificando..."
                            : tProfile("verifyPayment") || "Já paguei, verificar pagamento"}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

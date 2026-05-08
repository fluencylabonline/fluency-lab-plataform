"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Download,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { getContractDownloadUrlAction, resendContractEmailAction } from "@/modules/contract/contract.actions";
import { format, differenceInDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ContractWithTemplate } from "@/modules/contract/contract.types";
import Link from "next/link";
import { Header } from "@/components/layout/header";

interface ContractDetailsProps {
  contract: ContractWithTemplate | null;
}

export function ContractDetails({ contract }: ContractDetailsProps) {
  const t = useTranslations("Hub.Contract");
  const { locale } = useParams();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const currentLocale = locale === "pt" ? ptBR : enUS;
  if (!contract) {
    return (
      <>
        <Header
          title={t("title")}
          subtitle={t("description")}
          backHref="/hub/student/profile"
          className="contents"
        />
        <main className="container py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
              <FileText className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("noContract")}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              {t("noContractDesc")}
            </p>
          </div>
        </main>
      </>
    );
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = await getContractDownloadUrlAction({ instanceId: contract.id });
      if (result?.data?.success && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
      } else {
        notify.error(t("resendError"));
      }
    } catch {
      notify.error(t("resendError"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const result = await resendContractEmailAction({ instanceId: contract.id });
      if (result?.data?.success) {
        notify.success(t("resendSuccess"));
      } else {
        notify.error(result?.data?.error || t("resendError"));
      }
    } catch {
      notify.error(t("resendError"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const isExpired = contract.status === "expired";
  const isPending = contract.status === "pending";
  const isSigned = contract.status === "signed";

  const daysUntilExpiration = contract.expiresAt
    ? differenceInDays(new Date(contract.expiresAt), new Date())
    : null;

  const isExpiringSoon = isSigned && daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0;

  return (
    <>
       <Header
          title={t("title")}
          subtitle={t("description")}
          backHref="/hub/student/profile"
          className="contents"
        />
      <main className="container pb-20">
        <div className="flex flex-col gap-6">
          {/* Status Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "card p-6 flex flex-col md:flex-row items-center gap-6",
              isSigned && !isExpiringSoon && "border-teal-100 dark:border-teal-900/30",
              (isExpired || isExpiringSoon) && "border-amber-100 dark:border-amber-900/30",
              isPending && "border-rose-100 dark:border-rose-900/30"
            )}
          >
            <div className={cn(
              "p-4 rounded-full",
              isSigned && !isExpiringSoon && "bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
              (isExpired || isExpiringSoon) && "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
              isPending && "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
            )}>
              {isSigned && !isExpiringSoon && <CheckCircle2 className="w-10 h-10" />}
              {(isExpired || isExpiringSoon) && <AlertTriangle className="w-10 h-10" />}
              {isPending && <Clock className="w-10 h-10" />}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {isSigned && !isExpiringSoon && t("active")}
                {isExpiringSoon && t("active")}
                {isExpired && t("expired")}
                {isPending && t("pending")}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                {isExpiringSoon && t("expiringSoon", { days: daysUntilExpiration })}
                {isPending && t("signPending")}
                {isSigned && !isExpiringSoon && t("description")}
              </p>
            </div>

            {isPending && (
              <Link href="/onboarding/contract">
                <Button variant="default" rightIcon={<ExternalLink className="w-4 h-4" />}>
                  {t("signNow")}
                </Button>
              </Link>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
                {t("validityTitle")}
              </h3>

              <div className="space-y-4">
                {contract.template && (
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Tipo</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {contract.template.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">{t("statusTitle")}</span>
                  <span className={cn(
                    "font-bold uppercase text-xs px-2 py-1 rounded-md",
                    isSigned && "bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
                    isExpired && "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                    isPending && "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                  )}>
                    {t(contract.status)}
                  </span>
                </div>

                {contract.signedAt && (
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">Assinado em</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(new Date(contract.signedAt), "PP", { locale: currentLocale })}
                    </span>
                  </div>
                )}

                {contract.expiresAt && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500 dark:text-zinc-400">{t("validityTitle")}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(new Date(contract.expiresAt), "PP", { locale: currentLocale })}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
                {t("actionsTitle")}
              </h3>

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  disabled={!contract.pdfUrl}
                >
                  {t("download")}
                </Button>

                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={<Mail className="w-4 h-4" />}
                  onClick={handleResendEmail}
                  isLoading={isSendingEmail}
                  disabled={!contract.pdfUrl || isPending}
                >
                  {t("resendEmail")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}

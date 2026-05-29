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
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { getContractDownloadUrlAction, resendContractEmailAction, signContractAction } from "@/modules/contract/contract.actions";
import { format, differenceInDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ContractWithTemplate } from "@/modules/contract/contract.types";
import { Header } from "@/components/layout/header";
import DOMPurify from "dompurify";
import { injectTemplateData } from "@/modules/contract/contract.service.utils";
import type { User } from "@/modules/user/user.schema";

interface ContractDetailsProps {
  contract: ContractWithTemplate | null;
  user?: User;
}

export function ContractDetails({ contract, user }: ContractDetailsProps) {
  const t = useTranslations("Hub.Contract");
  const { locale } = useParams();
  const [currentContract, setCurrentContract] = useState<ContractWithTemplate | null>(contract);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [, setIsSignedDirectly] = useState(false);
  const [, setSignedDownloadUrl] = useState<string | null>(null);

  const currentLocale = locale === "pt" ? ptBR : enUS;

  if (!currentContract) {
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
    if (!currentContract) return;
    setIsDownloading(true);
    try {
      const result = await getContractDownloadUrlAction({ instanceId: currentContract.id });
      if (result?.data?.success && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
      } else {
        notify.error(t("resendError") || "Erro ao baixar o contrato.");
      }
    } catch {
      notify.error(t("resendError") || "Erro ao baixar o contrato.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!currentContract) return;
    setIsSendingEmail(true);
    try {
      const result = await resendContractEmailAction({ instanceId: currentContract.id });
      if (result?.data?.success) {
        notify.success(t("resendSuccess") || "E-mail enviado com sucesso!");
      } else {
        notify.error(result?.data?.error || t("resendError") || "Erro ao reenviar o e-mail.");
      }
    } catch {
      notify.error(t("resendError") || "Erro ao reenviar o e-mail.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const onSign = async () => {
    if (!currentContract) return;
    setIsSigning(true);

    const fingerprint = [
      navigator.language,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.userAgent.split(" ").slice(-1)[0]
    ].join("|");

    try {
      const signResult = await signContractAction({
        instanceId: currentContract.id,
        fingerprint,
        guardianData: user?.guardianName
          ? {
              name: user.guardianName,
              taxId: user.guardianTaxId || "",
              relationship: user.guardianRelationship || "",
            }
          : undefined,
      });

      if (signResult?.data?.success) {
        setIsSignedDirectly(true);
        setSignedDownloadUrl(signResult.data.downloadUrl || null);
        setCurrentContract({
          ...currentContract,
          status: "signed",
          signedAt: new Date(),
          pdfUrl: signResult.data.pdfPath || ""
        });
        notify.success("Contrato assinado com sucesso!");
      } else {
        notify.error(signResult?.data?.error || "Erro ao assinar contrato.");
      }
    } catch (err) {
      console.error("[onSign] Error signing contract:", err);
      notify.error("Falha ao assinar contrato. Tente novamente.");
    } finally {
      setIsSigning(false);
    }
  };

  const isExpired = currentContract.status === "expired";
  const isPending = currentContract.status === "pending";
  const isSigned = currentContract.status === "signed";

  const daysUntilExpiration = currentContract.expiresAt
    ? differenceInDays(new Date(currentContract.expiresAt), new Date())
    : null;

  const isExpiringSoon = isSigned && daysUntilExpiration !== null && daysUntilExpiration <= 30 && daysUntilExpiration > 0;

  const previewContent = currentContract.template && user
    ? injectTemplateData(currentContract.template.content, {
        user: {
          name: user.name || "",
          email: user.email || "",
          taxId: user.taxId || "",
          businessTaxId: user.businessTaxId || "",
          pixKey: user.pixKey || "",
        },
        guardian: user.guardianName
          ? {
              name: user.guardianName,
              taxId: user.guardianTaxId || "",
              relationship: user.guardianRelationship || "",
            }
          : undefined,
        school: {
          name: "FluencyLab",
          legalName: "FluencyLab LTDA",
          taxId: "00.000.000/0001-00",
          representativeName: "Diretoria",
        },
        date: new Date().toLocaleDateString("pt-BR"),
      })
    : "";

  const sanitizedPreview = DOMPurify.sanitize(previewContent);

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
                {isSigned && !isExpiringSoon && (t("active") || "Ativo")}
                {isExpiringSoon && (t("active") || "Ativo")}
                {isExpired && (t("expired") || "Expirado")}
                {isPending && (t("pending") || "Assinatura Pendente")}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                {isExpiringSoon && t("expiringSoon", { days: daysUntilExpiration })}
                {isPending && (t("signPending") || "Você tem uma assinatura de contrato pendente.")}
                {isSigned && !isExpiringSoon && (t("description") || "Detalhes do seu contrato de prestação de serviços.")}
              </p>
            </div>
          </motion.div>

          {isPending ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 gap-6"
            >
              {/* Contract Preview & Direct Signature */}
              <div className="card p-6 flex flex-col gap-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-500" />
                  Visualização do Contrato de Prestação de Serviços
                </h3>

                <div className="h-[400px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-md p-6 bg-zinc-50 dark:bg-zinc-950/40 leading-relaxed [scrollbar-width:thin] text-zinc-700 dark:text-zinc-300">
                  {currentContract.template ? (
                    <div
                      className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:text-zinc-500"
                      dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
                    />
                  ) : (
                    <p className="text-sm text-rose-500">Erro ao carregar o conteúdo do contrato.</p>
                  )}
                </div>

                <div className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  {user?.guardianName && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-md border border-zinc-200 dark:border-zinc-800 text-sm">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        Responsável Legal Associado (Aluno Menor de Idade)
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400">Nome: {user.guardianName}</p>
                      <p className="text-zinc-500 dark:text-zinc-400">Parentesco: {user.guardianRelationship}</p>
                    </div>
                  )}

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Ao clicar no botão abaixo, você declara formalmente que leu, compreendeu e concorda com todos os termos e condições descritos no documento digital acima. Como assinatura digital legal, capturaremos de forma segura metadados de auditoria forense (incluindo seu endereço IP, detalhes do seu navegador e sistema operacional).
                  </p>

                  <Button
                    variant="default"
                    className="h-11 w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all flex items-center justify-center gap-2"
                    onClick={onSign}
                    isLoading={isSigning}
                    disabled={isSigning}
                  >
                    {isSigning ? "Processando Assinatura..." : "Assinar Contrato Digitalmente"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
                  {t("validityTitle") || "Validade"}
                </h3>

                <div className="space-y-4">
                  {currentContract.template && (
                    <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-500 dark:text-zinc-400">Tipo</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {currentContract.template.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 dark:text-zinc-400">{t("statusTitle") || "Status"}</span>
                    <span className={cn(
                      "font-bold uppercase text-xs px-2 py-1 rounded-md",
                      isSigned && "bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
                      isExpired && "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                      isPending && "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                    )}>
                      {t(currentContract.status) || currentContract.status}
                    </span>
                  </div>

                  {currentContract.signedAt && (
                    <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-500 dark:text-zinc-400">Assinado em</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(new Date(currentContract.signedAt), "PP", { locale: currentLocale })}
                      </span>
                    </div>
                  )}

                  {currentContract.expiresAt && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-zinc-500 dark:text-zinc-400">{t("validityTitle") || "Validade"}</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(new Date(currentContract.expiresAt), "PP", { locale: currentLocale })}
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
                  {t("actionsTitle") || "Ações disponíveis"}
                </h3>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleDownload}
                    isLoading={isDownloading}
                    disabled={!currentContract.pdfUrl}
                  >
                    {t("download") || "Baixar Contrato (PDF)"}
                  </Button>

                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Mail className="w-4 h-4" />}
                    onClick={handleResendEmail}
                    isLoading={isSendingEmail}
                    disabled={!currentContract.pdfUrl || isPending}
                  >
                    {t("resendEmail") || "Reenviar por E-mail"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

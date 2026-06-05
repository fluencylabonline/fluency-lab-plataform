"use client";

import { useState } from "react";
import { Download, Loader2, Wallet } from "lucide-react";
import { generateReceiptPDF } from "@/lib/pdfGenerator";
import { useTranslations, useFormatter } from "next-intl";
import { motion } from "framer-motion";
import {
  maskDocument,
  maskEmail,
  maskName
} from "@/utils/format";
import { BackButton } from "@/components/ui/back-button";

export interface Receipt {
  id: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  description: string;
  studentName: string;
  studentEmail: string;
  guardianName: string;
  birthDate: string;
  payerDocument?: string;
  receiverDocument?: string;
  receiverName?: string;
  currency?: string;
}

interface ReceiptViewProps {
  payment: Receipt;
}

export function ReceiptView({ payment }: ReceiptViewProps) {
  const t = useTranslations("Hub.Payments.receipt");
  const formatIntl = useFormatter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateReceiptPDF(payment);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const WAVE_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20' preserveAspectRatio='none'%3E%3Cpath d='M0 0 H40 V10 Q30 20 20 10 Q10 0 0 10 Z' fill='black'/%3E%3C/svg%3E`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full overflow-y-auto bg-background/50"
    >
      {/* ── Green header with FIXED-HEIGHT Mask ── */}
      <div
        className="relative z-10 px-8 md:px-12 pt-4 pb-16 overflow-hidden"
        style={{
          background: "#38b053",
          WebkitMaskImage: `url("${WAVE_SVG}"), linear-gradient(black, black)`,
          WebkitMaskSize: "40px 20px, 100% calc(100% - 19px)",
          WebkitMaskPosition: "bottom center, top center",
          WebkitMaskRepeat: "repeat-x, no-repeat",
          maskImage: `url("${WAVE_SVG}"), linear-gradient(black, black)`,
          maskSize: "40px 20px, 100% calc(100% - 19px)",
          maskPosition: "bottom center, top center",
          maskRepeat: "repeat-x, no-repeat",
        }}
      >
        {/* Large $ watermark */}
        <div className="absolute -right-12 -bottom-16 text-[280px] font-bold text-text/10 select-none pointer-events-none">
          $
        </div>

        {/* decorative circle */}
        <div className="absolute -left-10 -top-10 w-60 h-60 rounded-full bg-white/5" />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BackButton href="/hub/student/payments" />
              {/* icon */}
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20">
                <Wallet className="w-6 h-6 text-text" />
              </div>
            </div>

            <h2 className="text-text text-4xl md:text-5xl font-bold leading-tight tracking-tight whitespace-pre-line">
              {t("header")}
            </h2>
          </div>

          <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 text-text/80 text-sm font-mono">
            {t("paymentId")}: {payment.id}
          </div>
        </div>
      </div>

      {/* ── Body (Starts exactly where the waves cut) ── */}
      <div className="relative -mt-5 px-8 md:px-12 py-8 flex flex-col gap-10">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">

          {/* Column 1: Participants */}
          <div className="space-y-10">
            {/* Payer section */}
            <section>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
                {t("payerData")}
              </p>
              <div className="space-y-2">
                <Row label={t("nameLabel")} value={maskName(payment.guardianName || payment.studentName)} />
                <Row label={t("documentLabel")} value={maskDocument(payment.payerDocument)} />
              </div>
            </section>

            <Divider className="md:hidden" />

            {/* Receiver section */}
            <section>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
                {t("receiverData")}
              </p>
              <div className="space-y-2">
                <Row label={t("nameLabel")} value={payment.receiverName ?? "Fluency Lab School"} />
                <Row label={t("documentLabel")} value={maskDocument(payment.receiverDocument)} />
              </div>
            </section>
          </div>

          {/* Column 2: Payment details & Disclaimer */}
          <div className="space-y-10">
            {/* Payment details */}
            <section>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
                {t("paymentDetails")}
              </p>
              <div className="space-y-2">
                <Row
                  label={t("methodLabel")}
                  value={
                    payment.paymentMethod === "Credit Card"
                      ? (t("creditCard") || "Cartão de Crédito")
                      : payment.paymentMethod === "PIX"
                      ? (t("pix") || "PIX")
                      : payment.paymentMethod
                  }
                />
                <Row label={t("studentLabel")} value={maskName(payment.studentName)} />
                <Row label={t("emailLabel")} value={maskEmail(payment.studentEmail)} />
                <Row label={t("dateLabel")} value={formatIntl.dateTime(new Date(payment.paymentDate), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} />
                <Row label={t("descriptionLabel")} value={payment.description} />
              </div>
            </section>

            <Divider className="md:hidden" />

            {/* Disclaimer */}
            <div className="flex gap-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl p-6">
              <span className="mt-0.5 text-blue-500 flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-sm text-blue-700 leading-relaxed">
                {t.rich("disclaimer", {
                  school: (chunks) => <span className="font-semibold text-blue-600">{chunks}</span>
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{t("totalPaid")}</span>
            <span className="text-4xl font-bold" style={{ color: "#38b053" }}>
              {formatIntl.number(payment.amount / 100, {
                style: "currency",
                currency: payment.currency || "BRL",
              })}
            </span>
          </div>

          <div className="w-full md:w-auto flex flex-col items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full md:px-12 h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-text text-lg transition-all active:scale-95 disabled:opacity-60"
              style={{ background: "#38b053" }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t("generatingPdf")}
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  {t("download")}
                </>
              )}
            </button>
            <p className="text-xs text-gray-300/50">
              {t("autoGenerated")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0 gap-6">
      <span className="text-sm text-gray-400 dark:text-gray-200 flex-shrink-0">{label}</span>
      <span className="text-base font-medium text-gray-800 dark:text-gray-200 text-right">{value}</span>
    </div>
  );
}

function Divider({ className }: { className?: string }) {
  return <hr className={`border-gray-100 ${className}`} />;
}
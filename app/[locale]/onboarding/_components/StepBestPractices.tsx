"use client";

import { useTranslations } from "next-intl";
import { completeOnboardingAction } from "@/modules/onboarding/onboarding.actions";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { Loader2, Clock, Smartphone, ArrowRight, Download, Laptop, CalendarOff, UserRoundX } from "lucide-react";
import { motion } from "framer-motion";
import { useDevice } from "@/hooks/ui/use-device";
import { QRCodeSVG } from "qrcode.react";

export function StepBestPractices() {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);
    const { isMobile, isInstallable, install } = useDevice();
    const [downloadUrl, setDownloadUrl] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (typeof window !== "undefined") {
                setDownloadUrl(`${window.location.origin}/download`);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const onFinish = async () => {
        setLoading(true);
        const result = await completeOnboardingAction();
        if (result?.data?.success) {
            notify.success(t("contract.success"));
            window.location.href = "/hub";
        } else {
            notify.error(result?.data?.error || t("finish.finishError"));
            setLoading(false);
        }
    };

    // O card do app virou o banner de instalação abaixo, e o de "Grupo da
    // Turma" foi removido (recurso que não existe). Sobram 2 cards, então a
    // grade abaixo usa 2 colunas em vez de 3.
    const practices = [
        {
            icon: Clock,
            title: t("finish.punctualityTitle"),
            description: t("finish.punctualityDesc"),
            accent: "border-amber-500/20 bg-amber-600/20 dark:bg-amber-500/[0.07]",
            iconColor: "text-amber-400",
        },
        {
            icon: Laptop,
            title: t("finish.environmentTitle"),
            description: t("finish.environmentDesc"),
            accent: "border-violet-500/20 bg-violet-600/20 dark:bg-violet-500/[0.07]",
            iconColor: "text-violet-400",
        },
    ];

    const notices = [
        {
            icon: CalendarOff,
            title: t("finish.recessTitle"),
            description: t("finish.recessDesc"),
        },
        {
            icon: UserRoundX,
            title: t("finish.teacherLeaveTitle"),
            description: t("finish.teacherLeaveDesc"),
        },
    ];

    return (
        <div className="space-y-6">
            {/* O título e a descrição desta etapa já aparecem no painel à
                esquerda (ver OnboardingFlow) — repeti-los aqui só duplicava
                a mesma frase duas vezes na tela. */}

            {/* Instalar o app — ação mais relevante desta tela, por isso vem primeiro */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4 rounded-md border border-blue-500/20 bg-blue-600/20 p-4 dark:bg-blue-500/[0.07] sm:flex-row sm:items-center"
            >
                <div className="flex flex-1 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
                        <Smartphone className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {t("finish.appTitle")}
                        </p>
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-500">
                            {t("finish.appDesc")}
                        </p>
                    </div>
                </div>

                {!isMobile ? (
                    /* QR Code para Computador */
                    <div className="flex shrink-0 items-center gap-3 rounded-lg border border-slate-200/40 bg-slate-50 p-2 dark:border-slate-850 dark:bg-slate-900/40">
                        {downloadUrl && (
                            <div className="shrink-0 rounded bg-white p-1 shadow-sm">
                                <QRCodeSVG value={downloadUrl} size={56} level="M" marginSize={0} />
                            </div>
                        )}
                        <div className="space-y-0.5 pr-1">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {t("finish.installOnPhone")}
                            </p>
                            <p className="max-w-[140px] text-[9px] leading-snug text-slate-500 dark:text-slate-400">
                                {t("finish.installOnPhoneDesc")}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Botão para Celular */
                    <button
                        onClick={async () => {
                            if (isInstallable) {
                                await install();
                            } else {
                                window.open("/download", "_blank");
                            }
                        }}
                        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98]"
                    >
                        <Download className="h-4 w-4" />
                        {isInstallable ? t("finish.installApp") : t("finish.downloadApp")}
                    </button>
                )}
            </motion.div>

            {/* Boas práticas — grade uniforme, sem célula desbalanceada */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {practices.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 + index * 0.06, duration: 0.3 }}
                        className={`flex gap-3 rounded-md border p-4 ${item.accent}`}
                    >
                        <item.icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.iconColor}`} />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {item.title}
                            </p>
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-500">
                                {item.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Avisos de recesso — agrupados em um único card, mesmas regras do contrato */}
            <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                    {t("finish.noticesTitle")}
                </p>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="divide-y divide-amber-500/10 rounded-md border border-amber-500/20 bg-amber-600/15 dark:bg-amber-500/[0.07]"
                >
                    {notices.map((notice) => (
                        <div key={notice.title} className="flex gap-3 px-4 py-3.5">
                            <notice.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                    {notice.title}
                                </p>
                                <p className="text-xs leading-relaxed text-amber-800/80 dark:text-amber-500/70">
                                    {notice.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* CTA */}
            <button
                onClick={onFinish}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        {t("finish.button")}
                        <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </button>
        </div>
    );
}

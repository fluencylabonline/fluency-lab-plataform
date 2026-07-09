"use client";

import { useTranslations } from "next-intl";
import { completeOnboardingAction } from "@/modules/onboarding/onboarding.actions";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Laptop, Clock, MessageCircle, Smartphone, ArrowRight, Download } from "lucide-react";
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
            notify.success(t("contract.success") || "Matrícula finalizada!");
            window.location.href = "/hub";
        } else {
            notify.error(result?.data?.error || "Erro ao finalizar onboarding");
            setLoading(false);
        }
    };

    const practices = [
        {
            icon: Smartphone,
            title: t("finish.appTitle"),
            description: t("finish.appDesc"),
            accent: "border-blue-500/20 bg-blue-600/20 dark:bg-blue-500/[0.07]",
            iconColor: "text-blue-400",
            isAppCard: true,
        },
        {
            icon: MessageCircle,
            title: t("finish.groupTitle"),
            description: t("finish.groupDesc"),
            accent: "border-emerald-500/20 bg-emerald-600/20 dark:bg-emerald-500/[0.07]",
            iconColor: "text-emerald-400",
            isAppCard: false,
        },
        {
            icon: Clock,
            title: t("finish.punctualityTitle"),
            description: t("finish.punctualityDesc"),
            accent: "border-amber-500/20 bg-amber-600/20 dark:bg-amber-500/[0.07]",
            iconColor: "text-amber-400",
            isAppCard: false,
        },
        {
            icon: Laptop,
            title: t("finish.environmentTitle"),
            description: t("finish.environmentDesc"),
            accent: "border-violet-500/20 bg-violet-600/20 dark:bg-violet-500/[0.07]",
            iconColor: "text-violet-400",
            isAppCard: false,
        },
    ];

    return (
        <div className="space-y-7">

            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
                    <CheckCircle2 className="h-7 w-7 text-violet-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {t("finish.title")}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-500">
                        {t("finish.subtitle")}
                    </p>
                </div>
            </div>

            {/* Practices grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {practices.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.3 }}
                        className={`flex flex-col justify-between rounded-md border p-4 ${item.accent}`}
                    >
                        <div className="flex gap-4">
                            <item.icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.iconColor}`} />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                    {item.title}
                                </p>
                                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-500">
                                    {item.description}
                                </p>
                            </div>
                        </div>

                        {item.isAppCard && (
                            <div className="mt-4 pt-3 border-t border-blue-500/10">
                                {!isMobile ? (
                                    /* QR Code para Computador */
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/40 dark:border-slate-850">
                                        {downloadUrl && (
                                            <div className="p-1 bg-white rounded shrink-0 shadow-sm">
                                                <QRCodeSVG 
                                                    value={downloadUrl} 
                                                    size={64}
                                                    level="M"
                                                    marginSize={0}
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                Instalar no celular
                                            </p>
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug">
                                                Aponte a câmera para baixar o app e receber lembretes.
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
                                        className="flex h-8 w-full items-center justify-center gap-1.5 rounded bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        {isInstallable ? "Instalar App" : "Baixar App"}
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}
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
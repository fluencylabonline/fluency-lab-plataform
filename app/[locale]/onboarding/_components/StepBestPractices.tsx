"use client";

import { useTranslations } from "next-intl";
import { completeOnboardingAction } from "@/modules/onboarding/onboarding.actions";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, CheckCircle2, Laptop, Clock, MessageCircle, Smartphone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function StepBestPractices() {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);

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
        },
        {
            icon: MessageCircle,
            title: t("finish.groupTitle"),
            description: t("finish.groupDesc"),
            accent: "border-emerald-500/20 bg-emerald-600/20 dark:bg-emerald-500/[0.07]",
            iconColor: "text-emerald-400",
        },
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
                        className={`flex gap-4 rounded-xl border p-4 ${item.accent}`}
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

            {/* CTA */}
            <button
                onClick={onFinish}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
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
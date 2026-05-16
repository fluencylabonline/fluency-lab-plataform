"use client";

import { useTranslations } from "next-intl";
import { completeOnboardingAction } from "@/modules/onboarding/onboarding.actions";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, CheckCircle2, Laptop, Clock, MessageCircle, BookOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function TeacherStepBestPractices() {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);

    const onFinish = async () => {
        setLoading(true);
        const result = await completeOnboardingAction();
        if (result?.data?.success) {
            notify.success(t("teacher.onboardingSuccess") || "Onboarding finalizado!");
            window.location.href = "/hub";
        } else {
            notify.error(result?.data?.error || "Erro ao finalizar onboarding");
            setLoading(false);
        }
    };

    const practices = [
        {
            icon: BookOpen,
            title: t("teacher.practices.prepTitle") || "Preparação de Aula",
            description: t("teacher.practices.prepDesc") || "Revise o plano de aula e os materiais antes de cada encontro.",
            accent: "border-blue-500/20 bg-blue-600/20 dark:bg-blue-500/[0.07]",
            iconColor: "text-blue-400",
        },
        {
            icon: MessageCircle,
            title: t("teacher.practices.feedbackTitle") || "Feedback Constante",
            description: t("teacher.practices.feedbackDesc") || "Forneça feedback construtivo após cada aula para o progresso do aluno.",
            accent: "border-emerald-500/20 bg-emerald-600/20 dark:bg-emerald-500/[0.07]",
            iconColor: "text-emerald-400",
        },
        {
            icon: Clock,
            title: t("teacher.practices.punctualityTitle") || "Pontualidade",
            description: t("teacher.practices.punctualityDesc") || "Esteja online 5 minutos antes do início previsto da aula.",
            accent: "border-amber-500/20 bg-amber-600/20 dark:bg-amber-500/[0.07]",
            iconColor: "text-amber-400",
        },
        {
            icon: Laptop,
            title: t("teacher.practices.techTitle") || "Tecnologia",
            description: t("teacher.practices.techDesc") || "Certifique-se de que sua conexão e equipamentos estão funcionando.",
            accent: "border-violet-500/20 bg-violet-600/20 dark:bg-violet-500/[0.07]",
            iconColor: "text-violet-400",
        },
    ];

    return (
        <div className="space-y-7">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
                    <CheckCircle2 className="h-7 w-7 text-violet-400" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {t("teacher.finishTitle") || "Seja bem-vindo(a)!"}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-500">
                        {t("teacher.finishDesc") || "Agora você faz parte da nossa equipe. Aqui estão algumas dicas para começar."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {practices.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.3 }}
                        className={`flex gap-4 rounded-md border p-4 ${item.accent}`}
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

            <button
                onClick={onFinish}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        {t("teacher.finishButton") || "Começar"}
                        <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </button>
        </div>
    );
}

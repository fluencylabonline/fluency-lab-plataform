"use client";

import { useTranslations } from "next-intl";
import { completeOnboardingAction } from "@/modules/user/onboarding.actions";
import { Button } from "@/components/ui/button";
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
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/20"
        },
        {
            icon: MessageCircle,
            title: t("finish.groupTitle"),
            description: t("finish.groupDesc"),
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-950/20"
        },
        {
            icon: Clock,
            title: t("finish.punctualityTitle"),
            description: t("finish.punctualityDesc"),
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-950/20"
        },
        {
            icon: Laptop,
            title: t("finish.environmentTitle"),
            description: t("finish.environmentDesc"),
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-950/20"
        }
    ];

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">{t("finish.title")}</h2>
                <p className="text-muted-foreground text-lg">
                    {t("finish.subtitle")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practices.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 p-4 rounded-2xl border bg-card hover:shadow-md transition-shadow"
                    >
                        <div className={`p-3 rounded-xl h-fit ${item.bg}`}>
                            <item.icon className={`h-6 w-6 ${item.color}`} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-4">
                <Button 
                    onClick={onFinish} 
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            {t("finish.button")}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

"use client";

import { LogOut, MessageCircle, ShieldAlert } from "lucide-react";
import type { DeactivationReason } from "@/modules/user/user.schema";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function SuspendedContent({
    whatsappNumber,
    reason,
}: {
    whatsappNumber: string | null;
    reason: DeactivationReason | null;
}) {
    const t = useTranslations("Suspended");
    // Despedida só para quem cancelou; suspensão (admin/inadimplência) diz como regularizar.
    // Contas antigas sem motivo registrado recebem o texto neutro de suspensão.
    const isFarewell = reason === "cancelled";
    const variant = isFarewell ? "cancelled" : reason === "delinquency" ? "delinquency" : "suspended";
    const Icon = isFarewell ? LogOut : ShieldAlert;
    const router = useRouter();

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/signin");
        router.refresh();
    };

    return (
        <div className="max-w-md w-full text-center space-y-8 relative z-10">
            <div className="relative inline-flex">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-slate-100 dark:bg-slate-900 p-6 rounded-full border border-white/10">
                    <Icon className="w-12 h-12 text-primary" />
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t(`${variant}.title`)}
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t(`${variant}.description`)}
                </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
                {whatsappNumber && (
                    <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants(), "h-12 text-base font-medium rounded-md flex items-center justify-center gap-2")}
                    >
                        <MessageCircle className="w-5 h-5" />
                        {t("talkToUs")}
                    </a>
                )}

                <button
                    onClick={handleLogout}
                    className="text-sm text-slate-500 hover:text-primary transition-colors py-2 font-medium"
                >
                    {t("backToLogin")}
                </button>
            </div>

            <p className="text-xs text-slate-500/50 pt-8 italic">
                {t("slogan")}
            </p>
        </div>
    );
}

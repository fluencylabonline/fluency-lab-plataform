"use client";

import { LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function SuspendedContent() {
    const t = useTranslations("Suspended");
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
                    <LogOut className="w-12 h-12 text-primary" />
                </div>
            </div>

            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t("title") || "Sentiremos sua falta!"}
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t("description") || "Você se despediu, mas saiba que as portas estarão sempre abertas. Sua jornada de aprendizado pode continuar quando você estiver pronto."}
                </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
                <Button
                    className="h-12 text-base font-medium rounded-md"
                >
                    <a
                        href="https://wa.me/5500000000000" // TODO: Colocar link real do suporte
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {t("talkToUs") || "Falar com a gente"}
                    </a>
                </Button>

                <button
                    onClick={handleLogout}
                    className="text-sm text-slate-500 hover:text-primary transition-colors py-2 font-medium"
                >
                    {t("backToLogin") || "Voltar para o login"}
                </button>
            </div>

            <p className="text-xs text-slate-500/50 pt-8 italic">
                FluencyLab — Onde seu futuro fala todas as línguas.
            </p>
        </div>
    );
}

"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import Logo from "@/public/brand/logo.png";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

export function PwaWelcomeScreen() {
    const t = useTranslations("PwaWelcome");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-100 dark:opacity-[0.15] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div>
                    <div className="flex flex-col items-center pt-10 pb-10 px-6 text-center space-y-6">
                        <div className="relative w-42 h-20 mb-2">
                            <Image
                                src={Logo}
                                alt={t("logoAlt")}
                                fill
                                className="object-contain"
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {t("title") || "Bem-vindo a FluencyLab!"}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {t("description") || "Sua jornada para a fluência começa aqui."}
                            </p>
                        </div>

                        <div className="w-full pt-4">
                            <Link href="/signin" className="z-99">
                                <Button className="w-fit font-medium" variant='outline'>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    {t("enterButton") || "Entrar"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 text-center text-xs text-muted-foreground/50">
                &copy; {new Date().getFullYear()} FluencyLab School
            </div>
        </div>
    );
}
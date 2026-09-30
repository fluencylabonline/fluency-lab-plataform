"use client";

/**
 * Botão "Me mostre" — fecha o painel de ajuda e começa o tour da página.
 *
 * Fica visível em todos os passos de todo wizard de ajuda — os 9 de primeiro
 * acesso e o `PageHelpWizard` montado do registry — via `extraFooter` do
 * `components/ui/wizard.tsx`. Se a rota não tem passos de tour, não renderiza
 * nada.
 */

import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { usePageHelp } from "./PageHelpProvider";

interface ShowMeAroundButtonProps {
    className?: string;
    /** `outline` para o rodapé dos wizards, onde já existe um botão primário. */
    variant?: "default" | "outline";
    fullWidth?: boolean;
}

export function ShowMeAroundButton({
    className,
    variant = "default",
    fullWidth,
}: ShowMeAroundButtonProps) {
    const t = useTranslations("PageHelp");
    const pageHelp = usePageHelp();

    if (!pageHelp?.hasTour) return null;

    return (
        <Button
            variant={variant}
            size="sm"
            fullWidth={fullWidth}
            onClick={pageHelp.startTour}
            leftIcon={<Compass className="size-4" />}
            className={cn("shrink-0", className)}
        >
            {t("showMeAround") || "Me mostre"}
        </Button>
    );
}

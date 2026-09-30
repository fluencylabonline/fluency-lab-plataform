"use client";

/**
 * O botão (?) do header.
 *
 * Renderizado dentro de `components/layout/header.tsx` — não em cada página —
 * para que todas as telas que usam `<Header>` ganhem ajuda sem alteração. Em
 * rota sem entrada no registry, ou fora do `/hub`, não renderiza nada.
 */

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { usePageHelp } from "./PageHelpProvider";

interface PageHelpButtonProps {
    /** O header usa tamanhos diferentes no desktop e no mobile. */
    size?: "desktop" | "mobile";
    className?: string;
}

export function PageHelpButton({
    size = "desktop",
    className,
}: PageHelpButtonProps) {
    const t = useTranslations("PageHelp");
    const pageHelp = usePageHelp();

    if (!pageHelp?.hasHelp) return null;

    const label = t("helpLabel") || "Ajuda";

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={pageHelp.openHelp}
            title={label}
            aria-label={label}
            data-tour="chrome.help"
            className={cn(
                "rounded-full text-muted-foreground hover:text-foreground",
                size === "desktop"
                    ? "size-9 hover:bg-muted/50"
                    : "size-10",
                className,
            )}
        >
            <HelpCircle className={size === "desktop" ? "size-4" : "size-5"} />
        </Button>
    );
}

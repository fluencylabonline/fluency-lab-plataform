"use client";

/**
 * Painel de ajuda montado a partir do registry — a versão que todas as
 * páginas sem wizard próprio usam.
 *
 * Substitui o antigo `PageHelpVault` (que listava as seções de uma vez, num
 * Vault rolável) pelo mesmo `Wizard` usado nas 9 páginas com wizard de
 * primeiro acesso: um passo por vez, regularidade visual em toda a
 * plataforma. O primeiro passo apresenta a página (título + resumo); os
 * seguintes, um por seção do registry. "Me mostre" fica fixo no rodapé, em
 * todos os passos — sozinho, como nos outros wizards. "Saber mais" **não**
 * entra no rodapé: um link solto ali quebra a simetria que o rodapé do
 * `Wizard` tem em toda a plataforma. Em vez disso, ele vai dentro do corpo do
 * último passo, junto do texto — é onde um "quer saber mais?" faz sentido de
 * verdade, depois de já ter visto o resumo da página.
 */

import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Wizard, type WizardStep } from "@/components/ui/wizard";

import { helpRouteRole } from "../page-help";
import type { HelpRoute, PageHelp, PageHelpSection } from "../page-help.types";
import { ShowMeAroundButton } from "./ShowMeAroundButton";

interface PageHelpWizardProps {
    help: PageHelp;
    /** Já estreitado pelo provider — a união de `PageHelp` as torna opcionais. */
    sections: PageHelpSection[];
    route: HelpRoute;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function sectionContent(
    section: PageHelpSection,
    learnMore?: { href: string; label: string; onNavigate: () => void },
) {
    return (
        <div className="space-y-4">
            {Array.isArray(section.body) ? (
                <ul className="space-y-2 text-left">
                    {section.body.map((item) => (
                        <li key={item} className="flex gap-2">
                            <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                            <span className="text-sm leading-relaxed text-muted-foreground">
                                {item}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm leading-relaxed text-muted-foreground text-left">
                    {section.body}
                </p>
            )}

            {learnMore && (
                <Link
                    href={learnMore.href}
                    onClick={learnMore.onNavigate}
                    className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                    {learnMore.label}
                    <ArrowRight className="size-3.5 shrink-0" />
                </Link>
            )}
        </div>
    );
}

export function PageHelpWizard({
    help,
    sections,
    route,
    open,
    onOpenChange,
}: PageHelpWizardProps) {
    const t = useTranslations("PageHelp");

    const role = helpRouteRole(route);
    const docsHref =
        help.docsArticleId && role
            ? "/hub/" + role + "/docs#" + help.docsArticleId
            : null;

    /**
     * Passo 0 apresenta a página (título + resumo), igual ao passo `intro`
     * sem `target` que a maioria dos tours já usa. Os seguintes vêm 1:1 das
     * seções do registry — nenhum conteúdo é reescrito, só reformatado.
     */
    const steps = React.useMemo<WizardStep[]>(() => {
        const intro: WizardStep = {
            id: "intro",
            title: help.title,
            description: help.summary,
            icon: Info,
            headerBg: "bg-primary/10",
            iconColor: "text-primary",
            content: (
                <p className="text-center text-sm leading-relaxed text-muted-foreground">
                    {t("wizardIntro") || "Toque em Próximo para conhecer esta página."}
                </p>
            ),
        };

        const lastIndex = sections.length - 1;
        const sectionSteps: WizardStep[] = sections.map((section, index) => ({
            id: "section-" + index,
            title: section.heading,
            icon: Info,
            headerBg: "bg-primary/10",
            iconColor: "text-primary",
            content: sectionContent(
                section,
                // Só o último passo — depois de já ter visto o resumo da
                // página, é onde "quer saber mais?" faz sentido.
                index === lastIndex && docsHref
                    ? {
                        href: docsHref,
                        label: t("learnMore") || "Ver o guia completo",
                        onNavigate: () => onOpenChange(false),
                    }
                    : undefined,
            ),
        }));

        return [intro, ...sectionSteps];
    }, [help.title, help.summary, sections, docsHref, t, onOpenChange]);

    return (
        <Wizard
            open={open}
            onOpenChange={onOpenChange}
            steps={steps}
            onComplete={() => onOpenChange(false)}
            extraFooter={<ShowMeAroundButton variant="outline" />}
        />
    );
}

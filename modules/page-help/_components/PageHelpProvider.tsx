"use client";

/**
 * Cola entre o registry, o botão (?) do header e o tour.
 *
 * Montado uma única vez em `app/[locale]/hub/layout.tsx`, envolvendo o
 * conteúdo. Guarda o estado do painel e do tour e resolve, a cada navegação,
 * qual entrada do registry vale para a rota atual.
 *
 * Duas formas de painel convivem de propósito, mas as duas renderizam o
 * mesmo `Wizard` — regularidade visual em toda a plataforma:
 *
 * - Páginas que já tinham um wizard de primeiro acesso continuam com o dele.
 *   Elas chamam `useRegisterPageHelp(setIsOpen)` e o (?) do header passa a
 *   abrir aquele wizard, em vez de um segundo painel competindo.
 * - As outras usam o `PageHelpWizard`, montado a partir das `sections` do
 *   registry (um passo por seção, mais um passo de abertura com título e
 *   resumo). Nenhum conteúdo é reescrito — só reformatado.
 *
 * Nos dois casos o botão "Me mostre" chama o mesmo `startTour`.
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import { TourOverlay } from "@/components/ui/tour-overlay";
import { useIsMobile } from "@/hooks/ui/use-device";

import { resolvePageHelp } from "../page-help";
import type { HelpRoute, PageHelp } from "../page-help.types";
import { PageHelpWizard } from "./PageHelpWizard";

interface PageHelpContextValue {
    /** `true` quando a rota atual tem ajuda — o (?) só aparece nesse caso. */
    hasHelp: boolean;
    /** Abre o painel: o wizard registrado pela página, ou o Vault do registry. */
    openHelp: () => void;
    /** Fecha o painel e começa o tour. Usado pelo botão "Me mostre". */
    startTour: () => void;
    /** `true` quando a rota tem passos de tour visíveis neste layout. */
    hasTour: boolean;
    /**
     * Uma página com wizard próprio registra aqui o setter de abrir/fechar
     * dela, para o (?) e o "Me mostre" conseguirem os dois. `null` devolve o
     * controle ao painel automático.
     */
    registerPanel: (setOpen: ((open: boolean) => void) | null) => void;
}

const PageHelpContext = React.createContext<PageHelpContextValue | null>(null);

/**
 * Acesso ao contexto. Devolve `null` fora do `/hub` — o `Header` também é usado
 * em telas soltas (notebook, onboarding), e lá o (?) simplesmente não aparece.
 */
export function usePageHelp() {
    return React.useContext(PageHelpContext);
}

/**
 * Faz o (?) do header abrir o painel desta página, e o "Me mostre" do painel
 * conseguir fechá-lo antes do tour começar.
 *
 * Usado pelas páginas que já tinham wizard de primeiro acesso, passando o
 * setter direto: `useRegisterPageHelp(setIsHelpOpen)` — não
 * `() => setIsHelpOpen(true)`. É o mesmo setter que precisa aceitar `false`
 * para fechar; sem isso, `startTour()` não tem como esconder o wizard antes
 * de escurecer a tela.
 */
export function useRegisterPageHelp(
    setOpen: ((open: boolean) => void) | null | undefined,
) {
    const ctx = usePageHelp();
    const register = ctx?.registerPanel;

    // `setOpen` normalmente é uma função nova a cada render; a ref evita
    // registrar de novo a cada um deles. A escrita vai num efeito próprio
    // porque escrever em ref durante o render é proibido pelas regras de hooks.
    const setOpenRef = React.useRef(setOpen);

    React.useEffect(() => {
        setOpenRef.current = setOpen;
    }, [setOpen]);

    React.useEffect(() => {
        if (!register) return;
        register((open) => setOpenRef.current?.(open));
        return () => register(null);
    }, [register]);
}

export function PageHelpProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const locale = useLocale();
    const isMobile = useIsMobile();

    const [panelOpen, setPanelOpen] = React.useState(false);
    const [tourOpen, setTourOpen] = React.useState(false);
    const [customPanel, setCustomPanel] = React.useState<((open: boolean) => void) | null>(null);

    const resolved = React.useMemo(
        () => resolvePageHelp(pathname, locale),
        [pathname, locale],
    );

    // Uma navegação não deve carregar o painel nem o tour da página anterior.
    React.useEffect(() => {
        setPanelOpen(false);
        setTourOpen(false);
    }, [pathname]);

    const help: PageHelp | null = resolved?.help ?? null;
    const route: HelpRoute | null = resolved?.route ?? null;

    /** Passos que existem neste layout — `only` descarta os do outro. */
    const steps = React.useMemo(() => {
        if (!help) return [];
        return help.tour.filter((step) => {
            if (step.only === "mobile") return isMobile;
            if (step.only === "desktop") return !isMobile;
            return true;
        });
    }, [help, isMobile]);

    const registerPanel = React.useCallback((setOpen: ((open: boolean) => void) | null) => {
        // Guardado dentro de um closure: `setState` com função trataria o
        // próprio setter como updater.
        setCustomPanel(() => setOpen);
    }, []);

    const openHelp = React.useCallback(() => {
        if (customPanel) {
            customPanel(true);
            return;
        }
        setPanelOpen(true);
    }, [customPanel]);

    const startTour = React.useCallback(() => {
        // Fecha o painel que estiver aberto — o wizard registrado pela
        // página, ou o Vault automático — antes de escurecer a tela.
        if (customPanel) customPanel(false);
        else setPanelOpen(false);
        // Espera a animação de saída do Vault antes de escurecer a tela, senão
        // o holofote aparece por cima do painel ainda fechando.
        window.setTimeout(() => setTourOpen(true), 320);
    }, [customPanel]);

    const value = React.useMemo<PageHelpContextValue>(
        () => ({
            hasHelp: Boolean(help),
            hasTour: steps.length > 0,
            openHelp,
            startTour,
            registerPanel,
        }),
        [help, steps.length, openHelp, startTour, registerPanel],
    );

    return (
        <PageHelpContext.Provider value={value}>
            {children}

            {/*
              Só as rotas com painel vindo do registry montam o wizard
              automático. As de `panel: "wizard"` abrem o wizard da própria
              página, registrado via `useRegisterPageHelp`.
            */}
            {help && route && help.panel !== "wizard" && (
                <PageHelpWizard
                    help={help}
                    sections={help.sections}
                    route={route}
                    open={panelOpen}
                    onOpenChange={setPanelOpen}
                />
            )}

            <TourOverlay
                steps={steps}
                open={tourOpen}
                onClose={() => setTourOpen(false)}
            />
        </PageHelpContext.Provider>
    );
}

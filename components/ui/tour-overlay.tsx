"use client";

/**
 * Engine do tour guiado.
 *
 * Superfície única e proposital: `<TourOverlay steps open onClose />`. Nada
 * fora deste arquivo sabe como o holofote é desenhado, então a engine pode ser
 * trocada sem tocar em nenhuma página.
 *
 * Por que escrita à mão em vez de react-joyride/driver.js: o tour aqui é linear
 * e de uma página só, e o card precisa usar os componentes e os tokens do
 * design system (claro/escuro, sem shadow) em vez de brigar com o CSS de uma
 * biblioteca.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/ui/use-device";

/**
 * Forma mínima de um passo. Definida aqui, e não importada de
 * `modules/page-help`, para a engine não depender do registry — qualquer objeto
 * com estes campos serve.
 */
export interface TourOverlayStep {
    id: string;
    /** Valor de `data-tour`. Ausente = card centralizado, sem holofote. */
    target?: string;
    title: string;
    text: string;
}

export interface TourOverlayProps {
    steps: TourOverlayStep[];
    open: boolean;
    onClose: () => void;
}

/** Folga entre o elemento destacado e a borda do holofote. */
const SPOTLIGHT_PADDING = 8;
/** Distância entre o holofote e o card. */
const CARD_GAP = 16;
/** Margem mínima do card até a borda da janela. */
const VIEWPORT_MARGIN = 16;
const CARD_WIDTH = 344;
/** Tempo sem encontrar o alvo antes de desistir do passo. */
const TARGET_TIMEOUT = 400;

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

/**
 * O primeiro elemento **visível** com este `data-tour`.
 *
 * Procurar por todos, e não só pelo primeiro, é essencial neste projeto: vários
 * componentes renderizam a versão mobile e a desktop lado a lado, escondendo
 * uma por CSS. Pegar só o primeiro acharia justamente a escondida (área zero) e
 * o passo seria descartado como se o alvo não existisse.
 */
function findTarget(target: string | undefined): HTMLElement | null {
    if (!target || typeof document === "undefined") return null;

    const candidates = document.querySelectorAll<HTMLElement>(
        "[data-tour=\"" + CSS.escape(target) + "\"]",
    );

    for (const candidate of candidates) {
        const box = candidate.getBoundingClientRect();
        if (box.width > 0 || box.height > 0) return candidate;
    }

    return null;
}

function readRect(target: string | undefined): Rect | null {
    const el = findTarget(target);
    if (!el) return null;

    const box = el.getBoundingClientRect();

    return {
        top: box.top - SPOTLIGHT_PADDING,
        left: box.left - SPOTLIGHT_PADDING,
        width: box.width + SPOTLIGHT_PADDING * 2,
        height: box.height + SPOTLIGHT_PADDING * 2,
    };
}

export function TourOverlay({ steps, open, onClose }: TourOverlayProps) {
    const t = useTranslations("PageHelp");
    const isMobile = useIsMobile();

    const [index, setIndex] = React.useState(0);
    const [rect, setRect] = React.useState<Rect | null>(null);
    const [cardHeight, setCardHeight] = React.useState(0);
    const [mounted, setMounted] = React.useState(false);

    const cardRef = React.useRef<HTMLDivElement>(null);
    /** Direção do último movimento — decide para onde pular um alvo ausente. */
    const directionRef = React.useRef(1);

    React.useEffect(() => setMounted(true), []);

    const step = steps[index];
    const total = steps.length;
    const isLast = index === total - 1;
    const isFirst = index === 0;

    // Volta ao início ao fechar, para o próximo tour não começar no meio.
    React.useEffect(() => {
        if (!open) {
            setIndex(0);
            setRect(null);
            directionRef.current = 1;
        }
    }, [open]);

    /**
     * Puro: só avança o índice, nunca fecha o tour. Chamar `onClose` (que faz
     * `setTourOpen(false)` no `PageHelpProvider`) de dentro do updater do
     * `setIndex` quebra as regras do React — o updater pode rodar durante o
     * render, e nesse momento setState de outro componente não é permitido.
     * Fechar por "chegou no fim" é decisão de quem chama, não daqui.
     */
    const goNext = React.useCallback(() => {
        directionRef.current = 1;
        setIndex((current) => Math.min(current + 1, steps.length - 1));
    }, [steps.length]);

    const goPrev = React.useCallback(() => {
        directionRef.current = -1;
        setIndex((current) => Math.max(0, current - 1));
    }, []);

    /** Botão "Próximo/Concluir" e a tecla Enter/→: no último passo, fecha. */
    const handleNext = React.useCallback(() => {
        if (isLast) onClose();
        else goNext();
    }, [isLast, onClose, goNext]);

    /**
     * Acompanha o alvo: rola até ele, mede, e segue medindo por um tempo para
     * não perder o scroll suave. Depois disso, só reage a scroll e resize.
     */
    React.useEffect(() => {
        if (!open || !step) return;

        if (!step.target) {
            setRect(null);
            return;
        }

        const target = step.target;
        let frame = 0;
        let missingSince: number | null = null;
        let scrolled = false;
        const startedAt = performance.now();

        const tick = () => {
            const next = readRect(target);

            if (next) {
                missingSince = null;
                setRect(next);

                if (!scrolled) {
                    scrolled = true;
                    findTarget(target)?.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                    });
                }
            } else {
                // O alvo pode só estar carregando — espera antes de desistir.
                if (missingSince === null) missingSince = performance.now();

                if (performance.now() - missingSince > TARGET_TIMEOUT) {
                    if (process.env.NODE_ENV === "development") {
                        console.warn(
                            "[tour] O passo \"" + step.id + "\" aponta para data-tour=\"" +
                            target + "\", que não existe nesta página. Passo ignorado.",
                        );
                    }
                    // Chamado direto daqui (efeito), não de dentro de um updater
                    // de estado, então fechar é seguro quando o alvo ausente é
                    // do último passo.
                    if (directionRef.current < 0 && !isFirst) goPrev();
                    else if (isLast) onClose();
                    else goNext();
                    return;
                }
            }

            // Segue o scroll suave por ~1s; se o alvo ainda falta, continua.
            if (performance.now() - startedAt < 1000 || !next) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);

        const remeasure = () => setRect(readRect(target));
        window.addEventListener("scroll", remeasure, true);
        window.addEventListener("resize", remeasure);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", remeasure, true);
            window.removeEventListener("resize", remeasure);
        };
    }, [open, step, goNext, goPrev, isFirst, isLast, onClose]);

    // Altura real do card, para saber se ele cabe abaixo do holofote.
    React.useEffect(() => {
        const el = cardRef.current;
        if (!el || !open) return;

        const observer = new ResizeObserver((entries) => {
            setCardHeight(entries[0].contentRect.height);
        });
        observer.observe(el);
        setCardHeight(el.getBoundingClientRect().height);

        return () => observer.disconnect();
    }, [open, index]);

    // Teclado: Esc sai, setas navegam.
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key === "ArrowRight" || event.key === "Enter") {
                event.preventDefault();
                handleNext();
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                goPrev();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose, handleNext, goPrev]);

    React.useEffect(() => {
        if (open) cardRef.current?.focus();
    }, [open, index]);

    if (!mounted || !open || !step) return null;

    /**
     * Posição do card: perto do alvo, tanto no mobile quanto no desktop. Sem
     * alvo (`rect` nulo), cai para o padrão — centralizado no desktop, colado
     * embaixo no mobile — via `centred`/`bottom-4` na className.
     */
    const cardStyle: React.CSSProperties = (() => {
        if (!rect) return {};

        const vh = window.innerHeight;
        const height = cardHeight || 180;

        const fitsBelow =
            rect.top + rect.height + CARD_GAP + height + VIEWPORT_MARGIN < vh;
        const fitsAbove = rect.top - CARD_GAP - height - VIEWPORT_MARGIN > 0;

        if (isMobile) {
            // Largura já é fixada por `inset-x-4` na className — só a posição
            // vertical muda, para o card nunca cobrir o alvo destacado.
            if (fitsBelow) return { top: rect.top + rect.height + CARD_GAP };
            if (fitsAbove) return { top: rect.top - CARD_GAP - height };
            return { bottom: VIEWPORT_MARGIN };
        }

        const vw = window.innerWidth;
        const top = fitsBelow
            ? rect.top + rect.height + CARD_GAP
            : fitsAbove
                ? rect.top - CARD_GAP - height
                : Math.max(VIEWPORT_MARGIN, (vh - height) / 2);

        const left = Math.min(
            Math.max(rect.left + rect.width / 2 - CARD_WIDTH / 2, VIEWPORT_MARGIN),
            vw - CARD_WIDTH - VIEWPORT_MARGIN,
        );

        return { top, left, width: CARD_WIDTH };
    })();

    const centred = !isMobile && !rect;

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="tour"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/*
                  Bloqueia a interação com a página. Fica abaixo do holofote e do
                  card, e é o único elemento que captura cliques — assim nenhum
                  z-index da página precisa ser mexido.
                */}
                <div
                    className="fixed inset-0 z-[69]"
                    onClick={(event) => event.preventDefault()}
                    aria-hidden
                />

                {/*
                  O holofote. O escurecimento é o box-shadow gigante deste
                  elemento, então o recorte é exatamente o alvo — sem quatro
                  painéis para alinhar e sem depender de mix-blend-mode.
                */}
                <AnimatePresence mode="wait">
                    {rect ? (
                        <motion.div
                            key="spotlight"
                            className="pointer-events-none fixed z-[70] rounded-xl ring-2 ring-primary/70"
                            initial={false}
                            animate={{
                                top: rect.top,
                                left: rect.left,
                                width: rect.width,
                                height: rect.height,
                            }}
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                            style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)" }}
                        />
                    ) : (
                        <motion.div
                            key="dim"
                            className="pointer-events-none fixed inset-0 z-[70] bg-black/60"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    ref={cardRef}
                    key={"card-" + step.id}
                    role="dialog"
                    aria-modal="true"
                    aria-label={step.title}
                    tabIndex={-1}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "fixed z-[71] rounded-2xl border border-border bg-background p-5 outline-none",
                        isMobile && !rect && "inset-x-4 bottom-4",
                        isMobile && rect && "inset-x-4",
                        centred &&
                        "left-1/2 top-1/2 w-[min(344px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
                    )}
                    style={cardStyle}
                >
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <span className="mt-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                            {t("stepCounter", { current: index + 1, total })}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-2 -mt-2 size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={onClose}
                            aria-label={t("skip") || "Sair"}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    <h2 className="text-base font-semibold leading-snug text-foreground">
                        {step.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {step.text}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={onClose}
                        >
                            {t("skip") || "Sair"}
                        </Button>

                        <div className="flex items-center gap-2">
                            {!isFirst && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goPrev}
                                    leftIcon={<ChevronLeft className="size-3.5" />}
                                >
                                    {t("previous") || "Anterior"}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={handleNext}
                                rightIcon={
                                    !isLast ? <ChevronRight className="size-3.5" /> : undefined
                                }
                            >
                                {isLast ? t("done") || "Concluir" : t("next") || "Próximo"}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body,
    );
}

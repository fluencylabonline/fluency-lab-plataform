"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_LINE, SPRING } from "@/lib/animations";
import { Shimmer } from "@shimmer-from-structure/react";

export interface Step {
    id: number;
    title: string;
    subtitle?: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
    orientation?: "horizontal" | "vertical";
    variant?: "default" | "sidebar";
    className?: string;
    loading?: boolean;
}

const FALLBACK_STEPS: Step[] = [
    { id: 1, title: "Carregando...", subtitle: "Aguarde um momento" },
    { id: 2, title: "Carregando...", subtitle: "Aguarde um momento" },
    { id: 3, title: "Carregando...", subtitle: "Aguarde um momento" },
];

// ─── Dots de progresso (scroll indicator) ────────────────────────────────────

function ScrollDots({
    steps,
    activeIndex,
}: {
    steps: Step[];
    activeIndex: number;
}) {
    return (
        <div className="flex justify-center gap-1.5 mt-2.5 sm:hidden">
            {steps.map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        width: i === activeIndex ? 16 : 5,
                        background:
                            i === activeIndex
                                ? "var(--color-fg, currentColor)"
                                : undefined,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={cn(
                        "h-[5px] rounded-full transition-colors duration-300",
                        i === activeIndex
                            ? "bg-foreground"
                            : "bg-border"
                    )}
                    style={{ width: i === activeIndex ? 16 : 5 }}
                />
            ))}
        </div>
    );
}

// ─── Linha de progresso ───────────────────────────────────────────────────────

function ProgressLine({
    isCompleted,
    direction,
}: {
    isCompleted: boolean;
    direction: "h" | "v";
}) {
    const isH = direction === "h";
    return (
        <div
            className={cn(
                "absolute overflow-hidden bg-border",
                isH
                    ? "top-[17px] left-[calc(50%+20px)] right-[calc(-50%+20px)] h-[1.5px]"
                    : "left-[17px] top-[44px] bottom-0 w-[1.5px]"
            )}
        >
            <motion.div
                className="bg-foreground origin-left h-full w-full"
                initial={isH ? { scaleX: 0 } : { scaleY: 0 }}
                animate={
                    isCompleted
                        ? isH
                            ? { scaleX: 1 }
                            : { scaleY: 1 }
                        : isH
                            ? { scaleX: 0 }
                            : { scaleY: 0 }
                }
                style={{ originX: 0, originY: 0 }}
                transition={EASE_LINE}
            />
        </div>
    );
}

// ─── Círculo ──────────────────────────────────────────────────────────────────

function StepCircle({
    step,
    isActive,
    isCompleted,
}: {
    step: Step;
    isActive: boolean;
    isCompleted: boolean;
}) {
    return (
        <motion.div
            animate={isActive ? { scale: 1.12 } : { scale: 1 }}
            transition={SPRING}
            className={cn(
                "relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-[1.5px]",
                "flex items-center justify-center font-medium text-sm",
                "transition-colors duration-300",
                isActive &&
                "bg-foreground border-foreground text-background ring-4 ring-foreground/10",
                isCompleted &&
                !isActive &&
                "bg-muted border-border text-muted-foreground",
                !isActive &&
                !isCompleted &&
                "bg-transparent border-border text-muted-foreground/60"
            )}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isCompleted ? (
                    <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={SPRING}
                    >
                        <Check size={16} strokeWidth={2.8} />
                    </motion.span>
                ) : (
                    <motion.span
                        key="num"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        {step.id}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Stepper(props: StepperProps) {
    const {
        steps,
        currentStep,
        orientation = "horizontal",
        variant = "default",
        className,
        loading = false,
    } = props;
    const isVertical = orientation === "vertical";
    const isSidebar = variant === "sidebar";

    const scrollRef = useRef<HTMLDivElement>(null);
    const [visibleIndex, setVisibleIndex] = useState(currentStep - 1);

    // Scroll automático para o passo ativo no mobile
    useEffect(() => {
        if (isVertical) return;
        const el = scrollRef.current;
        if (!el) return;

        const activeEl = el.children[currentStep - 1] as HTMLElement | undefined;
        if (!activeEl) return;

        const offset =
            activeEl.offsetLeft -
            el.clientWidth / 2 +
            activeEl.offsetWidth / 2;

        el.scrollTo({ left: offset, behavior: "smooth" });
    }, [currentStep, isVertical]);

    // Atualiza fades e dot ativo ao rolar
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        // Dot mais próximo do centro
        const center = el.getBoundingClientRect().left + el.clientWidth / 2;
        let closest = 0;
        let minDist = Infinity;
        Array.from(el.children).forEach((child, i) => {
            const r = child.getBoundingClientRect();
            const dist = Math.abs(r.left + r.width / 2 - center);
            if (dist < minDist) {
                minDist = dist;
                closest = i;
            }
        });
        setVisibleIndex(closest);
    }, []);

    // No estado de loading, usamos os fallback steps e resetamos o progresso
    const displaySteps = loading ? FALLBACK_STEPS : steps;
    const displayCurrentStep = loading ? 0 : currentStep;

    // Inicializa fades após render
    useEffect(() => {
        if (isVertical) return;
        const el = scrollRef.current;
        if (!el) return;
        
        const frame = requestAnimationFrame(() => {
            handleScroll();
        });
        return () => cancelAnimationFrame(frame);
    }, [displaySteps, isVertical, handleScroll]);

    // ── Horizontal ──────────────────────────────────────────────────────────────
    const horizontalContent = (
        <div className={cn("w-full ", className)}>
            <div
                ref={scrollRef}
                role="list"
                aria-label="Progress steps"
                onScroll={handleScroll}
                className={cn(
                    "flex flex-row overflow-x-auto justify-center",
                    // Snap apenas no mobile
                    "sm:overflow-x-visible",
                    "scroll-smooth snap-x snap-mandatory sm:snap-none",
                    "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                )}
            >
                {displaySteps.map((step, index) => {
                    const isActive = displayCurrentStep === step.id;
                    const isCompleted = displayCurrentStep > step.id;
                    const isLast = index === displaySteps.length - 1;

                    return (
                        <motion.div
                            key={step.id}
                            role="listitem"
                            aria-current={isActive ? "step" : undefined}
                            aria-label={`Step ${step.id}: ${step.title}${isCompleted ? " (concluído)" : isActive ? " (atual)" : ""}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.06 }}
                            className={cn(
                                "relative flex flex-col items-center",
                                // Mobile: largura fixa com snap
                                "flex-shrink-0 w-[100px] snap-center",
                                // Desktop: cresce para preencher
                                "sm:flex-1 sm:w-auto sm:flex-shrink",
                                "py-1"
                            )}
                        >
                            {!isLast && (
                                <ProgressLine isCompleted={isCompleted} direction="h" />
                            )}

                            <StepCircle
                                step={step}
                                isActive={isActive}
                                isCompleted={isCompleted}
                            />

                            <div className="flex flex-col items-center text-center mt-2.5 px-1">
                                <span
                                    className={cn(
                                        "text-[13px] font-medium leading-snug transition-colors duration-300",
                                        isActive
                                            ? "text-foreground"
                                            : isCompleted
                                                ? "text-foreground/55"
                                                : "text-foreground/35"
                                    )}
                                >
                                    {step.title}
                                </span>
                                {step.subtitle && (
                                    <motion.span
                                        animate={{ opacity: isActive ? 1 : 0.5 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-[11px] text-muted-foreground mt-0.5 leading-snug max-w-[88px]"
                                    >
                                        {step.subtitle}
                                    </motion.span>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Dots — só no mobile */}
            <ScrollDots steps={displaySteps} activeIndex={visibleIndex} />
        </div>
    );

    // ── Vertical ─────────────────────────────────────────────────────────────────
    const verticalContent = (
        <div
            role="list"
            aria-label="Progress steps"
            className={cn("flex flex-col w-full", className)}
        >
            {displaySteps.map((step, index) => {
                const isActive = displayCurrentStep === step.id;
                const isCompleted = displayCurrentStep > step.id;
                const isLast = index === displaySteps.length - 1;

                return (
                    <motion.div
                        key={step.id}
                        role="listitem"
                        aria-current={isActive ? "step" : undefined}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.06 }}
                        className={cn(
                            "relative flex flex-row items-start gap-4",
                            !isLast && "pb-7"
                        )}
                    >
                        {!isLast && (
                            <ProgressLine isCompleted={isCompleted} direction="v" />
                        )}

                        <StepCircle
                            step={step}
                            isActive={isActive}
                            isCompleted={isCompleted}
                        />

                        <div className="flex flex-col pt-1.5">
                            {isSidebar && (
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold uppercase tracking-widest mb-0.5 transition-colors",
                                        isActive ? "text-foreground/50" : "text-foreground/25"
                                    )}
                                >
                                    Step {step.id}
                                </span>
                            )}
                            <span
                                className={cn(
                                    "font-medium leading-snug transition-colors duration-300",
                                    isSidebar ? "text-[13px]" : "text-[14px]",
                                    isActive
                                        ? "text-foreground"
                                        : isCompleted
                                            ? "text-foreground/55"
                                            : "text-foreground/35"
                                )}
                            >
                                {step.title}
                            </span>
                            {!isSidebar && step.subtitle && (
                                <motion.span
                                    animate={{ opacity: isActive ? 1 : 0.5 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed max-w-xs"
                                >
                                    {step.subtitle}
                                </motion.span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );

    return (
        <Shimmer loading={loading}>
            {isVertical ? verticalContent : horizontalContent}
        </Shimmer>
    );
}
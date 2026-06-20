"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type OverlayState = "idle" | "loading" | "success" | "error";

interface VaultLoadingReportOverlayProps {
  state: OverlayState;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  errorSub?: string;
  onDone?: () => void;
  layoutId?: string;
}

const PARTICLE_ANGLES = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
const STATIC_RANDOM_OFFSETS = [
  -0.34, 0.12, -0.48, 0.29, -0.15, 0.41, -0.05, 0.22,
  -0.42, 0.07, -0.27, 0.38,
];

// Body lines of the "report" — varied widths read like real written text
const REPORT_LINES = ["94%", "78%", "97%", "58%"];

const linesContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.16, delayChildren: 0.15 },
  },
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export function VaultLoadingReportOverlay({
  state,
  loadingLabel = "Atualizando status...",
  successLabel = "Status atualizado com sucesso!",
  errorLabel = "Erro ao atualizar",
  errorSub = "Ocorreu um erro no servidor. Tente novamente.",
  onDone,
  layoutId,
}: VaultLoadingReportOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const isVisible = state !== "idle";

  // Auto-dismiss logic
  useEffect(() => {
    if (state === "success") {
      const timer = setTimeout(() => {
        onDone?.();
      }, 1600);
      return () => clearTimeout(timer);
    }
    if (state === "error") {
      const timer = setTimeout(() => {
        onDone?.();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [state, onDone]);

  // GSAP animations for glow pulse and error shake
  useEffect(() => {
    if (!isVisible) return;

    // Loading glow pulse
    if (state === "loading" && glowRef.current) {
      gsap.to(glowRef.current, {
        scale: 1.2,
        opacity: 0.6,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Error shake animation using GSAP
    if (state === "error" && containerRef.current) {
      const tl = gsap.timeline();
      tl.to(containerRef.current, { x: -10, duration: 0.05, ease: "power1.inOut" })
        .to(containerRef.current, { x: 8, duration: 0.05, ease: "power1.inOut" })
        .to(containerRef.current, { x: -6, duration: 0.05, ease: "power1.inOut" })
        .to(containerRef.current, { x: 4, duration: 0.05, ease: "power1.inOut" })
        .to(containerRef.current, { x: 0, duration: 0.05, ease: "power1.inOut" });

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.3,
          opacity: 0.8,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
        });
      }
    }
  }, [state, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          layoutId={layoutId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            layout: { type: "spring", stiffness: 280, damping: 26, mass: 0.85 },
            opacity: { duration: 0.2, ease: "easeInOut" }
          }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 rounded-xl bg-background/90 backdrop-blur-md select-none"
          aria-live="polite"
          aria-label={
            state === "loading" ? loadingLabel
            : state === "success" ? successLabel
            : state === "error" ? errorLabel
            : undefined
          }
        >
          {/* Animated Glow Backdrop */}
          <div className="relative flex items-center justify-center w-32 h-32">
            <div
              ref={glowRef}
              className={cn(
                "absolute w-24 h-24 rounded-full blur-2xl opacity-40 transition-colors duration-500",
                state === "loading" && "bg-primary/50",
                state === "success" && "bg-emerald-500/50",
                state === "error" && "bg-destructive/50"
              )}
            />

            {/* Success "confetti" — little paper scraps */}
            {state === "success" && (
              <div className="absolute inset-0 pointer-events-none">
                {PARTICLE_ANGLES.map((angle, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-[1px] bg-emerald-500"
                    initial={{ scale: 0, x: -3, y: -3, opacity: 1, rotate: 0 }}
                    animate={{
                      scale: [0, 1.2, 0.6, 0],
                      x: Math.cos((angle * Math.PI) / 180) * 56 - 3,
                      y: Math.sin((angle * Math.PI) / 180) * 56 - 3,
                      opacity: [1, 1, 0.4, 0],
                      rotate: idx % 2 === 0 ? 90 : -90,
                    }}
                    transition={{
                      duration: 0.9,
                      ease: "easeOut",
                      delay: idx * 0.015,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Error: pages crumbling away */}
            {state === "error" && (
              <div className="absolute inset-0 pointer-events-none">
                {PARTICLE_ANGLES.slice(0, 8).map((angle, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1 rounded-[1px] bg-destructive"
                    initial={{ scale: 0, x: -3, y: -3, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0.8, 0],
                      x: Math.cos((angle * Math.PI) / 180) * 35 - 3 + (STATIC_RANDOM_OFFSETS[idx] || 0) * 15,
                      y: Math.sin((angle * Math.PI) / 180) * 35 - 3 + 24, // gravity effect
                      opacity: [1, 1, 0.3, 0],
                    }}
                    transition={{
                      duration: 0.7,
                      ease: "easeOut",
                      delay: idx * 0.02,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Main Report Sheet */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -3 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.08 }}
              className="relative z-10"
            >
              <div
                className={cn(
                  "relative w-[70px] h-[88px] rounded-sm bg-card border-2 shadow-sm overflow-hidden transition-colors duration-300",
                  state === "loading" && "border-primary/30",
                  state === "success" && "border-emerald-500",
                  state === "error" && "border-destructive"
                )}
              >
                {/* Dog-ear fold, top-right corner */}
                <div
                  className="absolute top-0 right-0 w-3 h-3 bg-background"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
                />
                <div
                  className={cn(
                    "absolute top-0 right-0 w-3 h-3 border-l border-b transition-colors duration-300",
                    state === "loading" && "border-primary/30",
                    state === "success" && "border-emerald-500",
                    state === "error" && "border-destructive"
                  )}
                  style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                />

                {/* Scanning highlight while saving */}
                {state === "loading" && (
                  <motion.div
                    className="absolute left-1 right-1 h-2 rounded-full bg-primary/30 blur-[2px]"
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: [8, 78], opacity: [0, 0.9, 0.9, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                  />
                )}

                {/* Title line + body lines */}
                <div className="relative flex h-full flex-col justify-center gap-[7px] px-2.5">
                  {/* Title / heading line */}
                  <div className="h-[5px] w-1/2 rounded-full bg-foreground/20 overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full origin-left",
                        state === "loading" && "bg-primary",
                        state === "success" && "bg-emerald-500",
                        state === "error" && "bg-destructive"
                      )}
                      initial={state === "loading" ? { scaleX: 0 } : false}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>

                  {/* Body lines */}
                  <motion.div
                    key={state}
                    className="flex flex-col gap-[6px]"
                    variants={linesContainerVariants}
                    initial={state === "loading" ? "hidden" : false}
                    animate="visible"
                  >
                    {REPORT_LINES.map((width, idx) => (
                      <div
                        key={idx}
                        className="h-[4px] rounded-full bg-foreground/10 overflow-hidden"
                        style={{ width }}
                      >
                        <motion.div
                          className={cn(
                            "h-full rounded-full origin-left",
                            state === "loading" && "bg-foreground/40",
                            state === "success" && "bg-emerald-500/70",
                            state === "error" && "bg-destructive/50"
                          )}
                          variants={state === "loading" ? lineVariants : undefined}
                          initial={state === "loading" ? "hidden" : false}
                          animate={state === "loading" ? "visible" : { scaleX: 1 }}
                        />
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Stamp badge — overlaps bottom-right corner of the sheet */}
              <AnimatePresence>
                {(state === "success" || state === "error") && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: -10 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.15 }}
                    className={cn(
                      "absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-sm",
                      state === "success" &&
                        "bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
                      state === "error" &&
                        "bg-destructive/10 border-destructive text-destructive"
                    )}
                  >
                    {state === "success" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path
                          d="M20 6L9 17l-5-5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.35, ease: "easeOut", delay: 0.25 }}
                        />
                      </svg>
                    )}
                    {state === "error" && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path d="M18 6L6 18" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, delay: 0.25 }} />
                        <motion.path d="M6 6l12 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, delay: 0.4 }} />
                      </svg>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Texts Section */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.12 }}
            className="flex flex-col items-center gap-1.5 px-6 text-center z-10 max-w-sm"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={state}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "text-sm font-semibold tracking-wide",
                  state === "success" && "text-emerald-600 dark:text-emerald-400",
                  state === "error" && "text-destructive",
                  state === "loading" && "text-foreground"
                )}
              >
                {state === "loading" && loadingLabel}
                {state === "success" && successLabel}
                {state === "error" && errorLabel}
              </motion.span>
            </AnimatePresence>

            <AnimatePresence>
              {state === "error" && errorSub && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="text-xs text-muted-foreground leading-normal"
                >
                  {errorSub}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
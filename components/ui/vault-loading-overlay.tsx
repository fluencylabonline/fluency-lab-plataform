"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type OverlayState = "idle" | "loading" | "success" | "error";

interface VaultLoadingOverlayProps {
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

// Days that cycle through the flipping calendar page while it "thinks"
const FLIP_DAYS = ["12", "13", "14", "15", "16", "17", "18", "19"];
const FLIP_INTERVAL_MS = 420;

export function VaultLoadingOverlay({
  state,
  loadingLabel = "Atualizando status...",
  successLabel = "Status atualizado com sucesso!",
  errorLabel = "Erro ao atualizar",
  errorSub = "Ocorreu um erro no servidor. Tente novamente.",
  onDone,
  layoutId,
}: VaultLoadingOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [dayIndex, setDayIndex] = useState(0);

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

  // Cycle the calendar page while loading, like pages turning toward "today"
  useEffect(() => {
    if (state !== "loading") return;

    const interval = setInterval(() => {
      setDayIndex((i) => (i + 1) % FLIP_DAYS.length);
    }, FLIP_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      setDayIndex(0);
    };
  }, [state]);

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

  const currentDay = FLIP_DAYS[dayIndex];

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

            {/* Success "confetti" — little torn paper squares instead of dots */}
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

            {/* Error: a few date-marks falling away, like pages torn off */}
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

            {/* Main Calendar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.08 }}
              className="relative z-10 flex flex-col items-center"
            >
              {/* Binder rings */}
              <div className="flex gap-4 z-20 -mb-1">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "block w-1.5 h-3.5 rounded-full border-2 transition-colors duration-300",
                      state === "loading" && "bg-primary/20 border-primary/60",
                      state === "success" && "bg-emerald-500/20 border-emerald-500",
                      state === "error" && "bg-destructive/20 border-destructive"
                    )}
                  />
                ))}
              </div>

              {/* Calendar card */}
              <div
                className={cn(
                  "relative w-20 h-20 rounded-lg border-2 bg-card shadow-sm overflow-hidden transition-colors duration-300",
                  state === "loading" && "border-primary/30",
                  state === "success" && "border-emerald-500",
                  state === "error" && "border-destructive"
                )}
              >
                {/* Header strip — month label */}
                <div
                  className={cn(
                    "h-5 w-full flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-primary-foreground transition-colors duration-300",
                    state === "loading" && "bg-primary",
                    state === "success" && "bg-emerald-500",
                    state === "error" && "bg-destructive"
                  )}
                >
                  Jun
                </div>

                {/* Body */}
                <div className="relative flex h-[60px] items-center justify-center">
                  {/* Loading: a date page flipping toward "today" */}
                  {state === "loading" && (
                    <div
                      className="relative h-8 w-12 overflow-hidden"
                      style={{ perspective: 240 }}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={currentDay}
                          className="absolute inset-0 flex items-center justify-center text-[26px] font-bold leading-none text-foreground/80"
                          style={{
                            transformOrigin: "center",
                            transformStyle: "preserve-3d",
                            backfaceVisibility: "hidden",
                          }}
                          initial={{ rotateX: 90, opacity: 0 }}
                          animate={{ rotateX: 0, opacity: 1 }}
                          exit={{ rotateX: -90, opacity: 0 }}
                          transition={{ duration: 0.32, ease: "easeInOut" }}
                        >
                          {currentDay}
                        </motion.span>
                      </AnimatePresence>
                      {/* fold line across the middle, like a real desk calendar page */}
                      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-foreground/10" />
                    </div>
                  )}

                  {/* Success: checkmark stamped on the date */}
                  {state === "success" && (
                    <motion.svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-600 dark:text-emerald-400"
                      initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
                    >
                      <motion.path
                        d="M20 6L9 17l-5-5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
                      />
                    </motion.svg>
                  )}

                  {/* Error: date crossed out */}
                  {state === "error" && (
                    <motion.svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-destructive"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    >
                      <motion.path
                        d="M18 6L6 18"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                      <motion.path
                        d="M6 6l12 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 }}
                      />
                    </motion.svg>
                  )}
                </div>
              </div>
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
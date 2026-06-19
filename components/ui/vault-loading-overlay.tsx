"use client";

import { useEffect, useRef } from "react";
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
}

const PARTICLE_ANGLES = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
const STATIC_RANDOM_OFFSETS = [
  -0.34, 0.12, -0.48, 0.29, -0.15, 0.41, -0.05, 0.22,
  -0.42, 0.07, -0.27, 0.38
];

export function VaultLoadingOverlay({
  state,
  loadingLabel = "Atualizando status...",
  successLabel = "Status atualizado com sucesso!",
  errorLabel = "Erro ao atualizar",
  errorSub = "Ocorreu um erro no servidor. Tente novamente.",
  onDone,
}: VaultLoadingOverlayProps) {
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
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

            {/* Success Particles Burst */}
            {state === "success" && (
              <div className="absolute inset-0 pointer-events-none">
                {PARTICLE_ANGLES.map((angle, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-500"
                    initial={{ scale: 0, x: -4, y: -4, opacity: 1 }}
                    animate={{
                      scale: [0, 1.2, 0.6, 0],
                      x: Math.cos((angle * Math.PI) / 180) * 56 - 4,
                      y: Math.sin((angle * Math.PI) / 180) * 56 - 4,
                      opacity: [1, 1, 0.4, 0]
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

            {/* Error Particles Fall */}
            {state === "error" && (
              <div className="absolute inset-0 pointer-events-none">
                {PARTICLE_ANGLES.slice(0, 8).map((angle, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-destructive"
                    initial={{ scale: 0, x: -3, y: -3, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0.8, 0],
                      x: Math.cos((angle * Math.PI) / 180) * 35 - 3 + (STATIC_RANDOM_OFFSETS[idx] || 0) * 15,
                      y: Math.sin((angle * Math.PI) / 180) * 35 - 3 + 24, // gravity effect
                      opacity: [1, 1, 0.3, 0]
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

            {/* Main Animated Circle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className={cn(
                "relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300",
                state === "loading" && "border-primary/20",
                state === "success" && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 scale-110",
                state === "error" && "border-destructive bg-destructive/10 text-destructive scale-100"
              )}
            >
              {/* Spinner for Loading */}
              {state === "loading" && (
                <motion.svg
                  className="absolute w-[calc(100%+4px)] h-[calc(100%+4px)] text-primary"
                  viewBox="0 0 100 100"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeLinecap="round"
                    animate={{
                      strokeDasharray: ["1, 200", "120, 150", "120, 150"],
                      strokeDashoffset: [0, -30, -140],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.svg>
              )}

              {/* Loader Dot */}
              {state === "loading" && (
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-primary"
                  animate={{ scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Checkmark SVG for Success */}
              {state === "success" && (
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M20 6L9 17l-5-5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
                  />
                </svg>
              )}

              {/* Cross SVG for Error */}
              {state === "error" && (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
                </svg>
              )}
            </motion.div>
          </div>

          {/* Texts Section */}
          <div className="flex flex-col items-center gap-1.5 px-6 text-center z-10 max-w-sm">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

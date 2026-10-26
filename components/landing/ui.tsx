"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CalendarDaysIcon } from "@/components/animated-icons/calendar";

/** CTA principal único da página: sempre leva à seção de agendamento. */
export function PrimaryCTA({ className }: { className?: string }) {
  const t = useTranslations("LandingShowcase.Common");
  return (
    <a
      href="#agendar"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold transition-transform hover:scale-[1.01] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className
      )}
    >
      <CalendarDaysIcon size={22} />
      {t("cta")}
    </a>
  );
}

/** CTAs de apoio de cada seção: texto específico, mesmo destino. */
export function SoftCTA({ children }: { children: ReactNode }) {
  return (
    <a href="#agendar" className="inline-flex items-center gap-2 font-bold text-primary underline-offset-4 hover:underline">
      {children} <span aria-hidden>→</span>
    </a>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex w-fit rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold uppercase tracking-widest">{children}</span>;
}

/** Entra na tela com fade + subida quando o bloco aparece no scroll (uma vez). Sem movimento se o usuário pediu menos animação. */
export function Reveal({ children, delay = 0, y = 28, x = 0, className }: { children: ReactNode; delay?: number; y?: number; x?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function LandingSection({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("relative scroll-mt-24 px-6 md:px-12 py-12 md:py-16", className)}>
      {children}
    </section>
  );
}

export const Skeleton = ({ ratio = "9/19" }: { ratio?: string }) => <div className="w-full rounded-3xl bg-muted/60 animate-pulse" style={{ aspectRatio: ratio }} />;

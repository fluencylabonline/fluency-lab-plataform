"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { CalendarCheck, Map as MapIcon, Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LazyMount, Phone } from "../devices";
import { Badge, LandingSection, Reveal, Skeleton, SoftCTA } from "../ui";
import { PracticeQuizPhone } from "../screens/PracticeQuiz";
import { PracticePagePhone } from "../screens/PracticePage";

interface DiffItem {
  badge: string;
  title: string;
  text: string;
}

const TRAIL_ICONS = [Mic, CalendarCheck, MapIcon] as const;

function PageWithTab({ initial }: { initial: "practice" | "roadmap" | "history" }) {
  const [tab, setTab] = useState(initial);
  return <PracticePagePhone tab={tab} onTab={setTab} />;
}

/** Trilha no estilo do mapa de prática: linha cinza no meio que vai se colorindo com o scroll, com uma parada por tela. */
export function DifferentialsSection() {
  const t = useTranslations("LandingShowcase.Differentials");
  const items = t.raw("items") as DiffItem[];
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 65%", "end 65%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const scaleY = useTransform(reduced ? scrollYProgress : fill, (v) => (reduced ? 1 : v));

  useMotionValueEvent(scrollYProgress, "change", (v) => setReached(v > 0.86 ? 3 : v > 0.5 ? 2 : v > 0.1 ? 1 : 0));

  const screens = [<PracticeQuizPhone key="a" />, <PageWithTab key="b" initial="practice" />, <PageWithTab key="c" initial="roadmap" />];

  return (
    <LandingSection id="diferenciais">
      <Reveal className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-3 text-center">
        <Badge>{t("badge")}</Badge>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">{t("title")}</h2>
      </Reveal>

      <div ref={trackRef} className="relative mx-auto max-w-6xl">
        {/* trilha: cinza por baixo, colorida por cima conforme o scroll */}
        <div aria-hidden className="absolute bottom-0 top-0 left-7 lg:left-1/2 w-3 -translate-x-1/2 rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/25" />
        <motion.div aria-hidden style={{ scaleY }} className="absolute bottom-0 top-0 left-7 lg:left-1/2 w-3 -translate-x-1/2 origin-top rounded-full bg-gradient-to-b from-primary to-violet-500" />

        {items.map((d, i) => {
          const Icon = TRAIL_ICONS[i];
          const left = i % 2 === 0; // aparelho à esquerda nas linhas pares
          const done = reached > i;
          const phone = (
            <Reveal x={left ? -50 : 50} y={0} delay={0.05} className="w-full max-w-[300px] mx-auto">
              <LazyMount placeholder={<Skeleton />}>
                <Phone label={d.badge}>{screens[i]}</Phone>
              </LazyMount>
            </Reveal>
          );
          const text = (
            <Reveal x={left ? 50 : -50} y={0} delay={0.12} className={cn("flex flex-col items-start gap-4", !left && "lg:items-end lg:text-right")}>
              <Badge>{d.badge}</Badge>
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{d.title}</h3>
              <p className="text-muted-foreground text-lg max-w-md">{d.text}</p>
              {i === 2 && <SoftCTA>{t("cta")}</SoftCTA>}
            </Reveal>
          );
          return (
            <div key={i} className="relative pl-20 lg:pl-0 py-10 lg:py-16 lg:grid lg:grid-cols-[1fr_120px_1fr] lg:items-center lg:gap-6">
              <div className="mb-8 lg:mb-0 lg:order-none">{left ? phone : text}</div>
              <div className="absolute left-7 top-12 -translate-x-1/2 lg:static lg:translate-x-0 lg:flex lg:justify-center">
                <motion.span
                  animate={{ scale: done ? 1 : 0.92 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className={cn(
                    "relative z-10 grid size-16 place-items-center rounded-[22px] border-b-[6px] shadow-lg transition-colors duration-500",
                    done ? "bg-yellow-400 border-yellow-600 text-white ring-8 ring-yellow-400/20" : "bg-muted border-muted-foreground/25 text-muted-foreground/60"
                  )}
                >
                  <Icon className="size-7" strokeWidth={2.5} />
                </motion.span>
              </div>
              <div>{left ? text : phone}</div>
            </div>
          );
        })}
      </div>
    </LandingSection>
  );
}

"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Distância visível de cada card atrás do da frente. */
const PEEK = 30;

/** Planos empilhados, um atrás do outro. Toque num card de trás para trazê-lo para a frente. */
export function PlanStack() {
  const t = useTranslations("LandingShowcase.Pricing");
  const items = t.raw("main.items") as string[];
  const reduced = useReducedMotion();
  const [order, setOrder] = useState([0, 1, 2]); // order[0] = card da frente

  const bring = (id: number) => setOrder((o) => [id, ...o.filter((x) => x !== id)]);

  return (
    <div>
      <div className="relative h-[560px]" style={{ paddingTop: PEEK * 2 }}>
        {[0, 1, 2].map((id) => {
          const pos = order.indexOf(id);
          const front = pos === 0;
          return (
            <motion.div
              key={id}
              role={front ? undefined : "button"}
              tabIndex={front ? undefined : 0}
              aria-label={front ? undefined : t("viewPlan")}
              onClick={front ? undefined : () => bring(id)}
              onKeyDown={front ? undefined : (e) => (e.key === "Enter" || e.key === " ") && bring(id)}
              initial={false}
              animate={{ y: -pos * PEEK, scale: 1 - pos * 0.055, opacity: 1 - pos * 0.1 }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
              style={{ zIndex: 10 - pos, top: PEEK * 2 }}
              className={cn(
                "absolute inset-x-0 bottom-0 origin-top overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-2xl shadow-black/30",
                front ? "border-border" : "cursor-pointer border-border/70 hover:brightness-105"
              )}
            >
              {id === 0 ? (
                <div className="flex h-full flex-col p-8 md:p-10">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">{t("main.label")}</p>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">{t("main.status")}</span>
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-6xl font-bold tracking-tighter md:text-7xl">{t("main.price")}</span>
                    <span className="pb-2 text-lg font-semibold text-muted-foreground">{t("perMonth")}</span>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-base font-medium">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-4" /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex h-full flex-col p-8 md:p-10">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("soon.label")}</p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">{t("soon.status")}</span>
                  </div>
                  <p className="mt-2 select-none text-6xl font-bold tracking-tighter text-muted-foreground/40 blur-[5px] md:text-7xl" aria-hidden>{t("soon.price")}<span className="text-lg font-semibold">{t("perMonth")}</span></p>
                  <div className="mt-8 space-y-5" aria-hidden>
                    {[85, 70, 90, 60, 75].map((w, i) => <span key={i} className="block h-3 rounded-full bg-muted" style={{ width: `${w}%` }} />)}
                  </div>
                  <p className="mt-auto rounded-full border border-dashed border-border py-4 text-center text-sm font-bold text-muted-foreground">{t("soon.note")}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

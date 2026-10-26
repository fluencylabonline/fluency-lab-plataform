"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SystemSettings } from "@/modules/settings/settings.schema";
import { Reveal } from "../ui";
import { PlanStack } from "./PlanStack";

export function BookingSection({ settings }: { settings: SystemSettings }) {
  const t = useTranslations("LandingShowcase");
  const items = t.raw("Booking.items") as string[];
  const href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`;

  return (
    <section id="agendar" className="scroll-mt-24 mx-3 md:mx-8 my-12 lg:my-28 rounded-3xl bg-primary text-primary-foreground px-6 md:px-14 py-16 md:py-20 relative">
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" /></div>
      <div className="relative grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
        <Reveal className="flex flex-col gap-5">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[0.98]">{t("Booking.title")}</h2>
          <ul className="space-y-3 text-lg">
            {items.map((b) => (
              <li key={b} className="flex items-center gap-3"><span className="size-6 rounded-full bg-white/20 grid place-items-center"><Check className="size-4" /></span>{b}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.15} className="relative z-10 w-full max-w-md lg:justify-self-end lg:-my-40">
          <PlanStack href={href} cta={t("Common.cta")} note={t("Booking.note")} />
        </Reveal>
      </div>
    </section>
  );
}

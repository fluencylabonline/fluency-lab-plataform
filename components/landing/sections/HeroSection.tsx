"use client";

import { useTranslations } from "next-intl";
import { Monitor, Phone } from "../devices";
import { PrimaryCTA, Reveal } from "../ui";
import { CollabProvider, HeroLaptopScreen, HeroPhoneScreen } from "../screens/HeroCollab";

export function HeroSection() {
  const t = useTranslations("LandingShowcase.Hero");

  return (
    <section id="aula" className="relative scroll-mt-24 min-h-[100svh] flex items-center px-6 md:px-12 pt-32 pb-12 lg:pt-36">
      <div className="w-full max-w-[1440px] mx-auto grid lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.5fr)] gap-10 items-center">
        <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
          <Reveal y={36}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[0.98]">{t("title")}</h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-muted-foreground text-lg max-w-lg">{t("subtitle")}</p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <PrimaryCTA />
            <a href="#diferenciais" className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 border-foreground/15 px-8 py-4 font-bold hover:bg-foreground/5 transition-colors">
              {t("seeHow")}
            </a>
          </Reveal>
        </div>

        <CollabProvider>
          <Reveal delay={0.3} y={50}>
            <div aria-hidden className="pointer-events-none select-none relative w-full max-w-[1100px] mx-auto pb-12 pr-[27%]">
              <div className="lg:-rotate-1"><Monitor label={t("monitorLabel")}><HeroLaptopScreen /></Monitor></div>
              <div className="absolute right-0 -bottom-2 rotate-3 z-10" style={{ width: "min(30%, calc(56svh * 0.478))", minWidth: 130 }}>
                <Phone label={t("phoneLabel")}><HeroPhoneScreen /></Phone>
              </div>
            </div>
          </Reveal>
        </CollabProvider>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { LazyMount, Laptop, Tablet } from "../devices";
import { Badge, LandingSection, Reveal, Skeleton, SoftCTA } from "../ui";
import { PlacementTablet } from "../screens/PlacementTablet";
import { TrialCall } from "../screens/TrialCall";

export function PlacementSection() {
  const t = useTranslations("LandingShowcase.Placement");

  return (
    <LandingSection id="nivelamento">
      <Reveal className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
        <Badge>{t("badge")}</Badge>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">{t("title")}</h2>
        <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
      </Reveal>

      <div className="mx-auto flex max-w-6xl flex-col gap-16 lg:gap-24">
        {/* Parte 1: aula experimental */}
        <div className="grid items-center gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <Reveal x={-50} y={0} className="w-full">
            <LazyMount placeholder={<Skeleton ratio="16/10" />}><Laptop label={t("part1.deviceLabel")}><TrialCall /></Laptop></LazyMount>
          </Reveal>
          <Reveal x={50} y={0} delay={0.1} className="flex flex-col items-start gap-4">
            <Badge>{t("part1.badge")}</Badge>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{t("part1.title")}</h3>
            <p className="text-muted-foreground text-lg max-w-md">{t("part1.text")}</p>
          </Reveal>
        </div>

        {/* Parte 2: teste de nível */}
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal x={-50} y={0} className="flex flex-col items-start gap-4 lg:order-1">
            <Badge>{t("part2.badge")}</Badge>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{t("part2.title")}</h3>
            <p className="text-muted-foreground text-lg max-w-md">{t("part2.text")}</p>
            <SoftCTA>{t("part2.cta")}</SoftCTA>
          </Reveal>
          <Reveal x={50} y={0} delay={0.1} className="mx-auto w-full max-w-md lg:order-2">
            <LazyMount placeholder={<Skeleton ratio="3/4" />}><Tablet label={t("part2.deviceLabel")}><PlacementTablet /></Tablet></LazyMount>
          </Reveal>
        </div>
      </div>
    </LandingSection>
  );
}

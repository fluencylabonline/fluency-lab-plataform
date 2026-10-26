"use client";

import { useTranslations } from "next-intl";
import { LazyMount, Phone } from "../devices";
import { Badge, LandingSection, Reveal, Skeleton } from "../ui";
import { ScheduleProvider, StudentSchedulePhone } from "../screens/StudentSchedule";

export function PricingSection() {
  const t = useTranslations("LandingShowcase.Pricing");

  return (
    <LandingSection id="agenda">
      <Reveal className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
        <Badge>{t("badge")}</Badge>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">{t("title")}</h2>
        <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
      </Reveal>

      <ScheduleProvider>
        <Reveal y={40} className="mx-auto w-full max-w-[320px]">
          <LazyMount placeholder={<Skeleton />}>
            <Phone label={t("phoneLabel")}><StudentSchedulePhone /></Phone>
          </LazyMount>
        </Reveal>
      </ScheduleProvider>
    </LandingSection>
  );
}

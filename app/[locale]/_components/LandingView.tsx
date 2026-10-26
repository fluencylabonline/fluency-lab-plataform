"use client";

import dynamic from "next/dynamic";
import { useDevice } from "@/hooks/ui/use-device";
import { PwaWelcomeScreen } from "@/components/landing/PwaWelcomeScreen";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { BookingSection } from "@/components/landing/sections/BookingSection";
import type { SessionUserDTO } from "@/modules/user/user.schema";
import type { SystemSettings } from "@/modules/settings/settings.schema";

// Abaixo da dobra: carregadas à parte (cada uma traz seus mockups)
const DifferentialsSection = dynamic(() => import("@/components/landing/sections/DifferentialsSection").then((m) => m.DifferentialsSection), { ssr: false });
const PlacementSection = dynamic(() => import("@/components/landing/sections/PlacementSection").then((m) => m.PlacementSection), { ssr: false });
const PricingSection = dynamic(() => import("@/components/landing/sections/PricingSection").then((m) => m.PricingSection), { ssr: false });
const Footer = dynamic(() => import("@/components/landing/Footer"), { ssr: false });

/** Landing "mostre, não conte": cada seção exibe a plataforma funcionando em mockups. */
export function LandingView({ user, settings }: { user: SessionUserDTO | null; settings: SystemSettings }) {
  const { isStandalone } = useDevice();
  if (isStandalone) return <PwaWelcomeScreen />;

  return (
    <div className="min-h-screen bg-slate-200/50 dark:bg-slate-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300 relative">
      <div className="absolute inset-0 bg-[url('/textures/cubes.png')] opacity-[0.03] dark:opacity-[0.08] pointer-events-none" />
      <LandingNav user={user} />
      <main className="relative">
        <HeroSection />
        <DifferentialsSection />
        <PlacementSection />
        <PricingSection />
        <BookingSection settings={settings} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}

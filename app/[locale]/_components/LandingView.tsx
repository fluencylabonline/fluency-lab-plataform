"use client";

import dynamic from "next/dynamic";
import { useDevice } from "@/hooks/ui/use-device";
import { PwaWelcomeScreen } from "@/components/landing/PwaWelcomeScreen";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { BookingSection } from "@/components/landing/sections/BookingSection";
import type { SessionUserDTO } from "@/modules/user/user.schema";
import type { SystemSettings } from "@/modules/settings/settings.schema";

// Abaixo da dobra: JS carregado à parte (cada uma traz seus mockups), mas o HTML sai renderizado no servidor para SEO
const DifferentialsSection = dynamic(() => import("@/components/landing/sections/DifferentialsSection").then((m) => m.DifferentialsSection));
const PlacementSection = dynamic(() => import("@/components/landing/sections/PlacementSection").then((m) => m.PlacementSection));
const PricingSection = dynamic(() => import("@/components/landing/sections/PricingSection").then((m) => m.PricingSection));
const Footer = dynamic(() => import("@/components/landing/Footer"));

/** Manchas de cor muito difusas (cores da escola) espalhadas pela página, sobre fundo branco / escuro. */
const GLOWS = [
  "left-[-12%] top-[-2%] size-[640px] bg-amber-400/40 dark:bg-amber-500/15",
  "right-[-10%] top-[2%] size-[720px] bg-primary/30 dark:bg-primary/20",
  "left-[28%] top-[11%] size-[520px] bg-sky-300/35 dark:bg-sky-500/10",
  "left-[-14%] top-[30%] size-[680px] bg-primary/25 dark:bg-primary/15",
  "right-[-12%] top-[44%] size-[640px] bg-amber-300/35 dark:bg-amber-500/10",
  "left-[10%] top-[62%] size-[700px] bg-sky-300/30 dark:bg-sky-500/10",
  "right-[-8%] top-[78%] size-[620px] bg-primary/25 dark:bg-primary/15",
  "left-[-10%] top-[92%] size-[560px] bg-amber-300/30 dark:bg-amber-500/10",
];

function Glows() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {GLOWS.map((c) => <span key={c} className={`absolute rounded-full blur-[130px] ${c}`} />)}
    </div>
  );
}

/** Landing "mostre, não conte": cada seção exibe a plataforma funcionando em mockups. */
export function LandingView({ user, settings }: { user: SessionUserDTO | null; settings: SystemSettings }) {
  const { isStandalone } = useDevice();
  if (isStandalone) return <PwaWelcomeScreen />;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300 relative">
      <Glows />
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

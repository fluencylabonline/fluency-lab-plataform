"use client";
import { usePWA } from "@/hooks/ui/usePWA";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { PwaWelcomeScreen } from "@/components/landing/PwaWelcomeScreen";
import ComparisonSection from "@/components/landing/ComparisonSection";
import HowItWorks from "@/components/landing/HowItWorks";
import TeamSection from "@/components/landing/TeamSection";
import Footer from "@/components/landing/Footer";

import { User } from "@/modules/user/user.schema";

export function LandingView({ user }: { user: User | null }) {
  const { isStandalone } = usePWA();
  return (
    <>
      {!isStandalone ? (
        <div className="min-h-screen bg-white dark:bg-slate-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.08] pointer-events-none" />

          <div className="relative max-h-[97vh] lg:min-h-[96vh] flex-1 rounded-3xl overflow-hidden flex flex-col">
            <video
              src="./videos/landing.webm"
              autoPlay
              loop
              muted
              playsInline
              poster="/videos/landing-poster.png"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover z-0"
            />

            <div className="absolute inset-0 bg-black/5 z-[1] pointer-events-none" />

            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent z-[2]" />

            <div className="relative z-[3] flex flex-col flex-1">
              <LandingNavbar user={user} />
              <div id="hero" />
              <LandingHero user={user} />
            </div>
          </div>

          <div id="plans" className="relative">
            <ComparisonSection />
          </div>

          <div id="team" className="relative">
            <TeamSection />
          </div>

          <div id="faq" className="relative">
            <HowItWorks />
          </div>

          <Footer />
        </div>
      ) : (
        <PwaWelcomeScreen />
      )}
    </>
  );
}

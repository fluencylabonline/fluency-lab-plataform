"use client";
import { useState, useEffect } from "react";
import { useDevice } from "@/hooks/ui/use-device";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { PwaWelcomeScreen } from "@/components/landing/PwaWelcomeScreen";
import ComparisonSection from "@/components/landing/ComparisonSection";
import HowItWorks from "@/components/landing/HowItWorks";
import TeamSection from "@/components/landing/TeamSection";
import Footer from "@/components/landing/Footer";
import { User } from "@/modules/user/user.schema";

export function LandingView({ user }: { user: User | null }) {
  const { isStandalone } = useDevice();
  const [videoSrc, setVideoSrc] = useState<string>("");

  useEffect(() => {
    // Delay loading the video source to prioritize initial bandwidth and LCP poster image
    const timer = setTimeout(() => {
      setVideoSrc("./videos/landing.webm");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {!isStandalone ? (
        <div className="min-h-screen bg-slate-200/50 dark:bg-slate-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300 relative">
          <div className="absolute inset-0 bg-[url('/textures/cubes.png')] opacity-[0.03] dark:opacity-[0.08] pointer-events-none" />

          <div className="relative max-h-[97vh] lg:min-h-[96vh] flex-1 rounded-3xl overflow-hidden flex flex-col">
            {/* Unified Video Element with Poster for LCP Optimization */}
            <video
              src={videoSrc || undefined}
              poster="/videos/landing-poster.png"
              autoPlay
              loop
              muted
              playsInline
              className="absolute top-0 left-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/5 z-1 pointer-events-none" />

            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 to-transparent z-1" />

            <div className="relative z-3 flex flex-col flex-1">
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

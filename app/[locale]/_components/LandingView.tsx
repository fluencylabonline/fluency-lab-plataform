"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
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
  const [loadVideo, setLoadVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    // Delay loading the video to prioritize LCP image rendering and initial bandwidth
    const timer = setTimeout(() => {
      setLoadVideo(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {!isStandalone ? (
        <div className="min-h-screen bg-slate-200/50 dark:bg-slate-950 p-2 md:p-4 flex flex-col font-sans transition-colors duration-300 relative">
          <div className="absolute inset-0 bg-[url('/textures/cubes.png')] opacity-[0.03] dark:opacity-[0.08] pointer-events-none" />

          <div className="relative max-h-[97vh] lg:min-h-[96vh] flex-1 rounded-3xl overflow-hidden flex flex-col">
            {/* LCP Optimized Poster Image */}
            <Image
              src="/videos/landing-poster.png"
              alt="FluencyLab Platform"
              fill
              priority
              className="absolute top-0 left-0 w-full h-full object-cover"
              sizes="100vw"
            />

            {/* Deferred high-fidelity video layer */}
            {loadVideo && (
              <video
                src="./videos/landing.webm"
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-400"
                style={{ opacity: isVideoPlaying ? 1 : 0 }}
                onPlay={() => setIsVideoPlaying(true)}
              />
            )}

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

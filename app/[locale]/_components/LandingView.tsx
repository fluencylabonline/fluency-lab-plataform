"use client";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useDevice } from "@/hooks/ui/use-device";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { PwaWelcomeScreen } from "@/components/landing/PwaWelcomeScreen";
import { User } from "@/modules/user/user.schema";

// Seções below-the-fold: carregadas apenas após o hero ser exibido
const ComparisonSection = dynamic(
  () => import("@/components/landing/ComparisonSection"),
  { ssr: false }
);
const HowItWorks = dynamic(
  () => import("@/components/landing/HowItWorks"),
  { ssr: false }
);
const TeamSection = dynamic(
  () => import("@/components/landing/TeamSection"),
  { ssr: false }
);
const Footer = dynamic(
  () => import("@/components/landing/Footer"),
  { ssr: false }
);

export function LandingView({ user }: { user: User | null }) {
  const { isStandalone } = useDevice();
  const [videoSrc, setVideoSrc] = useState<string>("");

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], ["0%", "20%"]);

  useEffect(() => {
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
            <motion.video
              src={videoSrc || undefined}
              poster="/videos/landing-poster.png"
              autoPlay
              loop
              muted
              playsInline
              style={{ y, scale: 1.15 }}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/35 lg:to-transparent z-1 pointer-events-none" />

            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 to-transparent z-1" />

            <div className="relative z-3 flex flex-col flex-1">
              <LandingNavbar user={user} />
              <div id="about" />
              <LandingHero user={user} />
            </div>
          </div>

          <div id="plans" className="relative mb-12">
            <ComparisonSection />
          </div>

          <div id="team" className="relative mb-12">
            <TeamSection />
          </div>

          <div id="faq" className="relative mb-12">
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

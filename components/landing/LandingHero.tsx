"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { HomeScreen } from "@/components/landing/screens/HomeScreen";
import { PathScreen } from "@/components/landing/screens/PathScreen";
import { EditorScreen } from "./screens/EditScreen";
import { PlacementScreen } from "./screens/PlacementScreen";

import { User } from "@/modules/user/user.schema";
import { CalendarDaysIcon } from "../animated-icons/calendar";
import { PhoneMockup } from "./PhoneMockup";
import Link from "next/link";

export function LandingHero({ user }: { user: User | null }) {
  const t = useTranslations("LandingPage");
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "path" | "editor" | "placement"
  >("editor");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => {
        if (prev === "home") return "path";
        if (prev === "path") return "placement";
        if (prev === "placement") return "editor";
        return "home";
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const sanitizedSubtitle = t.raw("heroSubtitle") || "";

  return (
    <main className="w-full h-full relative grid grid-cols-1 lg:grid-cols-2 flex-1">
      <div className="flex flex-col justify-center lg:justify-end px-6 md:px-12 lg:px-14 pb-12 lg:pb-20 z-20 order-1 pt-22 lg:pt-0">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col text-center sm:text-left">
          <p className="text-gray-200 dark:text-gray-300 font-medium text-sm md:text-sm max-w-md">
            <span
              dangerouslySetInnerHTML={{
                __html: sanitizedSubtitle,
              }}
            />
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.95] mb-8 mt-2">
            {t("title") || "Master a language"}
          </h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`https://wa.me/5511999999999?text=${encodeURIComponent(
                "Olá! Vi o site da Fluency Lab e gostaria de saber mais sobre as aulas personalizadas."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-row items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold duration-300 ease-in-out transform-all"
              >
              <CalendarDaysIcon size={24} />
                {t("primaryCta") || "Start now"}
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative w-full min-h-[450px] lg:h-full order-2 lg:static pointer-events-none overflow-visible">
        <div
          className="
            relative w-full h-full flex items-end justify-center lg:block
            lg:absolute lg:top-32 lg:right-40 lg:w-auto lg:h-auto
            pointer-events-auto
          "
        >
          <PhoneMockup
            onClick={() => {
              setCurrentScreen((prev) => {
                if (prev === "home") return "path";
                if (prev === "path") return "placement";
                if (prev === "placement") return "editor";
                return "home";
              });
            }}
          >
            <AnimatePresence mode="wait">
              {currentScreen === "home" ? (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <HomeScreen user={user} />
                </motion.div>
              ) : currentScreen === "path" ? (
                <motion.div
                  key="path"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <PathScreen user={user} />
                </motion.div>
              ) : currentScreen === "placement" ? (
                <motion.div
                  key="placement"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <PlacementScreen />
                </motion.div>
              ) : (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <EditorScreen />
                </motion.div>
              )}
            </AnimatePresence>
          </PhoneMockup>
        </div>
      </div>
    </main>
  );
}
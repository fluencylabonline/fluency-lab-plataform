"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { containerVariants, itemVariants } from "@/lib/animations";

interface FeatureStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

export default function HowItWorks() {
  const t = useTranslations("LandingPage.HowItWorks");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);

  const stepsData = t.raw("steps") as Record<string, FeatureStep>;
  const features = Object.entries(stepsData).map(([key, value]) => ({
    key,
    ...value
  }));

  const handleMouseEnter = (index: number) => {
    if (lockedIndex === null) {
      setActiveIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (lockedIndex === null) {
      setActiveIndex(null);
    }
  };

  const handleClick = (index: number) => {
    if (lockedIndex === index) {
      setLockedIndex(null);
      setActiveIndex(null);
    } else {
      setLockedIndex(index);
      setActiveIndex(index);
    }
  };

  return (
    <section className="py-12 md:py-24 px-4 mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="flex justify-center sm:justify-start items-baseline gap-2 mb-16"
      >
        <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("title") || "Como funciona"}
        </motion.h2>
        <motion.span variants={itemVariants} className="text-2xl text-slate-300 dark:text-slate-700 font-light">
          {t("plus") || "+"}
        </motion.span>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="flex flex-col"
      >
        {features.map((feature, index) => {
          const isActive = activeIndex === index;

          return (
            <motion.div
              key={feature.key}
              variants={itemVariants}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(index)}
              animate={{
                scale: isActive ? 1.01 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "group relative cursor-pointer border-t border-slate-200 dark:border-slate-800 py-8 md:py-10 px-4 md:px-8 transition-all duration-300",
                "hover:z-10",
                isActive && "border-transparent z-10"
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                }}
                className="absolute inset-0 bg-primary/3 pointer-events-none"
                transition={{ duration: 0.3 }}
              />
              <div className="flex items-start justify-between gap-4 md:gap-8">
                <span
                  className={cn(
                    "text-sm font-mono transition-colors duration-300 mt-1",
                    isActive
                      ? "text-primary font-bold"
                      : "text-slate-400 dark:text-slate-600",
                  )}
                >
                  {feature.id}
                </span>

                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-xl md:text-3xl font-semibold transition-colors duration-300",
                      isActive
                        ? "text-primary"
                        : "text-slate-900 dark:text-slate-100",
                    )}
                  >
                    {feature.title}
                  </h3>

                  <p
                    className={cn(
                      "text-sm md:text-base transition-all duration-300 mt-1",
                      isActive ? "text-primary/80" : "text-slate-500",
                    )}
                  >
                    {feature.subtitle}
                  </p>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          marginTop: 16,
                        }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg max-w-2xl">
                          {feature.description}
                        </p>

                        <div className="pt-4 flex items-center gap-2 text-primary font-medium text-sm">
                          <span>{t("learnMore") || "Saber mais"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-end w-8">
                  <motion.div
                    animate={{
                      rotate: isActive ? 90 : 0,
                      scale: isActive ? 1.1 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {isActive ? (
                      <ArrowRight className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 -rotate-45" />
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div className="border-t border-slate-200 dark:border-slate-800" />
      </motion.div>
    </section>
  );
}
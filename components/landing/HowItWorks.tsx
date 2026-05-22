"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Languages, Laptop, HeartHandshake, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { containerVariants, itemVariants } from "@/lib/animations";
import Image from "next/image";

interface FeatureStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

export default function HowItWorks() {
  const t = useTranslations("LandingPage.HowItWorks");
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [lockedIndex, setLockedIndex] = useState<number | null>(0);

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

  const getIcon = (key: string) => {
    switch (key) {
      case "personalized":
        return Compass;
      case "natural":
        return Languages;
      case "complete":
        return Laptop;
      case "dedicated":
        return HeartHandshake;
      default:
        return Compass;
    }
  };

  const renderPreview = (key: string) => {
    switch (key) {
      case "personalized":
        return (
          <div className="border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col gap-4 text-left select-none max-w-md w-full">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 px-2.5 py-1 rounded-full">
                Meu Plano de Estudos
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">Objetivo: Fluência</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span>Inglês para Negócios</span>
                <span className="text-emerald-500 font-bold">Ativo</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[65%]" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium">🚀 Tecnologia</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium">💬 Liderança</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium">💼 Reuniões</span>
            </div>
          </div>
        );
      case "natural":
        return (
          <div className="border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col gap-4 text-left select-none max-w-md w-full">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conversa Real</span>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-sm text-slate-700 dark:text-slate-300">
                &quot;What did you do over the weekend?&quot;
              </div>
              <div className="bg-primary/10 text-primary p-3 rounded-2xl rounded-tr-none max-w-[85%] ml-auto text-sm font-medium">
                &quot;I worked on my new website project!&quot;
              </div>
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2 border border-emerald-500/10">
                💡 <strong>Feedback do Tutor:</strong> Use &quot;built&quot; para um tom mais profissional.
              </div>
            </div>
          </div>
        );
      case "complete":
        return (
          <div className="border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col gap-4 text-left select-none max-w-md w-full">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold text-sm">
                  FL
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Painel de Evolução</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Matheus Fernandes</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                +150 XP
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">VOCABULÁRIO</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">342 palavras</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">OFENSIVA</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">🔥 12 dias</p>
              </div>
            </div>
          </div>
        );
      case "dedicated":
        return (
          <div className="border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col gap-4 text-left select-none max-w-md w-full">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src="https://i.pravatar.cc/100?u=a042581f4e29026024d"
                  alt="Ana"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Teacher Ana</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Disponível para suporte</p>
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Hi Matheus! I saw your essay. It was fantastic! Lets practice the built-in vocabulary in our next session today?
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="px-4 mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="flex justify-center sm:justify-start items-baseline gap-2 mb-8 lg:mb-16"
      >
        <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
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
          const isAnyActive = activeIndex !== null;

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
                "group relative cursor-pointer py-8 md:py-10 px-4 md:px-8 transition-all duration-300 border-t",
                isAnyActive ? "border-transparent" : "border-slate-200 dark:border-slate-800",
                isActive ? "rounded-lg z-10" : "rounded-none"
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                }}
                className="absolute inset-0 bg-primary/3 pointer-events-none rounded-md"
                transition={{ duration: 0.3 }}
              />
              <div className="flex items-start justify-between gap-4 md:gap-8">
                <div className="flex items-center gap-3">

                  {(() => {
                    const IconComponent = getIcon(feature.key);
                    return (
                      <IconComponent
                        className={cn(
                          "w-5 h-5 md:w-6 md:h-6 transition-colors duration-300 mt-1",
                          isActive
                            ? "text-primary"
                            : "text-slate-400 dark:text-slate-600"
                        )}
                      />
                    );
                  })()}
                </div>

                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-xl md:text-3xl font-bold transition-colors duration-300",
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-2">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg">
                              {feature.description}
                            </p>

                            <div className="pt-2 flex items-center gap-2 text-primary font-medium text-sm">
                              <span>{t("learnMore") || "Saber mais"}</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="hidden md:flex justify-center items-center">
                            {renderPreview(feature.key)}
                          </div>
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
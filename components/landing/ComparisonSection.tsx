"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useTranslations } from "next-intl";
import { containerVariants, itemVariants } from "@/lib/animations";

type ComparisonItem = {
  title: string;
  problemTitle: string;
  problems: string[];
  solutionTitle: string;
  solutions: string[];
};

const ComparisonCard = ({
  item,
  labels
}: {
  item: ComparisonItem;
  labels: { others: string; fluencyLab: string }
}) => (
  <div className="card h-full flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 transition-colors duration-300">
    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-6 flex-1 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-none"
        >
          {labels.others || "Outros"}
        </Badge>
        <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
          {item.title || "Competitor"}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        {item.problemTitle || "Problems"}
      </h3>
      <ul className="space-y-3">
        {item.problems.map((prob, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-sm"
          >
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{prob}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="p-6 flex-1 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-950 p-1 rounded-full border border-slate-100 dark:border-slate-800">
        <ArrowRight className="w-5 h-5 text-slate-400 rotate-90" />
      </div>

      <div className="flex items-center gap-2 mb-4 pt-2">
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none shadow-none">
          {labels.fluencyLab || "Fluency Lab"}
        </Badge>
      </div>

      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {item.solutionTitle || "Solution"}
      </h3>

      <ul className="space-y-3">
        {item.solutions.map((sol, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{sol}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default function ComparisonSection() {
  const t = useTranslations("LandingPage.Comparison");

  const keys = ["apps", "marketplaces", "traditional"] as const;

  const comparisons: ComparisonItem[] = keys.map((key) => ({
    title: t(`items.${key}.title`) || "",
    problemTitle: t(`items.${key}.problemTitle`) || "",
    problems: (t(`items.${key}.problems`) || "").split(","),
    solutionTitle: t(`items.${key}.solutionTitle`) || "",
    solutions: (t(`items.${key}.solutions`) || "").split(","),
  }));

  const labels = {
    others: t("labels.others") || "Outros",
    fluencyLab: t("labels.fluencyLab") || "Fluency Lab",
  };

  return (
    <section className="py-12">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-4">
          <Badge
            variant="outline"
            className="px-4 py-1 border-primary/20 text-primary bg-primary/5"
          >
            {t("badge") || "Diferenciais"}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t("title") || "Por que a Fluency Lab é diferente?"}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            {t("description") || "Você já tentou aprender com apps e desistiu..."}
          </p>
        </div>

        <div className="block lg:hidden px-2">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-sm mx-auto sm:max-w-md"
          >
            <CarouselContent>
              {comparisons.map((item, index) => (
                <CarouselItem key={index} className="md:basis-1/2">
                  <div className="p-1 h-full">
                    <ComparisonCard item={item} labels={labels} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden sm:block">
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </div>
            <div className="mt-4 text-center text-sm text-slate-400 sm:hidden">
              {t("mobileSwipe") || "Deslize para ver mais →"}
            </div>
          </Carousel>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="hidden lg:grid grid-cols-3 gap-8"
        >
          {comparisons.map((item, index) => (
            <motion.div key={index} variants={itemVariants} className="h-full">
              <ComparisonCard item={item} labels={labels} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
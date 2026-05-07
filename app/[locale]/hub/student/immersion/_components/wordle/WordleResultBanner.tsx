"use client";
import { motion } from "framer-motion";
import { FinishedState } from "@/modules/immersion/immersion.types";

type WordleResultBannerProps = {
  finished: FinishedState;
};

export function WordleResultBanner({ finished }: WordleResultBannerProps) {
  if (!finished) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center font-bold p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800"
    >
      {finished === "win" ? "🎉 Você acertou!" : `🥺 Errou.`}
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Flame, Star, Trophy } from "lucide-react";

interface PracticeSummaryProps {
  xpGained: number;
  streak: number;
  accuracy: number;
  onGoBack: () => void;
}

export function PracticeSummary({ xpGained, streak, accuracy, onGoBack }: PracticeSummaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="text-center mb-8"
      >
        <div className="relative inline-block">
          <Trophy className="w-28 h-28 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full -z-10"
          />
        </div>
        <h1 className="text-4xl font-black text-yellow-500 mt-4">Sessão Completa!</h1>
        <p className="text-lg text-muted-foreground mt-1">Você praticou como um campeão.</p>
      </motion.div>

      {/* Stats */}
      <div className="flex flex-row items-stretch justify-center gap-3 w-full max-w-md mb-10">
        {[
          { label: "XP Ganho", value: `+${xpGained}`, icon: <Star className="fill-white w-5 h-5" />, bg: "bg-yellow-400 border-yellow-600" },
          { label: "Sequência", value: streak, icon: <Flame className="fill-white w-5 h-5" />, bg: "bg-orange-500 border-orange-700" },
          { label: "Acertos", value: `${Math.round(accuracy)}%`, icon: null, bg: "bg-emerald-500 border-emerald-700" },
        ].map(({ label, value, icon, bg }, i) => (
          <motion.div
            key={label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`flex-1 ${bg} border-b-4 rounded-2xl p-4 flex flex-col items-center justify-center text-white gap-1`}
          >
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</span>
            <div className="flex items-center gap-1 mt-1">
              {icon}
              <span className="text-lg font-black">{value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-md">
        <Button
          onClick={onGoBack}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg uppercase tracking-widest active:translate-y-1 transition-all border-none"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}

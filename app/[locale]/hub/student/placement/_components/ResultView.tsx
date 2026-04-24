"use client";

import { motion } from "framer-motion";
import { Trophy, BarChart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useTranslations } from "next-intl";

export interface PlacementResult {
  level: string;
  score: number | null;
  skillStats: Array<{ subject: string; score: number; fullMark: number }>;
  totalQuestions: number;
  correctAnswers: number;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
}

interface ResultViewProps {
  result: PlacementResult;
  onBack?: () => void;
  hideButtons?: boolean;
}

export const ResultView = ({ result, onBack, hideButtons = false }: ResultViewProps) => {
  const t = useTranslations("Placement");

  const startTime = result.startedAt ? new Date(result.startedAt).getTime() : 0;
  const endTime = result.completedAt ? new Date(result.completedAt).getTime() : 0;
  const avgTime = (startTime && endTime) 
    ? (endTime - startTime) / result.totalQuestions / 1000 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full text-center space-y-8 max-w-2xl mx-auto p-6"
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-64 h-64 bg-yellow-100 dark:bg-yellow-900/20 rounded-full blur-3xl opacity-50 animate-pulse" />
        </div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-xl flex items-center justify-center border-4 border-white dark:border-gray-800 mb-6">
            <Trophy className="h-16 w-16 text-white" />
          </div>

          <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">
            {t("estimatedLevel") || "Estimated Level"}
          </h2>
          <h1 className="text-7xl font-black text-foreground tracking-tighter mb-2">
            {result.level}
          </h1>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">
            {t("resultDesc", { count: result.correctAnswers, total: result.totalQuestions }) || 
             `You got ${result.correctAnswers} out of ${result.totalQuestions} questions correct!`}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div className="bg-white dark:bg-black p-4 rounded-2xl border-2 border-slate-100 dark:border-black/50 flex flex-col items-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mb-2">
            <BarChart className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
            {result.score ?? 0}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Elo Points
          </span>
        </div>
        <div className="bg-white dark:bg-black p-4 rounded-2xl border-2 border-slate-100 dark:border-black/50 flex flex-col items-center">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full mb-2">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">
            {avgTime.toFixed(1)}s
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase">
            Avg Speed
          </span>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-black rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-black/50 h-[320px] relative overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          {t("skillsAnalysis") || "Skills Analysis"}
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={result.skillStats}
          >
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Student"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={3}
              fill="#3b82f6"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {!hideButtons && onBack && (
        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold uppercase tracking-wider rounded-2xl bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all text-white"
            onClick={onBack}
          >
            {t("backToDashboard") || "Back to Dashboard"}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

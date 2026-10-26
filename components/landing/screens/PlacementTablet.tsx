"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AlertCircle, BarChart, CheckCircle2, Clock, Pause, Play, Trophy, X } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const SKILLS = ["grammar", "vocabulary", "reading", "listening"] as const;
type Skill = (typeof SKILLS)[number];

interface Q {
  level: number;
  skill: Skill;
  content: string;
  context?: string;
  options: string[];
  correct: number;
  audio?: boolean;
}

const TOTAL = 6;
const clamp = (n: number) => Math.max(0, Math.min(5, n));
const emptyStats = (): Record<Skill, [number, number]> => ({ grammar: [0, 0], vocabulary: [0, 0], reading: [0, 0], listening: [0, 0] });

/**
 * Design 820x1093. Imita TestView + ResultView do nivelamento real (barra verde, opções A/B/C com borda 3D,
 * barra de feedback estilo Duolingo, troféu e radar de habilidades). Lógica adaptativa simplificada, tudo em memória.
 */
export function PlacementTablet() {
  const t = useTranslations("LandingShowcase.PlacementTest");
  const BANK = t.raw("questions") as Q[];
  const [est, setEst] = useState(2);
  const [used, setUsed] = useState<number[]>([]);
  const [current, setCurrent] = useState<number>(() => BANK.findIndex((q) => q.level === 2));
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [answered, setAnswered] = useState(0);
  const [stats, setStats] = useState<Record<Skill, [number, number]>>(emptyStats);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  const q = BANK[current];
  const level = clamp(Math.round(est));
  const hits = Object.values(stats).reduce((a, [c]) => a + c, 0);

  const check = () => {
    if (sel === null) return;
    const ok = sel === q.correct;
    setChecked(ok);
    setStats((s) => ({ ...s, [q.skill]: [s[q.skill][0] + (ok ? 1 : 0), s[q.skill][1] + 1] }));
    setEst((e) => clamp(e + (ok ? 0.8 : -0.8)));
  };

  const next = () => {
    const nu = [...used, current];
    const count = answered + 1;
    setAnswered(count);
    if (count >= TOTAL) return setFinished(true);
    const target = clamp(Math.round(est));
    const pool = BANK.map((b, i) => ({ b, i })).filter(({ i }) => !nu.includes(i));
    pool.sort((a, b) => Math.abs(a.b.level - target) - Math.abs(b.b.level - target) || a.i - b.i);
    setUsed(nu);
    setCurrent(pool[0].i);
    setSel(null);
    setChecked(null);
    setPlaying(false);
  };

  const restart = () => {
    setEst(2);
    setUsed([]);
    setCurrent(BANK.findIndex((x) => x.level === 2));
    setSel(null);
    setChecked(null);
    setAnswered(0);
    setStats(emptyStats());
    setFinished(false);
  };

  if (finished) {
    const radar = SKILLS.map((s) => ({ subject: t(`skills.${s}`), score: stats[s][1] ? Math.round((stats[s][0] / stats[s][1]) * 100) : 40 }));
    return (
      <div className="relative w-full h-full bg-background text-foreground select-none overflow-hidden">
        <div className="w-full text-center space-y-8 max-w-2xl mx-auto p-6 pt-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-64 h-64 bg-yellow-100 dark:bg-yellow-900/20 rounded-full blur-3xl opacity-50 animate-pulse" />
            </div>
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-xl flex items-center justify-center border-4 border-white dark:border-gray-800 mb-6">
              <Trophy className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">{t("estimatedLevel")}</h2>
            <h1 className="text-7xl font-black tracking-tighter mb-2">{LEVELS[level]}</h1>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">{t("resultDesc", { hits, total: TOTAL })}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-white dark:bg-black p-4 rounded-2xl border-2 border-slate-100 dark:border-black/50 flex flex-col items-center">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mb-2"><BarChart className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
              <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{Math.round((hits / TOTAL) * 100)}%</span>
              <span className="text-xs font-bold text-slate-400 uppercase">{t("accuracy")}</span>
            </div>
            <div className="bg-white dark:bg-black p-4 rounded-2xl border-2 border-slate-100 dark:border-black/50 flex flex-col items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full mb-2"><Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
              <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{t("avgSeconds", { seconds: 18 })}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">{t("avgTime")}</span>
            </div>
          </div>

          <div className="w-full bg-white dark:bg-black rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-black/50 relative overflow-hidden flex flex-col items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start mb-1">{t("skillsAnalysis")}</h3>
            <RadarChart width={420} height={290} cx="50%" cy="50%" outerRadius="70%" data={radar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Student" dataKey="score" stroke="#2563eb" strokeWidth={3} fill="#3b82f6" fillOpacity={0.4} isAnimationActive={false} />
            </RadarChart>
          </div>

          <div className="space-y-3 pt-2">
            <Button size="lg" onClick={restart} className="w-full h-14 text-lg font-bold uppercase tracking-wider rounded-2xl bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all text-white">
              {t("retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-background text-foreground select-none overflow-hidden">
      <div className="flex flex-col items-center w-full max-w-5xl h-full mx-auto p-4 pt-8">
        <div className="w-full flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent" tabIndex={-1}><X className="h-6 w-6" /></Button>
          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative shadow-inner">
            <motion.div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" animate={{ width: `${((answered + (checked !== null ? 1 : 0)) / TOTAL) * 100}%` }} transition={{ type: "spring", stiffness: 50, damping: 20 }} />
            <div className="absolute top-1 left-2 h-1.5 w-full bg-white/20 rounded-full" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="w-full flex-1 flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-8">
                {q.audio && (
                  <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-gray-800 bg-card p-4 max-w-2xl mx-auto w-full">
                    <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={t("playAudio")} className="size-12 rounded-full bg-indigo-600 text-white grid place-items-center shrink-0">
                      {playing ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
                    </button>
                    <div className="flex-1 flex items-center gap-[3px] h-9">
                      {Array.from({ length: 40 }).map((_, i) => <span key={i} className={cn("flex-1 rounded-full bg-indigo-400/60", playing && "animate-pulse")} style={{ height: `${25 + ((i * 37) % 70)}%` }} />)}
                    </div>
                    <span className="text-xs text-muted-foreground">0:03</span>
                  </div>
                )}
                <h2 className="text-3xl font-black text-center leading-tight">{q.content}</h2>
                {q.context && <p className="mt-4 text-center text-muted-foreground font-medium text-lg italic">&quot;{q.context}&quot;</p>}
              </div>

              <div className="grid gap-3 max-w-2xl mx-auto w-full">
                {q.options.map((o, idx) => {
                  const isSelected = sel === idx;
                  return (
                    <button
                      key={o}
                      type="button"
                      disabled={checked !== null}
                      onClick={() => setSel(idx)}
                      className={cn(
                        "flex items-center p-5 rounded-2xl border-2 border-b-4 cursor-pointer transition-all active:scale-[0.98] w-full text-left",
                        isSelected
                          ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 dark:border-gray-800 bg-card hover:bg-accent hover:border-slate-300 text-foreground"
                      )}
                    >
                      <span className={cn("flex items-center justify-center w-8 h-8 rounded-lg border-2 mr-4 font-bold text-sm", isSelected ? "border-indigo-400 text-indigo-400" : "border-slate-200 dark:border-gray-700 text-slate-300")}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-bold text-xl flex-1">{o}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="w-full py-6 mt-auto flex flex-row gap-4">
          <Button variant="ghost" className="w-auto font-bold text-muted-foreground uppercase tracking-widest" disabled={checked !== null} onClick={() => { setSel(null); next(); }}>{t("skip")}</Button>
          <Button
            onClick={check}
            disabled={sel === null || checked !== null}
            className={cn(
              "flex-1 min-h-14 text-xl font-black uppercase tracking-wider rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all text-white",
              sel !== null ? "bg-green-500 hover:bg-green-600 border-green-700" : "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-900 text-gray-400"
            )}
          >
            {t("check")}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {checked !== null && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn("absolute bottom-0 left-0 right-0 p-8 z-50 border-t-2", checked ? "bg-green-100 border-green-200 dark:bg-green-900 dark:border-green-800" : "bg-red-100 border-red-200 dark:bg-red-800 dark:border-red-700")}
          >
            <div className="max-w-5xl mx-auto flex flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left w-full">
                <div className={cn("p-3 rounded-2xl text-white", checked ? "bg-green-500" : "bg-red-500")}>
                  {checked ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={cn("text-2xl font-black", checked ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>{checked ? t("correct") : t("incorrect")}</h3>
                  {!checked && (
                    <div className="mt-1">
                      <p className="text-red-600 dark:text-red-300 font-bold">{t("correctSolution")} </p>
                      <p className="text-red-700 dark:text-red-400 font-medium">{q.options[q.correct]}</p>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={next} className={cn("w-64 h-14 text-xl font-black uppercase tracking-wider rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all text-white", checked ? "bg-green-500 hover:bg-green-600 border-green-700" : "bg-red-500 hover:bg-red-600 border-red-700")}>
                {answered === TOTAL - 1 ? t("finish") : t("continue")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

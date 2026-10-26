"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { ArrowLeft, Bell, Brain, CheckCircle2, Clock, FileQuestion, Flame, Headphones, History, Image as ImageIcon, Lock, Play, RotateCcw, Shuffle, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneStatusBar } from "../devices";
import { useDateLocale } from "../date-locale";

/**
 * Página /hub/student/practice no celular: Header + XPHeader + Tabs (Prática / Roteiro / Histórico).
 * Markup copiado de page.tsx, XPHeader, LearningPath (janela de 3 dias do mobile) e RoadmapTimeline,
 * com dados fictícios e estado só em memória.
 */

type Tab = "practice" | "roadmap" | "history";

interface DayText {
  mode: string;
  tasks: string[];
}

/** Ícone e minutos de cada dia (dados; os textos vêm das messages). */
const DAY_META: { icon: React.ElementType; minutes: number[] }[] = [
  { icon: ImageIcon, minutes: [4, 3] },
  { icon: Headphones, minutes: [5, 5] },
  { icon: Shuffle, minutes: [6, 3] },
  { icon: Brain, minutes: [6, 2] },
  { icon: FileQuestion, minutes: [8, 4] },
  { icon: Headphones, minutes: [7, 5] },
];

/** Aulas do roteiro: status, dias praticados e data (mês 0-based, dia). Os títulos vêm das messages. */
const LESSON_META = [
  { status: "completed" as const, days: 6, date: [9, 6] },
  { status: "completed" as const, days: 6, date: [9, 13] },
  { status: "current" as const, days: 3, date: [9, 20] },
  { status: "future" as const, days: 0, date: [9, 27] },
  { status: "future" as const, days: 0, date: [10, 3] },
];

const HISTORY_DATES = [[9, 5], [8, 21]];
const XP_PER_DAY = 60;

function Node({ i, status, onClick, open }: { i: number; status: "completed" | "available" | "locked"; onClick: () => void; open: boolean }) {
  const t = useTranslations("LandingShowcase.PracticePage");
  const Icon = DAY_META[i].icon;
  return (
    <div className="flex flex-col items-center relative group z-10">
      <button type="button" onClick={onClick} aria-label={t("path.dayLabel", { n: i + 1 })} className={status === "locked" ? "cursor-default" : "cursor-pointer"}>
        <motion.div
          whileHover={status !== "locked" ? { scale: 1.1, translateY: -5 } : {}}
          whileTap={status !== "locked" ? { scale: 0.95 } : {}}
          className={cn(
            "rounded-[35px] flex items-center justify-center shadow-lg transition-all relative border-b-[6px] w-20 h-20",
            status === "completed" ? "bg-yellow-400 border-yellow-600 text-white" : status === "available" ? "bg-primary border-primary/80 text-white ring-8 ring-primary/20" : "bg-muted border-muted-foreground/20 text-muted-foreground/40",
            open && "outline-2 outline-offset-4 outline-primary"
          )}
        >
          {status === "completed" ? <Star size={28} fill="currentColor" className="text-yellow-100" /> : status === "locked" ? <Lock size={24} /> : <Icon size={28} strokeWidth={2.5} />}
          {status === "available" && (
            <motion.div initial={{ y: 0 }} animate={{ y: -10 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }} className="absolute -top-12 bg-white dark:bg-slate-200 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl border-2 border-primary/10 z-20 whitespace-nowrap">
              {t("path.today")}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-200 border-b-2 border-r-2 border-primary/10 rotate-45" />
            </motion.div>
          )}
          {status === "completed" && (
            <>
              <span className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border border-border"><RotateCcw size={12} className="text-muted-foreground" /></span>
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full px-1.5 py-0.5 leading-tight border-2 border-white">+{XP_PER_DAY}</span>
            </>
          )}
        </motion.div>
      </button>
      <div className={cn("mt-3 font-bold uppercase tracking-widest text-[10px]", status === "available" ? "text-primary" : "text-slate-500 dark:text-slate-600")}>{t("path.dayLabel", { n: i + 1 })}</div>
    </div>
  );
}

export function PracticePagePhone({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const t = useTranslations("LandingShowcase.PracticePage");
  const dateLocale = useDateLocale();
  const DAYS = t.raw("days") as DayText[];
  const lessons = t.raw("roadmap.lessons") as string[];
  const history = t.raw("history.items") as string[];
  const [done, setDone] = useState<boolean[][]>(() => DAY_META.map((d, i) => d.minutes.map(() => i < 2)));
  const [open, setOpen] = useState<number | null>(null);

  const completed = (i: number) => done[i].every(Boolean);
  const todayIdx = DAYS.findIndex((_, i) => !completed(i));
  const today = todayIdx === -1 ? DAYS.length - 1 : todayIdx;
  const status = (i: number) => (completed(i) ? "completed" : i === todayIdx ? "available" : "locked") as "completed" | "available" | "locked";
  const xp = 1280 + done.filter((d) => d.every(Boolean)).length * XP_PER_DAY;

  // janela de 3 dias, igual ao LearningPath mobile
  let start = today - 1;
  if (start < 0) start = 0;
  if (start > DAYS.length - 3) start = DAYS.length - 3;
  const windowDays = [start, start + 1, start + 2];

  const toggle = (di: number, ti: number) => {
    if (status(di) === "locked") return;
    setDone((prev) => prev.map((d, i) => (i === di ? d.map((v, k) => (k === ti ? !v : v)) : d)));
  };
  const sel = open !== null ? DAYS[open] : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-background text-foreground select-none overflow-hidden">
      <PhoneStatusBar />
      {/* Header (mobile) */}
      <div className="mt-11 h-12 flex items-center justify-between px-4 shrink-0">
        <span className="w-1/4"><ArrowLeft className="h-5 w-5" /></span>
        <h1 className="text-lg font-semibold tracking-tight truncate">{t("header.title")}</h1>
        <span className="w-1/4" />
      </div>
      <div className="px-4 pt-2 flex flex-col w-full shrink-0">
        <h1 className="text-xl font-bold tracking-tight">{t("header.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("header.description")}</p>
      </div>

      <div className="px-4 pt-4 space-y-6 flex-1 min-h-0 overflow-hidden">
        {/* XPHeader */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 border-4 border-background shadow-sm rounded-2xl bg-primary text-primary-foreground font-black text-xl grid place-items-center">{t("profile.name").charAt(0)}</span>
              <div>
                <h2 className="text-lg font-black text-foreground">{t("profile.name")}</h2>
                <p className="text-sm text-muted-foreground">{t("profile.role")}</p>
              </div>
            </div>
            <span className="rounded-full h-10 w-10 grid place-items-center"><Bell className="w-5 h-5 text-primary fill-primary/10" /></span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-orange-500/10 p-3 rounded-md border border-orange-500/20">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20"><Flame className="w-6 h-6 text-white fill-white" /></div>
              <div><span className="block text-2xl font-black text-orange-600 leading-none">12</span><span className="text-[9px] font-bold uppercase text-orange-600/70 tracking-wider">{t("profile.streak")}</span></div>
            </div>
            <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-md border border-primary/20">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20"><Trophy className="w-6 h-6 text-white" /></div>
              <div><span className="block text-2xl font-black text-primary leading-none">{xp}</span><span className="text-[9px] font-bold uppercase text-primary/70 tracking-wider">{t("profile.xp")}</span></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-md">
          {(["practice", "roadmap", "history"] as const).map((id) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)} className={cn("rounded-lg font-bold text-xs py-2 border border-transparent transition-all", tab === id ? "bg-background text-foreground shadow-sm" : "text-foreground/60")}>{t(`tabs.${id}`)}</button>
          ))}
        </div>

        {tab === "practice" && (
          <div className="flex flex-col items-center pt-0">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-black">{t("path.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("path.subtitle", { day: today + 1, total: DAYS.length, plan: t("path.planName") })}</p>
            </div>
            <div className="w-full flex flex-col">
              <div className="flex flex-row justify-between items-center mt-3 px-4">
                <div />
                <span className="text-lg font-bold text-primary">{t("path.label")}</span>
                <History size={20} className="text-muted-foreground" />
              </div>
              <div className="w-full relative flex flex-col items-center pt-14 pb-4">
                <div className="relative flex items-center justify-center gap-6">
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-primary/10 -z-10 -translate-y-1/2 rounded-full" />
                  {windowDays.map((i) => <Node key={i} i={i} status={status(i)} open={open === i} onClick={() => setOpen(open === i ? null : i)} />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "roadmap" && (
          <div>
            <div className="mb-4 flex flex-col items-center text-center">
              <h2 className="text-xl font-black">{t("roadmap.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("roadmap.subtitle")}</p>
            </div>
            <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {LESSON_META.map((l, li) => {
                const cur = l.status === "current";
                const comp = l.status === "completed";
                const fut = l.status === "future";
                return (
                  <div key={li} className="relative">
                    <div className={cn("absolute -left-[25px] top-1 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center z-10", comp ? "bg-primary text-primary-foreground" : cur ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>
                      {comp ? <CheckCircle2 className="w-5 h-5" /> : cur ? <Play className="w-4 h-4 fill-current" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className={cn("p-4 rounded-md border transition-all duration-200", cur ? "bg-card border-primary shadow-sm ring-1 ring-primary/20" : "bg-card/50 border-border")}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className={cn("font-bold text-base", fut && "text-muted-foreground")}>{lessons[li]}</h3>
                          <p className="text-xs text-muted-foreground">{format(new Date(2026, l.date[0], l.date[1]), t("dates.weekdayDay"), { locale: dateLocale })}</p>
                        </div>
                        {cur && <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded-full">{t("roadmap.current")}</span>}
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-muted-foreground"><span>{t("roadmap.adaptive")}</span><span>{t("roadmap.daysProgress", { done: l.days, total: DAYS.length })}</span></div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${(l.days / DAYS.length) * 100}%` }} /></div>
                      </div>
                      {cur && <span className="mt-3 flex w-full h-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">{t("roadmap.continue")}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "history" && (
          <div>
            <div className="mb-4 flex flex-col items-center text-center">
              <h2 className="text-xl font-black">{t("history.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("history.subtitle")}</p>
            </div>
            {history.map((title, hi) => (
              <div key={hi} className="mb-3 flex flex-col border border-foreground/10 rounded-md bg-muted/50 p-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("history.completedOn", { date: format(new Date(2026, HISTORY_DATES[hi][0], HISTORY_DATES[hi][1]), t("dates.day"), { locale: dateLocale }) })}</span>
                <span className="text-sm font-bold">{title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* bottom sheet com as tarefas do dia (no padrão do Vault) */}
      <AnimatePresence>
        {sel && open !== null && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 240 }} className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-border bg-background shadow-[0_-10px_30px_rgba(0,0,0,0.15)] px-5 pb-6">
            <div className="mx-auto mt-4 mb-3 h-1.5 w-14 shrink-0 rounded-full bg-primary/50" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{t("path.dayLabel", { n: open + 1 })}</p>
                <p className="text-sm text-muted-foreground">{sel.mode}</p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{t("sheet.total", { min: DAY_META[open].minutes.reduce((a, m) => a + m, 0) })}</span>
            </div>
            {status(open) === "locked" ? (
              <p className="mt-4 rounded-md bg-muted/50 border p-3 text-sm text-muted-foreground flex gap-2"><Lock className="size-4 shrink-0 mt-0.5" />{t("sheet.locked")}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {sel.tasks.map((task, ti) => (
                  <li key={ti}>
                    <button type="button" onClick={() => toggle(open, ti)} className="w-full flex items-center gap-3 rounded-md border border-border bg-card px-3 py-3 text-left">
                      <span className={cn("size-6 rounded-full border-2 grid place-items-center shrink-0 transition-colors", done[open][ti] ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/40")}>{done[open][ti] && <CheckCircle2 className="size-4" />}</span>
                      <span className={cn("flex-1 text-sm font-semibold", done[open][ti] && "line-through text-muted-foreground")}>{task}</span>
                      <span className="text-xs text-muted-foreground">{t("sheet.minutes", { min: DAY_META[open].minutes[ti] })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {status(open) === "completed" && <p className="mt-3 text-center text-sm font-bold text-emerald-600">{t("sheet.done", { xp: XP_PER_DAY })}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

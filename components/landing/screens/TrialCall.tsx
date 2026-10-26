"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Save, Target, ThumbsUp, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TEACHER_PHOTO = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80";
const STUDENT_PHOTO = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80";
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{children}</span>;
}

/** Design 1280x800: videochamada da aula experimental + anotações do professor (mock estático; a página real ainda será criada). */
export function TrialCall() {
  const t = useTranslations("LandingShowcase.TrialCall");
  const goals = t.raw("goals") as string[];
  const strengths = t.raw("strengths") as string[];
  const improve = t.raw("improve") as string[];
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground select-none">
      <div className="h-11 shrink-0 flex items-center gap-2 px-4 bg-muted border-b border-border">
        <span className="size-3 rounded-full bg-red-400" />
        <span className="size-3 rounded-full bg-amber-400" />
        <span className="size-3 rounded-full bg-emerald-400" />
        <div className="ml-4 flex-1 max-w-md h-7 rounded-full bg-background border border-border px-4 flex items-center text-xs text-muted-foreground">fluencylab.app/trial-class/marina</div>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_400px]">
        <div className="relative bg-slate-950 flex flex-col p-5 gap-4">
          <div className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2 text-sm font-bold"><span className="size-2.5 rounded-full bg-red-500 animate-pulse" />{t("classTimer", { time: "12:40" })}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{t("captionsOn")}</span>
          </div>
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-800">
            <Image src={TEACHER_PHOTO} alt={t("teacherName")} fill sizes="800px" className="object-cover object-top" />
            <span className="absolute left-4 bottom-4 rounded-full bg-black/60 text-white text-sm font-bold px-3 py-1">{t("teacherLabel")}</span>
            <div className="absolute right-4 bottom-4 w-52 aspect-video rounded-xl overflow-hidden border-2 border-white/40 bg-gradient-to-br from-violet-600 to-indigo-800 grid place-items-center">
              {cam ? <Image src={STUDENT_PHOTO} alt={t("studentName")} fill sizes="208px" className="object-cover" /> : <CameraOff className="text-white/60" />}
              <span className="absolute left-2 bottom-2 rounded-full bg-black/60 text-white text-[11px] font-bold px-2 py-0.5">{t("studentName")}</span>
            </div>
            <div className="absolute left-4 right-64 bottom-14 rounded-lg bg-black/65 text-white text-lg px-4 py-2">{t("caption")}</div>
          </div>
          <div className="flex justify-center gap-3">
            <button type="button" aria-label={t("mic")} onClick={() => setMic((v) => !v)} className={cn("p-3.5 rounded-full text-white", mic ? "bg-white/15 hover:bg-white/25" : "bg-red-500")}>
              {mic ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button type="button" aria-label={t("camera")} onClick={() => setCam((v) => !v)} className={cn("p-3.5 rounded-full text-white", cam ? "bg-white/15 hover:bg-white/25" : "bg-red-500")}>
              {cam ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>
            <span className="p-3.5 rounded-full bg-red-500 text-white"><PhoneOff size={20} /></span>
          </div>
        </div>

        <aside className="border-l border-border bg-card p-6 flex flex-col gap-5 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black">{t("notesTitle")}</h3>
            <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Save size={14} />{t("autosaved")}</span>
          </div>
          <section>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2"><Target size={14} />{t("goal")}</p>
            <div className="flex flex-wrap gap-2">{goals.map((g) => <Pill key={g}>{g}</Pill>)}</div>
          </section>
          <section>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2"><TrendingUp size={14} />{t("level")}</p>
            <div className="flex items-center gap-4 rounded-xl border border-border p-3">
              <span className="text-4xl font-black text-primary">B1</span>
              <div className="flex-1"><div className="h-2 rounded-full bg-muted"><div className="h-full w-[52%] rounded-full bg-primary" /></div><div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-1">{LEVELS.map((l) => <span key={l}>{l}</span>)}</div></div>
            </div>
          </section>
          <section>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2"><ThumbsUp size={14} />{t("strengthsTitle")}</p>
            <ul className="space-y-1.5 text-base">{strengths.map((s) => <li key={s} className="flex gap-2"><span className="text-emerald-500">●</span>{s}</li>)}</ul>
          </section>
          <section>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2"><X size={14} />{t("improveTitle")}</p>
            <ul className="space-y-1.5 text-base">{improve.map((s) => <li key={s} className="flex gap-2"><span className="text-amber-500">●</span>{s}</li>)}</ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

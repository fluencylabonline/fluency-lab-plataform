"use client";

import { createContext, useContext, useMemo, useReducer, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { ArrowLeft, BookOpen, Calendar, Check, Clock, Info, RotateCcw, ShieldCheck, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PhoneStatusBar } from "../devices";
import { useDateLocale } from "../date-locale";

/* ───────────────────────── estado (só em memória) ───────────────────────── */

const dt = (m: number, day: number, h: number, min = 0) => new Date(2026, m, day, h, min);
const TEACHER = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80";
const LIMIT = 2;

type Status = "scheduled" | "canceled" | "rescheduled";
/** `subject` é o índice do assunto em Schedule.subjects (o texto vem das messages). */
interface ClassItem { id: string; start: Date; subject: number; status: Status }
interface Slot { id: string; start: Date }

interface State {
  classes: ClassItem[];
  bonus: number;
  left: number;
}

const OPEN_SLOTS: Slot[] = [
  { id: "s1", start: dt(9, 28, 18) },
  { id: "s2", start: dt(9, 30, 20) },
  { id: "s3", start: dt(10, 2, 19, 30) },
];

const INITIAL: State = {
  classes: [
    { id: "c1", start: dt(9, 27, 19), subject: 0, status: "scheduled" },
    { id: "c2", start: dt(9, 29, 19), subject: 1, status: "scheduled" },
    { id: "c3", start: dt(10, 3, 19), subject: 2, status: "scheduled" },
    { id: "c4", start: dt(10, 5, 19), subject: 3, status: "scheduled" },
    { id: "c5", start: dt(10, 10, 19), subject: 4, status: "scheduled" },
  ],
  bonus: 1,
  left: 1,
};

type Action =
  | { type: "cancel"; id: string }
  | { type: "reschedule"; id: string; slot: Slot };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "cancel":
      return { ...s, classes: s.classes.map((c) => (c.id === a.id ? { ...c, status: "canceled" } : c)) };
    case "reschedule": {
      const c = s.classes.find((x) => x.id === a.id);
      if (!c) return s;
      const fromCanceled = c.status === "canceled";
      // Sem saldo, a demonstração deixa reagendar e volta os números ao início.
      const enough = fromCanceled ? s.bonus > 0 : s.left > 0;
      return {
        ...s,
        classes: s.classes.map((x): ClassItem => (x.id === a.id ? { ...x, start: a.slot.start, status: "rescheduled" } : x)).sort((p, q) => p.start.getTime() - q.start.getTime()),
        bonus: !enough ? INITIAL.bonus : fromCanceled ? s.bonus - 1 : s.bonus,
        left: !enough ? INITIAL.left : fromCanceled ? s.left : s.left - 1,
      };
    }
  }
}

interface Ctx { s: State; dispatch: (a: Action) => void }
const SchedCtx = createContext<Ctx | null>(null);
const useSched = () => {
  const c = useContext(SchedCtx);
  if (!c) throw new Error("ScheduleProvider ausente");
  return c;
};

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, INITIAL);
  const v = useMemo(() => ({ s, dispatch }), [s]);
  return <SchedCtx.Provider value={v}>{children}</SchedCtx.Provider>;
}

/* ───────────────────────── peças de UI (padrão Vault) ───────────────────────── */

function Vault({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const t = useTranslations("LandingShowcase.Schedule");
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button type="button" aria-label={t("close")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute bottom-0 inset-x-0 z-50 flex flex-col bg-background border border-gray-200/50 dark:border-gray-700/50 rounded-t-[20px] max-h-[90%]">
            <div className="mx-auto mt-4 mb-2 h-1.5 w-14 shrink-0 rounded-full bg-primary/50" />
            <div className="px-6 pb-6 pt-2 overflow-hidden">
              <h3 className="text-xl font-bold text-center leading-tight tracking-tight mb-5">{title}</h3>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Btn({ children, onClick, variant = "default", disabled }: { children: ReactNode; onClick?: () => void; variant?: "default" | "secondary" | "destructive"; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-center gap-2 px-7 py-3 text-sm font-semibold rounded-md transition-all disabled:opacity-50",
        variant === "default" && "bg-primary text-white",
        variant === "destructive" && "bg-destructive text-white",
        variant === "secondary" && "text-gray-700 dark:text-gray-300 bg-slate-300/50 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-600/50"
      )}
    >
      {children}
    </motion.button>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-full bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
      <div className="flex flex-col"><span className="text-xs text-muted-foreground">{label}</span><span className="text-sm font-medium">{children}</span></div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations("LandingShowcase.Schedule");
  const styles: Record<Status, string> = {
    scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    rescheduled: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    canceled: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-tighter", styles[status])}>{t(`status.${status}`)}</Badge>;
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/* ───────────────────────── Agenda do aluno ───────────────────────── */

type View = null | { k: "detail" | "cancel" | "reschedule" | "confirm"; id: string };

/** Design 430x900: lista de aulas por mês + créditos e reagendamentos do mês. Sem calendário. */
export function StudentSchedulePhone() {
  const t = useTranslations("LandingShowcase.Schedule");
  const dateLocale = useDateLocale();
  const subjects = t.raw("subjects") as string[];
  const { s, dispatch } = useSched();
  const [view, setView] = useState<View>(null);
  const [pick, setPick] = useState<string | null>(null);

  const cls = s.classes.find((c) => c.id === view?.id);
  const slot = OPEN_SLOTS.find((x) => x.id === pick);
  const close = () => { setView(null); setPick(null); };

  const months = s.classes.reduce<Record<string, ClassItem[]>>((acc, c) => {
    (acc[format(c.start, "yyyy-MM")] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="relative w-full h-full flex flex-col bg-background text-foreground select-none overflow-hidden">
      <PhoneStatusBar />
      <header className="mt-11 flex h-12 w-full items-center justify-between px-4 shrink-0">
        <div className="flex items-center w-1/4"><ArrowLeft className="h-5 w-5" /></div>
        <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
        <div className="w-1/4" />
      </header>

      <div className="px-4 pt-2 flex-1 min-h-0 overflow-hidden space-y-5">
        {/* créditos e reagendamentos do mês */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-md border border-purple-500/20 bg-purple-500/10 p-3">
              <span className="size-10 rounded-lg bg-purple-500 grid place-items-center"><Ticket className="size-5 text-white" /></span>
              <div><span className="block text-2xl font-black leading-none text-purple-600">{s.bonus}</span><span className="text-[9px] font-bold uppercase tracking-wider text-purple-600/70">{t("credits")}</span></div>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
              <span className="size-10 rounded-lg bg-amber-500 grid place-items-center"><RotateCcw className="size-5 text-white" /></span>
              <div><span className="block text-2xl font-black leading-none text-amber-600">{s.left}<span className="text-sm font-bold">/{LIMIT}</span></span><span className="text-[9px] font-bold uppercase tracking-wider text-amber-600/70">{t("reschedulesLeft")}</span></div>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5 shrink-0" />{t("creditsHint")}</p>
        </div>

        {Object.entries(months).map(([k, list]) => (
          <section key={k}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">{format(list[0].start, t("dates.month"), { locale: dateLocale })}</h2>
              <span className="text-[10px] font-bold text-muted-foreground">{t("classCount", { count: list.length })}</span>
            </div>
            <div className="flex flex-col gap-3">
              {list.map((c) => (
                <button key={c.id} type="button" onClick={() => setView({ k: "detail", id: c.id })} className="flex items-center gap-4 rounded-md border border-foreground/15 bg-foreground/5 p-3 text-left transition-colors hover:bg-foreground/10">
                  <div className={cn("flex w-14 shrink-0 flex-col items-center rounded-md py-1.5", c.status === "canceled" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                    <span className="text-xl font-black leading-none">{format(c.start, "d")}</span>
                    <span className="text-[10px] font-bold uppercase">{format(c.start, "EEE", { locale: dateLocale })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-bold", c.status === "canceled" && "line-through text-muted-foreground")}>{subjects[c.subject]}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{format(c.start, "HH:mm")}</span>
                      <span className="flex items-center gap-1"><User className="size-3" />{t("teacher")}</span>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Vault open={view?.k === "detail" && !!cls} onClose={close} title={cls ? subjects[cls.subject] : ""}>
        {cls && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <InfoRow icon={BookOpen} label={t("subject")}>{subjects[cls.subject]}</InfoRow>
              <div className="flex items-center gap-3">
                <span className="size-9 overflow-hidden rounded-full bg-muted relative"><Image src={TEACHER} alt={t("teacher")} fill sizes="36px" className="object-cover" /></span>
                <div className="flex flex-col"><span className="text-xs text-muted-foreground">{t("teacherLabel")}</span><span className="text-sm font-medium">{t("teacher")}</span></div>
              </div>
              <InfoRow icon={Calendar} label={t("date")}>{cap(format(cls.start, t("dates.weekdayDay"), { locale: dateLocale }))}</InfoRow>
              <InfoRow icon={Clock} label={t("time")}>{format(cls.start, "HH:mm")}</InfoRow>
            </div>
            <div className="flex flex-col gap-3 border-t pt-4">
              {cls.status === "canceled" && <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-400"><Info className="mt-0.5 size-4 shrink-0" />{t("canceledNotice")}</div>}
              <Btn onClick={() => setView({ k: "reschedule", id: cls.id })}>{t("reschedule")}</Btn>
              {cls.status !== "canceled" && <Btn variant="secondary" onClick={() => setView({ k: "cancel", id: cls.id })}>{t("cancel")}</Btn>}
            </div>
          </div>
        )}
      </Vault>

      <Vault open={view?.k === "cancel"} onClose={() => view && setView({ k: "detail", id: view.id })} title={t("cancelTitle")}>
        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">{t("cancelBody")}</p>
          <Btn variant="destructive" onClick={() => { if (view) dispatch({ type: "cancel", id: view.id }); close(); }}>{t("cancelConfirm")}</Btn>
          <Btn variant="secondary" onClick={() => view && setView({ k: "detail", id: view.id })}>{t("back")}</Btn>
        </div>
      </Vault>

      <Vault open={view?.k === "reschedule" || view?.k === "confirm"} onClose={close} title={view?.k === "confirm" ? t("confirmTitle") : t("rescheduleTitle")}>
        {view?.k === "reschedule" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">{t("pickSlot")}</p>
            <div className="flex flex-col gap-2 rounded-md border p-2">
              {OPEN_SLOTS.map((o) => (
                <button key={o.id} type="button" onClick={() => setPick(o.id)} className={cn("flex items-center justify-between rounded-md border p-3 text-left", pick === o.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border")}>
                  <span className="flex flex-col"><span className="text-sm font-medium">{cap(format(o.start, t("dates.weekdayDay"), { locale: dateLocale }))}</span><span className="text-xs text-muted-foreground">{format(o.start, "HH:mm")}</span></span>
                  {pick === o.id && <Check className="size-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t pt-2">
              <Btn disabled={!pick} onClick={() => setView({ k: "confirm", id: view.id })}>{t("continue")}</Btn>
              <Btn variant="secondary" onClick={() => setView({ k: "detail", id: view.id })}>{t("back")}</Btn>
            </div>
          </div>
        )}
        {view?.k === "confirm" && cls && slot && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border bg-muted/20 p-4"><p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("originalClass")}</p><p className="text-sm font-medium">{cap(format(cls.start, t("dates.weekdayDayTime"), { locale: dateLocale }))}</p></div>
            <div className="flex justify-center"><div className="rounded-full bg-primary/10 p-2"><Clock className="size-5 rotate-180 text-primary" /></div></div>
            <div className="rounded-md border border-primary bg-primary/5 p-4 ring-1 ring-primary"><p className="mb-2 text-xs font-bold uppercase text-primary">{t("newDate")}</p><p className="text-sm font-bold">{cap(format(slot.start, t("dates.weekdayDayTime"), { locale: dateLocale }))}</p></div>
            <p className="px-4 text-center text-xs text-muted-foreground">{cls.status === "canceled" ? t("costCredit") : t("costReschedule")}</p>
            <div className="flex flex-col gap-3 border-t pt-2">
              <Btn onClick={() => { dispatch({ type: "reschedule", id: cls.id, slot }); close(); }}>{t("confirmTitle")}</Btn>
              <Btn variant="secondary" onClick={() => setView({ k: "reschedule", id: cls.id })}>{t("back")}</Btn>
            </div>
          </div>
        )}
      </Vault>
    </div>
  );
}

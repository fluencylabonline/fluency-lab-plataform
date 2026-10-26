"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Bold, Italic, Underline, List, ListOrdered, Highlighter, ChevronLeft, ChevronDown, Undo2, Redo2,
  Sparkles, GraduationCap, Settings, Mic, MicOff, Camera, CameraOff, PhoneOff, Users,
  Aperture, MonitorUp, Minimize2, Maximize2, LogOut, MoreVertical, Heading, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneStatusBar } from "../devices";

const TEACHER = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80";
const STUDENT = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80";

type Actor = "student" | "teacher" | null;

interface CollabState {
  fixFrom: string;
  sentence: string;
  note: string;
  highlight: boolean;
  actor: Actor;
}

const Ctx = createContext<CollabState | null>(null);
const useCollab = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("CollabProvider ausente");
  return c;
};

/**
 * Documento da aula em loop (só em memória): o aluno digita a frase, a professora destaca o erro,
 * corrige e comenta. Sem interação do visitante. Com prefers-reduced-motion fica parado, já corrigido.
 */
export function CollabProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("LandingShowcase.Collab");
  const reduced = useReducedMotion();
  const INITIAL = t("sentence");
  const FIX_FROM = t("fixFrom");
  const FIX_TO = t("fixTo");
  const NOTE_AFTER_FIX = t("note");
  const [sentence, setSentence] = useState("");
  const [note, setNote] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [actor, setActor] = useState<Actor>(null);

  useEffect(() => {
    if (reduced) return;
    const ids: ReturnType<typeof setTimeout>[] = [];
    let dead = false;
    const sleep = (ms: number) =>
      new Promise<void>((res) => {
        ids.push(setTimeout(res, ms));
      });
    const type = async (text: string, set: (s: string) => void, speed = 45) => {
      for (let i = 1; i <= text.length; i++) {
        if (dead) return;
        set(text.slice(0, i));
        await sleep(speed);
      }
    };

    (async () => {
      while (!dead) {
        setSentence("");
        setNote("");
        setHighlight(false);
        setActor("student");
        await sleep(1200);
        await type(INITIAL, setSentence, 60);
        await sleep(1000);
        setActor("teacher");
        setHighlight(true);
        await sleep(1200);
        const at = INITIAL.indexOf(FIX_FROM);
        for (let k = FIX_FROM.length; k >= 0; k--) {
          if (dead) return;
          setSentence(INITIAL.slice(0, at) + FIX_FROM.slice(0, k) + INITIAL.slice(at + FIX_FROM.length));
          await sleep(70);
        }
        const rest = INITIAL.slice(at + FIX_FROM.length);
        await type(FIX_TO, (s) => setSentence(INITIAL.slice(0, at) + s + rest), 100);
        await sleep(500);
        setHighlight(false);
        await type(NOTE_AFTER_FIX, setNote, 40);
        await sleep(7000);
      }
    })();

    return () => {
      dead = true;
      ids.forEach(clearTimeout);
    };
  }, [reduced, INITIAL, FIX_FROM, FIX_TO, NOTE_AFTER_FIX]);

  const frozen = !!reduced;
  const value = useMemo(
    () => ({
      fixFrom: FIX_FROM,
      sentence: frozen ? INITIAL.replace(FIX_FROM, FIX_TO) : sentence,
      note: frozen ? NOTE_AFTER_FIX : note,
      highlight,
      actor,
    }),
    [frozen, sentence, note, highlight, actor, FIX_FROM, FIX_TO, INITIAL, NOTE_AFTER_FIX]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function Cursor({ name, color }: { name: string; color: string }) {
  return (
    <span className="relative inline-block w-0 align-baseline pointer-events-none">
      <span
        className="absolute bottom-full left-0 mb-0.5 whitespace-nowrap rounded-t rounded-br px-1.5 py-0.5 text-[11px] font-bold text-white leading-none"
        style={{ background: color }}
      >
        {name}
      </span>
      <span className="absolute left-0 -top-4 block w-0.5 h-6 animate-pulse" style={{ background: color }} />
    </span>
  );
}

/** Frase do aluno com o trecho destacado quando o professor está corrigindo. */
function Sentence({ cursorOn }: { cursorOn: boolean }) {
  const t = useTranslations("LandingShowcase.Collab");
  const { sentence, highlight, actor, fixFrom } = useCollab();
  const at = sentence.indexOf(fixFrom);
  const showMark = highlight && at >= 0;
  return (
    <>
      {showMark ? (
        <>
          {sentence.slice(0, at)}
          <span className="relative bg-yellow-200 dark:bg-yellow-900/50 rounded-sm px-0.5">
            {fixFrom}
            <Cursor name={t("teacher")} color="#4f46e5" />
          </span>
          {sentence.slice(at + fixFrom.length)}
        </>
      ) : (
        sentence
      )}
      {cursorOn && actor === "student" && <Cursor name={t("student")} color="#10b981" />}
      {cursorOn && actor === "teacher" && !showMark && <Cursor name={t("teacher")} color="#4f46e5" />}
    </>
  );
}

function Note({ small }: { small?: boolean }) {
  const t = useTranslations("LandingShowcase.Collab");
  const { note } = useCollab();
  if (!note) return null;
  return (
    <div className="rounded-r-xl border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">{t("commentBy", { teacher: t("teacher") })}</p>
      <p className={cn("italic text-muted-foreground mt-1", small ? "text-[15px]" : "text-base")}>{note}</p>
    </div>
  );
}

function ToolBtn({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span className={cn("h-8 min-w-8 px-1.5 rounded-md flex items-center justify-center text-muted-foreground", active && "bg-primary/10 text-primary")}>
      {children}
    </span>
  );
}

/* ───────── Chamada: mesmas peças do módulo real (MyUILayout / ControlButton / ParticipantsGrid) ───────── */

/** Igual ao ControlButton real: círculo cinza; vermelho quando desligado ou "destructive". */
function CtrlBtn({ icon: Icon, off, destructive, onClick, label, className }: { icon: React.ElementType; off?: boolean; destructive?: boolean; onClick?: () => void; label: string; className?: string }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "p-3 rounded-full transition-all flex items-center justify-center shrink-0",
        destructive || off ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300",
        className
      )}
    >
      <Icon size={20} />
    </motion.button>
  );
}

/** Quadro de participante (call-participant-frame): foto ou avatar, nome embaixo e anel índigo de quem fala. */
function Tile({ name, photo, initial, speaking, muted, cam = true, className }: { name: string; photo?: string; initial?: string; speaking?: boolean; muted?: boolean; cam?: boolean; className?: string }) {
  return (
    <div className={cn("relative w-full aspect-video rounded-md overflow-hidden bg-slate-900", className)}>
      {photo && cam ? (
        <Image src={photo} alt={name} fill sizes="340px" className="object-cover object-top" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-slate-800">
          <span className="size-16 rounded-full bg-indigo-500 text-white text-2xl font-bold grid place-items-center">{initial ?? name[0]}</span>
        </div>
      )}
      <span className="absolute left-2 bottom-2 flex items-center gap-1 rounded bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
        {muted && <MicOff size={11} className="text-red-400" />}
        {name}
      </span>
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-shadow duration-150"
        style={{ boxShadow: speaking ? "inset 0 0 0 3px #6366f1, inset 0 0 18px 2px rgba(99,102,241,.55)" : "inset 0 0 0 0 transparent" }}
      />
    </div>
  );
}

function CcBadge() {
  const t = useTranslations("LandingShowcase.Collab");
  return (
    <span className="absolute top-3 left-3 z-20 flex items-center gap-1 rounded-full border border-white/10 bg-indigo-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
      <span className="size-1.5 rounded-full bg-white animate-pulse" />{t("captions")}
    </span>
  );
}

/** Miniatura flutuante (PiP): toque mostra Maximizar + mic/câmera, como no MyUILayout. */
function Pip({ remote, className, onMax, mic, cam, setMic, setCam }: { remote: ReactNode; className?: string; onMax: () => void; mic: boolean; cam: boolean; setMic: () => void; setCam: () => void }) {
  const t = useTranslations("LandingShowcase.Collab");
  const [ctl, setCtl] = useState(false);
  return (
    <motion.div
      drag
      dragMomentum={false}
      onTap={() => setCtl((v) => !v)}
      className={cn("absolute z-30 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl cursor-grab active:cursor-grabbing", className)}
    >
      <div className="relative size-full bg-slate-900 pointer-events-none">{remote}</div>
      {ctl && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between bg-black/40 p-2">
          <div className="flex justify-end">
            <button type="button" aria-label={t("controls.maximize")} onPointerDownCapture={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onMax(); }} className="rounded-full bg-black/50 p-1.5 text-white"><Maximize2 size={16} /></button>
          </div>
          <div className="flex items-center justify-center gap-2" onPointerDownCapture={(e) => e.stopPropagation()}>
            <button type="button" aria-label={t("controls.mic")} onClick={(e) => { e.stopPropagation(); setMic(); }} className={cn("rounded-full p-2 text-white", mic ? "bg-slate-800" : "bg-red-500")}>{mic ? <Mic size={14} /> : <MicOff size={14} />}</button>
            <button type="button" aria-label={t("controls.camera")} onClick={(e) => { e.stopPropagation(); setCam(); }} className={cn("rounded-full p-2 text-white", cam ? "bg-slate-800" : "bg-red-500")}>{cam ? <Camera size={14} /> : <CameraOff size={14} />}</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/** Painel de vidro da chamada (getGlassContainerClasses): participantes empilhados + barra de controles. */
function GlassPanel({ children, controls, className }: { children: ReactNode; controls: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className={cn("absolute z-30 flex flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/80 dark:bg-black/60 backdrop-blur-xl saturate-150 shadow-2xl shadow-black/15 text-slate-800 dark:text-slate-100", className)}
    >
      <div className="relative flex-1 overflow-hidden p-2">
        <CcBadge />
        <div className="flex flex-col gap-2">{children}</div>
      </div>
      <div className="rounded-b-3xl border-t border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-slate-900/50">{controls}</div>
    </motion.div>
  );
}

/** Design 1280x800: página /notebook do professor, com o painel da chamada acoplado à direita. */
export function HeroLaptopScreen() {
  const t = useTranslations("LandingShowcase.Collab");
  const { actor } = useCollab();
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [pip, setPip] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col bg-background text-foreground select-none overflow-hidden">
      <div className="h-11 shrink-0 flex items-center gap-2 px-4 bg-muted border-b border-border">
        <span className="size-3 rounded-full bg-red-400" />
        <span className="size-3 rounded-full bg-amber-400" />
        <span className="size-3 rounded-full bg-emerald-400" />
        <div className="ml-4 flex-1 max-w-md h-7 rounded-full bg-background border border-border px-4 flex items-center text-xs text-muted-foreground">
          fluencylab.app/notebook/weekend-story
        </div>
      </div>

      <div className="shrink-0 mx-6 mt-5 flex items-center gap-1 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
        <ToolBtn><ChevronLeft size={18} /></ToolBtn>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolBtn><Undo2 size={16} /></ToolBtn>
        <ToolBtn><Redo2 size={16} /></ToolBtn>
        <span className="w-px h-5 bg-border mx-1" />
        <span className="h-8 px-2 rounded-md flex items-center gap-1 text-sm font-medium text-muted-foreground">{t("paragraph")} <ChevronDown size={14} /></span>
        <ToolBtn active><Bold size={16} /></ToolBtn>
        <ToolBtn><Italic size={16} /></ToolBtn>
        <ToolBtn><Underline size={16} /></ToolBtn>
        <ToolBtn><Highlighter size={16} /></ToolBtn>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolBtn><List size={16} /></ToolBtn>
        <ToolBtn><ListOrdered size={16} /></ToolBtn>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Users size={14} /> {t("teacherView")}</span>
          <div className="flex -space-x-2">
            <span className="size-8 rounded-full border-2 border-card overflow-hidden bg-muted">
              <Image src={TEACHER} alt={t("teacher")} width={32} height={32} className="object-cover size-full" />
            </span>
            <span className="size-8 rounded-full border-2 border-card bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">{t("student").charAt(0)}</span>
          </div>
          <ToolBtn><Sparkles size={17} className="text-amber-500" /></ToolBtn>
          <ToolBtn><GraduationCap size={17} className="text-indigo-500" /></ToolBtn>
          <ToolBtn><Settings size={17} /></ToolBtn>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-6 pt-5 pb-6">
        <div className="h-full rounded-2xl border border-border bg-card shadow-sm px-14 py-9 overflow-hidden">
          <h1 className="text-4xl font-bold tracking-tight mb-6">{t("docTitle")}</h1>
          <div className="space-y-5 text-2xl leading-relaxed max-w-[560px]">
            <p><span className="text-muted-foreground">{t("teacher")}:</span> {t("prompt")}</p>
            <p><span className="text-muted-foreground">{t("student")}:</span> <Sentence cursorOn /></p>
            <Note />
          </div>
        </div>
      </div>

      {!pip ? (
        <GlassPanel
          className="right-4 top-[60px] w-[330px]"
          controls={
            <div className="mx-auto flex max-w-xs items-center justify-between gap-2">
              <CtrlBtn icon={mic ? Mic : MicOff} off={!mic} onClick={() => setMic((v) => !v)} label={t("controls.mic")} />
              <CtrlBtn icon={cam ? Camera : CameraOff} off={!cam} onClick={() => setCam((v) => !v)} label={t("controls.camera")} />
              <CtrlBtn icon={Aperture} label={t("controls.blur")} />
              <CtrlBtn icon={MonitorUp} label={t("controls.shareScreen")} />
              <CtrlBtn icon={Minimize2} onClick={() => setPip(true)} label={t("controls.minimize")} />
              <CtrlBtn icon={PhoneOff} destructive label={t("controls.endClass")} />
            </div>
          }
        >
          <Tile name={t("teacher")} photo={TEACHER} cam={cam} muted={!mic} speaking={actor === "teacher"} />
          <Tile name={t("student")} photo={STUDENT} speaking={actor === "student"} />
        </GlassPanel>
      ) : (
        <Pip
          className="bottom-6 right-6 w-80 aspect-video"
          remote={<><Tile name={t("student")} photo={STUDENT} speaking={actor === "student"} className="size-full aspect-auto rounded-none" /><CcBadge /></>}
          onMax={() => setPip(false)}
          mic={mic}
          cam={cam}
          setMic={() => setMic((v) => !v)}
          setCam={() => setCam((v) => !v)}
        />
      )}
    </div>
  );
}

/** Design 430x900: /notebook no celular do aluno. A chamada começa em PiP (canto superior direito); maximiza para o painel. */
export function HeroPhoneScreen() {
  const t = useTranslations("LandingShowcase.Collab");
  const { actor } = useCollab();
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [docked, setDocked] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-100 dark:bg-gray-950 text-foreground select-none overflow-hidden">
      <PhoneStatusBar />
      <header className="pt-12 pb-3 px-5 flex items-center gap-3 border-b border-border">
        <ChevronLeft className="size-6 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{t("collabNotebook")}</p>
          <h3 className="text-base font-black">{t("docTitle")}</h3>
        </div>
        <div className="flex -space-x-2">
          <span className="size-7 rounded-full border-2 border-background overflow-hidden bg-muted">
            <Image src={TEACHER} alt={t("teacher")} width={28} height={28} className="object-cover size-full" />
          </span>
          <span className="size-7 rounded-full border-2 border-background bg-emerald-500 text-white text-[10px] font-bold grid place-items-center">{t("me")}</span>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden px-5 pt-16 space-y-4 text-[17px] leading-relaxed">
        <p><span className="text-muted-foreground">{t("teacher")}:</span> {t("prompt")}</p>
        <p><span className="text-muted-foreground">{t("you")}:</span> <Sentence cursorOn={false} /></p>
        <Note small />
      </div>

      {/* barra de ferramentas mobile (embaixo, como no NotebookToolbar) */}
      <div className="flex items-center gap-1 border-t border-border bg-gray-100 dark:bg-gray-950 px-3 py-2.5 pb-4">
        {[Heading, Bold, Italic, List, Quote].map((I, k) => (
          <span key={k} className={cn("size-9 rounded-md grid place-items-center text-muted-foreground", k === 1 && "bg-primary/10 text-primary")}><I size={18} /></span>
        ))}
        <span className="ml-auto flex items-center gap-1">
          <span className="size-9 grid place-items-center"><Sparkles size={18} className="text-amber-500" /></span>
          <span className="size-9 grid place-items-center"><GraduationCap size={18} className="text-indigo-500" /></span>
          <span className="size-9 grid place-items-center text-muted-foreground"><Settings size={18} /></span>
        </span>
      </div>

      {!docked ? (
        <Pip
          className="top-[52px] right-3 h-[104px] aspect-video"
          remote={<><Tile name={t("teacher")} photo={TEACHER} speaking={actor === "teacher"} className="size-full aspect-auto rounded-none" /><span className="absolute top-1.5 left-1.5 z-20 rounded-full bg-indigo-600/90 px-1.5 text-[9px] font-bold text-white">{t("captions")}</span></>}
          onMax={() => setDocked(true)}
          mic={mic}
          cam={cam}
          setMic={() => setMic((v) => !v)}
          setCam={() => setCam((v) => !v)}
        />
      ) : (
        <GlassPanel
          className="bottom-3 inset-x-2"
          controls={
            <div className="relative mx-auto flex max-w-xs items-center justify-between gap-2">
              <CtrlBtn icon={mic ? Mic : MicOff} off={!mic} onClick={() => setMic((v) => !v)} label={t("controls.mic")} />
              <CtrlBtn icon={cam ? Camera : CameraOff} off={!cam} onClick={() => setCam((v) => !v)} label={t("controls.camera")} />
              <CtrlBtn icon={Aperture} label={t("controls.blur")} />
              <CtrlBtn icon={MoreVertical} onClick={() => setMenu((v) => !v)} label={t("controls.more")} />
              <CtrlBtn icon={LogOut} destructive onClick={() => setDocked(false)} label={t("controls.leaveClass")} />
              {menu && (
                <button type="button" onClick={() => { setDocked(false); setMenu(false); }} className="absolute bottom-16 right-14 z-50 flex min-w-[140px] items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5 text-sm font-medium shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <Minimize2 size={16} />{t("controls.minimize")}
                </button>
              )}
            </div>
          }
        >
          <Tile name={t("you")} photo={STUDENT} cam={cam} muted={!mic} speaking={actor === "student"} />
          <Tile name={t("teacher")} photo={TEACHER} speaking={actor === "teacher"} />
        </GlassPanel>
      )}
    </div>
  );
}

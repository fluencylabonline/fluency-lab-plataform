"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CallingState,
  ParticipantView,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  type Call,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Camera, CameraOff, Check, Copy, Loader2, Mic, MicOff, NotebookPen, PhoneOff, Power, Share2, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoundButton } from "./RoundButton";
import { NotesPanel } from "./NotesPanel";
import { GuestEmailForm } from "./GuestEmailForm";
import { decideTrialRequestAction, endTrialRoomAction, listTrialRequestsAction } from "../trial-call.actions";
import type { TrialNotes } from "../trial-call.schema";
import type { PendingTrialRequest, TrialCallCredentials } from "../trial-call.types";

interface TrialRoomProps {
  code: string;
  credentials: TrialCallCredentials;
  isHost: boolean;
  /** Preferências escolhidas no lobby. */
  initialMic: boolean;
  initialCam: boolean;
  /** Anfitrião: anotações já salvas. */
  initialNotes?: TrialNotes;
  /** Visitante: identifica o pedido aprovado, para salvar o e-mail ao fim da chamada. */
  guestRef?: { requestId: string; guestId: string };
}

type Phase = "connecting" | "live" | "left" | "ended" | "error";

/** Sala da aula experimental: vídeo em tela cheia, self-view no canto e controles flutuantes. */
export function TrialRoom({ code, credentials, isHost, initialMic, initialCam, initialNotes, guestRef }: TrialRoomProps) {
  const t = useTranslations("TrialClass.Room");
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let mine: StreamVideoClient | null = null;
    let joined: Call | null = null;

    const start = async () => {
      setPhase("connecting");
      try {
        const next = new StreamVideoClient(credentials.apiKey);
        await next.connectUser({ id: credentials.userId, name: credentials.userName }, credentials.streamToken);
        mine = next;
        const nextCall = next.call("default", credentials.callId);

        // Aplica as preferências do lobby antes de entrar, para não piscar câmera/mic ligados.
        if (initialCam) await nextCall.camera.enable().catch(() => undefined);
        else await nextCall.camera.disable().catch(() => undefined);
        if (initialMic) await nextCall.microphone.enable().catch(() => undefined);
        else await nextCall.microphone.disable().catch(() => undefined);

        await nextCall.join();
        joined = nextCall;
        if (cancelled) return;
        // A transcrição vira o perfil do aluno: o anfitrião garante que ela esteja ligada (com repetição).
        if (isHost) void ensureTranscription(nextCall);
        nextCall.on("call.ended", () => setPhase("ended"));
        setClient(next);
        setCall(nextCall);
        setPhase("live");
      } catch (err) {
        console.error("[TrialRoom] Failed to join:", err);
        if (!cancelled) setPhase("error");
      }
    };

    start();
    return () => {
      cancelled = true;
      joined?.leave().catch(() => undefined);
      mine?.disconnectUser().catch(() => undefined);
      setClient(null);
      setCall(null);
    };
  }, [credentials, initialCam, initialMic, attempt, isHost]);

  if (phase === "left" || phase === "ended" || phase === "error") {
    return (
      <div className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-center text-white">
        <div className="flex w-full max-w-sm flex-col items-center gap-5">
          <h1 className="text-2xl font-bold">
            {phase === "left" ? t("left") : phase === "ended" ? t("endedByHost") : t("connectError")}
          </h1>
          {phase !== "ended" && (
            <Button size="lg" className="rounded-full px-8" onClick={() => setAttempt((n) => n + 1)}>
              {phase === "error" ? t("tryAgain") : t("rejoin")}
            </Button>
          )}
          {!isHost && guestRef && phase !== "error" && <GuestEmailForm code={code} requestId={guestRef.requestId} guestId={guestRef.guestId} />}
          {isHost && phase !== "error" && (
            <Link href="/hub/admin/students/onboarding" className="text-sm font-semibold underline underline-offset-4">{t("openHub")}</Link>
          )}
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="grid min-h-dvh place-items-center bg-zinc-950 text-white" role="status" aria-live="polite">
        <span className="flex items-center gap-3 text-lg"><Loader2 className="size-5 animate-spin" aria-hidden />{t("connecting")}</span>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <RoomView code={code} isHost={isHost} initialNotes={initialNotes} onLeft={() => setPhase("left")} onEnded={() => setPhase("ended")} />
      </StreamCall>
    </StreamVideo>
  );
}

/** Liga a transcrição da sala; tenta de novo se a Stream ainda não aceitou. Falhar não derruba a aula. */
async function ensureTranscription(call: Call) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await call.startTranscription();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

interface RoomViewProps {
  code: string;
  isHost: boolean;
  initialNotes?: TrialNotes;
  onLeft: () => void;
  onEnded: () => void;
}

function RoomView({ code, isHost, initialNotes, onLeft, onEnded }: RoomViewProps) {
  const t = useTranslations("TrialClass.Room");
  const call = useCall();
  const [notesOpen, setNotesOpen] = useState(false);
  const { useRemoteParticipants, useLocalParticipant, useMicrophoneState, useCameraState, useCallCallingState, useIsCallTranscribingInProgress } = useCallStateHooks();
  const transcribing = useIsCallTranscribingInProgress();
  const remote = useRemoteParticipants();
  const local = useLocalParticipant();
  const { isMute: micMuted } = useMicrophoneState();
  const { isMute: camMuted } = useCameraState();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) onLeft();
  }, [callingState, onLeft]);

  const main = remote[0];

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-zinc-950 text-white">
    <div className="relative min-w-0 flex-1 overflow-hidden">
      {/* vídeo principal: o outro participante; sozinho, a própria imagem ocupa a tela */}
      <div className="absolute inset-0 [&_.str-video__participant-view]:h-full [&_.str-video__participant-view]:w-full [&_.str-video__participant-view]:max-h-none [&_.str-video__participant-view]:max-w-none [&_.str-video__participant-view]:rounded-none [&_video]:object-cover">
        {main ? (
          <ParticipantView participant={main} />
        ) : local ? (
          <ParticipantView participant={local} />
        ) : null}
      </div>

      {!main && (
        <div className="pointer-events-none absolute inset-x-0 top-[18%] flex justify-center px-6 text-center">
          <p className="rounded-full bg-black/50 px-5 py-2 text-base font-medium backdrop-blur">{t("waitingOthers")}</p>
        </div>
      )}

      {/* self-view */}
      {main && local && (
        <div className="absolute bottom-28 right-3 z-10 w-28 overflow-hidden rounded-2xl border border-white/30 bg-zinc-800 shadow-xl sm:bottom-6 sm:right-6 sm:w-48 [&_.str-video__participant-view]:aspect-[3/4] sm:[&_.str-video__participant-view]:aspect-video [&_.str-video__participant-view]:w-full [&_video]:object-cover">
          <ParticipantView participant={local} />
        </div>
      )}

      {isHost && <HostBar code={code} />}

      {transcribing && (
        <p className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-medium backdrop-blur">
          <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden />
          {t("transcribing")}
        </p>
      )}

      {/* controles */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-10">
        <RoundButton label={micMuted ? t("micOn") : t("micOff")} icon={micMuted ? MicOff : Mic} tone={micMuted ? "off" : "default"} onClick={() => call?.microphone.toggle()} />
        <RoundButton label={camMuted ? t("cameraOn") : t("cameraOff")} icon={camMuted ? CameraOff : Camera} tone={camMuted ? "off" : "default"} onClick={() => call?.camera.toggle()} />
        {isHost && initialNotes && (
          <span className="lg:hidden">
            <RoundButton label={t("notes")} icon={NotebookPen} onClick={() => setNotesOpen(true)} />
          </span>
        )}
        <RoundButton label={t("leave")} icon={PhoneOff} tone="danger" onClick={() => call?.leave().catch(() => undefined)} />
        {isHost && <EndForAllButton code={code} onEnded={onEnded} />}
      </div>
    </div>

    {isHost && initialNotes && (
      // Um único painel (um só autosave): coluna à direita no desktop, folha por cima do vídeo no celular.
      <aside
        aria-label={t("notes")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 h-[75dvh] rounded-t-3xl border-t border-border bg-background shadow-2xl transition-transform duration-300",
          "lg:static lg:z-auto lg:h-auto lg:w-[360px] lg:shrink-0 lg:translate-y-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none",
          notesOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <button type="button" aria-label={t("closeNotes")} onClick={() => setNotesOpen(false)} className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-muted text-foreground lg:hidden">
          <X className="size-4" aria-hidden />
        </button>
        <NotesPanel code={code} initialNotes={initialNotes} />
      </aside>
    )}
    </div>
  );
}

/** Dois toques para encerrar para todos (evita encerrar sem querer). */
function EndForAllButton({ code, onEnded }: { code: string; onEnded: () => void }) {
  const t = useTranslations("TrialClass.Room");
  const call = useCall();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  const end = async () => {
    if (!armed) return setArmed(true);
    await endTrialRoomAction({ code });
    await call?.endCall().catch(() => undefined);
    onEnded();
  };

  return armed ? (
    <button type="button" onClick={end} className="h-12 rounded-full bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700">
      {t("confirmEnd")}
    </button>
  ) : (
    <RoundButton label={t("endForAll")} icon={Power} onClick={end} />
  );
}

/** Topo do anfitrião: link para copiar/compartilhar e pedidos de entrada. */
function HostBar({ code }: { code: string }) {
  const t = useTranslations("TrialClass.Room");
  const [requests, setRequests] = useState<PendingTrialRequest[]>([]);
  const [copied, setCopied] = useState(false);
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");
  const alive = useRef(true);

  const link = typeof window === "undefined" ? "" : `${window.location.origin}/trial-class/${code}`;

  useEffect(() => {
    alive.current = true;
    const poll = async () => {
      const res = await listTrialRequestsAction({ code });
      if (alive.current && res?.data) setRequests(res.data.requests);
    };
    poll();
    const timer = setInterval(poll, 2500);
    return () => {
      alive.current = false;
      clearInterval(timer);
    };
  }, [code]);

  const decide = useCallback(
    async (id: string, approve: boolean) => {
      setRequests((rs) => rs.filter((r) => r.id !== id));
      await decideTrialRequestAction({ code, requestId: id, approve });
    },
    [code]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível: o link segue visível no chip
    }
  };

  const share = () => navigator.share({ url: link }).catch(() => undefined);

  return (
    <div className="absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-3 p-3 sm:p-4">
      <div className="flex max-w-full items-center gap-1 rounded-full bg-black/55 py-1 pl-4 pr-1 text-sm backdrop-blur">
        <span className="truncate" dir="ltr">{link.replace(/^https?:\/\//, "")}</span>
        <button type="button" onClick={copy} aria-label={t("copyLink")} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15">
          {copied ? <Check className="size-4 text-emerald-400" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </button>
        {canShare && (
          <button type="button" onClick={share} aria-label={t("share")} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-white/15">
            <Share2 className="size-4" aria-hidden />
          </button>
        )}
        <span className="sr-only" role="status" aria-live="polite">{copied ? t("copied") : ""}</span>
      </div>

      {requests.map((r) => (
        <div key={r.id} role="alert" className={cn("flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white p-3 text-zinc-900 shadow-2xl")}>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{t("wantsToJoin", { name: r.name })}</p>
          <button type="button" onClick={() => decide(r.id, false)} aria-label={t("deny")} className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200">
            <X className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => decide(r.id, true)} className="h-10 shrink-0 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90">
            {t("accept")}
          </button>
        </div>
      ))}
    </div>
  );
}

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
import { Camera, CameraOff, Check, Copy, Loader2, Mic, MicOff, PhoneOff, Power, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoundButton } from "./RoundButton";
import { decideTrialRequestAction, endTrialRoomAction, listTrialRequestsAction } from "../trial-call.actions";
import type { PendingTrialRequest, TrialCallCredentials } from "../trial-call.types";

interface TrialRoomProps {
  code: string;
  credentials: TrialCallCredentials;
  isHost: boolean;
  /** Preferências escolhidas no lobby. */
  initialMic: boolean;
  initialCam: boolean;
}

type Phase = "connecting" | "live" | "left" | "ended" | "error";

/** Sala da aula experimental: vídeo em tela cheia, self-view no canto e controles flutuantes. */
export function TrialRoom({ code, credentials, isHost, initialMic, initialCam }: TrialRoomProps) {
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
  }, [credentials, initialCam, initialMic, attempt]);

  if (phase === "left" || phase === "ended" || phase === "error") {
    return (
      <div className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-center text-white">
        <div className="flex max-w-sm flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">
            {phase === "left" ? t("left") : phase === "ended" ? t("endedByHost") : t("connectError")}
          </h1>
          {phase !== "ended" && (
            <Button size="lg" className="rounded-full px-8" onClick={() => setAttempt((n) => n + 1)}>
              {phase === "error" ? t("tryAgain") : t("rejoin")}
            </Button>
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
        <RoomView code={code} isHost={isHost} onLeft={() => setPhase("left")} onEnded={() => setPhase("ended")} />
      </StreamCall>
    </StreamVideo>
  );
}

function RoomView({ code, isHost, onLeft, onEnded }: { code: string; isHost: boolean; onLeft: () => void; onEnded: () => void }) {
  const t = useTranslations("TrialClass.Room");
  const call = useCall();
  const { useRemoteParticipants, useLocalParticipant, useMicrophoneState, useCameraState, useCallCallingState } = useCallStateHooks();
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
    <div className="relative h-dvh w-full overflow-hidden bg-zinc-950 text-white">
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

      {/* controles */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-10">
        <RoundButton label={micMuted ? t("micOn") : t("micOff")} icon={micMuted ? MicOff : Mic} tone={micMuted ? "off" : "default"} onClick={() => call?.microphone.toggle()} />
        <RoundButton label={camMuted ? t("cameraOn") : t("cameraOff")} icon={camMuted ? CameraOff : Camera} tone={camMuted ? "off" : "default"} onClick={() => call?.camera.toggle()} />
        <RoundButton label={t("leave")} icon={PhoneOff} tone="danger" onClick={() => call?.leave().catch(() => undefined)} />
        {isHost && <EndForAllButton code={code} onEnded={onEnded} />}
      </div>
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

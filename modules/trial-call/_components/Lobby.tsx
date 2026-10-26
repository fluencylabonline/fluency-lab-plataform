"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Camera, CameraOff, Loader2, Mic, MicOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoundButton } from "./RoundButton";
import { useLocalPreview } from "./use-local-preview";
const TrialRoom = dynamic(() => import("./TrialRoom").then((m) => m.TrialRoom), { ssr: false });
import { getTrialRequestStatusAction, getTrialRoomStateAction, requestTrialJoinAction } from "../trial-call.actions";
import type { TrialCallCredentials } from "../trial-call.types";

interface LobbyProps {
  code: string;
  hostName: string;
  initialParticipants: string[];
}

type Step =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "waiting"; requestId: string; guestId: string }
  | { kind: "denied" }
  | { kind: "limited" }
  | { kind: "ended" }
  | { kind: "joined"; credentials: TrialCallCredentials; mic: boolean; cam: boolean };

/** Lobby do visitante: prévia da câmera, nome e um único botão para pedir entrada. */
export function Lobby({ code, hostName, initialParticipants }: LobbyProps) {
  const t = useTranslations("TrialClass.Lobby");
  const preview = useLocalPreview();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState(initialParticipants);
  const [step, setStep] = useState<Step>({ kind: "idle" });

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = preview.stream;
  }, [preview.stream, step.kind]);

  // Quem já está na chamada (e se a sala foi encerrada) enquanto o visitante decide.
  useEffect(() => {
    if (step.kind !== "idle" && step.kind !== "denied") return;
    const timer = setInterval(async () => {
      const res = await getTrialRoomStateAction({ code });
      const state = res?.data?.state;
      if (!state) return;
      if (state.status === "active") setParticipants(state.participants);
      else if (state.status === "ended") setStep({ kind: "ended" });
    }, 6000);
    return () => clearInterval(timer);
  }, [code, step.kind]);

  // Aguardando o anfitrião: pergunta a cada 2 s; o token só vem quando aprovado.
  const waitingId = step.kind === "waiting" ? step : null;
  useEffect(() => {
    if (!waitingId) return;
    let stopped = false;
    const poll = async () => {
      const res = await getTrialRequestStatusAction({ code, requestId: waitingId.requestId, guestId: waitingId.guestId });
      const request = res?.data?.request;
      if (stopped || !request) return;
      if (request.status === "approved") {
        const { micOn, camOn } = preview;
        preview.stop();
        setStep({ kind: "joined", credentials: request.credentials, mic: micOn, cam: camOn });
      } else if (request.status === "denied") setStep({ kind: "denied" });
      else if (request.status === "ended") setStep({ kind: "ended" });
    };
    const timer = setInterval(poll, 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, waitingId?.requestId, waitingId?.guestId]);

  const ask = async () => {
    setStep({ kind: "sending" });
    const res = await requestTrialJoinAction({ code, name: name.trim() || t("defaultName") });
    const data = res?.data;
    if (!data || data.limited) return setStep({ kind: "limited" });
    if (!data.result) return setStep({ kind: "ended" });
    setStep({ kind: "waiting", ...data.result });
  };

  if (step.kind === "joined") {
    return <TrialRoom code={code} credentials={step.credentials} isHost={false} initialMic={step.mic} initialCam={step.cam} />;
  }

  if (step.kind === "ended") {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <p className="text-xl font-bold">{t("ended")}</p>
      </div>
    );
  }

  const busy = step.kind === "sending" || step.kind === "waiting";
  const namesText = participants.join(", ");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-6 p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-3xl bg-zinc-900 shadow-xl sm:aspect-video sm:max-w-none">
        {preview.camOn ? (
          <video ref={videoRef} autoPlay playsInline muted aria-label={t("previewLabel")} className="size-full -scale-x-100 object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-center text-white/80">
            <div className="flex flex-col items-center gap-3 px-6">
              <span className="grid size-20 place-items-center rounded-full bg-white/10"><User className="size-9" aria-hidden /></span>
              <p className="text-sm">{preview.error === "denied" ? t("cameraBlocked") : t("cameraOff")}</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent pb-4 pt-12">
          <RoundButton label={preview.micOn ? t("micOff") : t("micOn")} icon={preview.micOn ? Mic : MicOff} tone={preview.micOn ? "default" : "off"} onClick={preview.toggleMic} disabled={!preview.hasAudio} />
          <RoundButton label={preview.camOn ? t("cameraTurnOff") : t("cameraTurnOn")} icon={preview.camOn ? Camera : CameraOff} tone={preview.camOn ? "default" : "off"} onClick={preview.toggleCam} disabled={!preview.hasVideo} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-5 text-center lg:mx-0 lg:text-left">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {hostName ? t("withHost", { host: hostName }) : t("subtitle")}
          </p>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {participants.length ? t("inCall", { count: participants.length, names: namesText }) : t("nobody")}
          </p>
        </div>

        {step.kind === "waiting" ? (
          <div className="flex flex-col items-center gap-3 lg:items-start" role="status" aria-live="polite">
            <p className="flex items-center gap-2 font-semibold"><Loader2 className="size-4 animate-spin" aria-hidden />{t("waiting")}</p>
            <p className="text-sm text-muted-foreground">{t("waitingHint")}</p>
            <Button variant="ghost" className="rounded-full" onClick={() => setStep({ kind: "idle" })}>{t("cancel")}</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="sr-only" htmlFor="trial-name">{t("nameLabel")}</label>
            <input
              id="trial-name"
              value={name}
              maxLength={60}
              autoComplete="name"
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && ask()}
              placeholder={t("namePlaceholder")}
              className="h-12 rounded-full border border-input bg-background px-5 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            {step.kind === "denied" && <p className="text-sm font-medium text-destructive" role="alert">{t("denied")}</p>}
            {step.kind === "limited" && <p className="text-sm font-medium text-destructive" role="alert">{t("limited")}</p>}
            <Button size="lg" className="h-12 rounded-full text-base font-bold" disabled={busy} onClick={ask}>
              {step.kind === "sending" ? t("sending") : step.kind === "denied" ? t("askAgain") : t("ask")}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

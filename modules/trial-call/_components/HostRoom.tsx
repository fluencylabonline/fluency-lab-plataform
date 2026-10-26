"use client";

import dynamic from "next/dynamic";
import type { TrialNotes } from "../trial-call.schema";
import type { TrialCallCredentials } from "../trial-call.types";

const TrialRoom = dynamic(() => import("./TrialRoom").then((m) => m.TrialRoom), { ssr: false });

/** Entrada do anfitrião: já logado e dono da sala, vai direto para a chamada. */
export function HostRoom({ code, credentials, notes }: { code: string; credentials: TrialCallCredentials; notes: TrialNotes }) {
  return <TrialRoom code={code} credentials={credentials} isHost initialMic initialCam initialNotes={notes} />;
}

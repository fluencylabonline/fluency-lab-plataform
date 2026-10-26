"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PreviewError = "denied" | "unavailable" | null;

/**
 * Prévia local da câmera/microfone para o lobby (sem Stream). Tenta vídeo + áudio e,
 * se falhar, só áudio. Os botões apenas ligam/desligam as faixas; `stop()` libera os
 * dispositivos antes de a Stream abrir os dela.
 */
export function useLocalPreview() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<PreviewError>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const open = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("unavailable");
        return;
      }
      try {
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
        if (cancelled) return media.getTracks().forEach((t) => t.stop());
        streamRef.current = media;
        setStream(media);
      } catch (err) {
        const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
        // Sem câmera (ou bloqueada): ainda dá para entrar só com áudio.
        try {
          const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cancelled) return audio.getTracks().forEach((t) => t.stop());
          streamRef.current = audio;
          setStream(audio);
          setCamOn(false);
        } catch {
          if (!cancelled) {
            setError(denied ? "denied" : "unavailable");
            setCamOn(false);
            setMicOn(false);
          }
        }
        if (!cancelled && denied) setError("denied");
      }
    };

    open();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const hasVideo = !!stream?.getVideoTracks().length;
  const hasAudio = !!stream?.getAudioTracks().length;

  const toggleCam = () => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const toggleMic = () => {
    const track = stream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  return { stream, error, camOn: camOn && hasVideo, micOn: micOn && hasAudio, hasVideo, hasAudio, toggleCam, toggleMic, stop };
}

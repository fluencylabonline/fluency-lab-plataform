"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ref, onValue, set, off, type DataSnapshot } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Gauge, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Headphones 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { AudioNodeAttributes } from "./AudioSyncNode";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AudioSyncState {
  playing: boolean;
  currentTime: number;
  playbackRate: number;
  lastUpdatedBy: string;
  updatedAt: number;
}

const SYNC_TOLERANCE_SEC = 1.5; // Diferença máxima aceitável antes de pular (seek)

export function AudioSyncView({ node, selected }: NodeViewProps) {
  const { nodeId, url, title, transcription } = node.attrs as AudioNodeAttributes;
  const t = useTranslations("AudioSync");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSyncingRef = useRef(false);

  // Estados locais da UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  // Controle de velocidade e volume (local)
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  
  // Accordion da transcrição
  const [isTranscriptionOpen, setIsTranscriptionOpen] = useState(false);

  // ── Formatar tempo (00:00) ──────────────────────────────────────────────────
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // ── Publicar estado local no Firebase Realtime Database ───────────────────
  const publishState = useCallback(
    (playing: boolean, time: number, rateVal?: number) => {
      if (!nodeId) return;
      const rate = rateVal !== undefined ? rateVal : speed;
      const state: AudioSyncState = {
        playing,
        currentTime: time,
        playbackRate: rate,
        lastUpdatedBy:
          ((globalThis as Record<string, unknown>).__userId as string) ??
          "anonymous",
        updatedAt: Date.now(),
      };
      set(ref(rtdb, `audio-sync/${nodeId}`), state).catch(console.error);
    },
    [nodeId, speed]
  );

  // ── Escutar RTDB para aplicar estado remoto ─────────────────────────────────
  useEffect(() => {
    if (!nodeId) return;

    const syncRef = ref(rtdb, `audio-sync/${nodeId}`);

    const handleSnapshot = (snapshot: DataSnapshot) => {
      const state: AudioSyncState | null = snapshot.val();
      const audio = audioRef.current;
      if (!state || !audio) return;

      // Anti-loop: ignora modificações causadas por si mesmo
      const myId =
        ((globalThis as Record<string, unknown>).__userId as string) ??
        "anonymous";
      if (state.lastUpdatedBy === myId) return;

      isSyncingRef.current = true;

      try {
        // Interpolação de tempo para compensar latência/drift
        const elapsed = (Date.now() - state.updatedAt) / 1000;
        const targetTime = state.playing ? state.currentTime + elapsed : state.currentTime;

        const timeDiff = Math.abs(audio.currentTime - targetTime);

        if (timeDiff > SYNC_TOLERANCE_SEC) {
          audio.currentTime = Math.min(targetTime, audio.duration || 0);
        }

        // Sincronizar estado Play/Pause
        if (state.playing) {
          audio.play().catch(console.warn);
          setIsPlaying(true);
        } else {
          audio.pause();
          setIsPlaying(false);
        }

        // Sincronizar Velocidade
        if (state.playbackRate !== undefined) {
          audio.playbackRate = state.playbackRate;
          setSpeed(state.playbackRate);
        }
      } finally {
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 300);
      }
    };

    onValue(syncRef, handleSnapshot);
    return () => off(syncRef, "value", handleSnapshot);
  }, [nodeId]);

  // ── Sincronizar Volume Local no elemento ────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // ── Configurar áudio e eventos ──────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      if (isSyncingRef.current) return;
      setIsPlaying(true);
      publishState(true, audio.currentTime);
    };

    const handlePause = () => {
      if (isSyncingRef.current) return;
      setIsPlaying(false);
      publishState(false, audio.currentTime);
    };

    const handleEnded = () => {
      if (isSyncingRef.current) return;
      setIsPlaying(false);
      publishState(false, 0);
      audio.currentTime = 0;
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Se o áudio já estiver com metadados carregados (ex: trocas rápidas de renderização)
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
      setIsReady(true);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [url, publishState]);

  // ── Interações Locais ─────────────────────────────────────────────────────
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleSeek = (newVal: number) => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    audio.currentTime = newVal;
    setCurrentTime(newVal);
    
    // Atualiza o estado remotamente ao arrastar a barra
    publishState(isPlaying, newVal);
  };

  const handleSpeedChange = (newSpeed: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = newSpeed;
    setSpeed(newSpeed);
    setSpeedOpen(false);

    publishState(isPlaying, audio.currentTime, newSpeed);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Fecha o dropdown de velocidade ao clicar fora
  useEffect(() => {
    if (!speedOpen) return;
    const handleOutsideClick = () => setSpeedOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [speedOpen]);

  return (
    <NodeViewWrapper className="react-component">
      <div 
        className={`my-4 rounded-xl overflow-hidden border transition-colors duration-200 bg-white dark:bg-zinc-900 ${
          selected ? "border-amber-500" : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        
        {/* Barra de Título e Status */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-500/5 dark:bg-amber-500/10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate m-0" title={title}>
              {title || t("defaultTitle") || "Áudio Sincronizado"}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              {isReady && isPlaying && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                isReady 
                  ? isPlaying 
                    ? "bg-emerald-500" 
                    : "bg-amber-500" 
                  : "bg-zinc-400 dark:bg-zinc-500 animate-pulse"
              }`}></span>
            </span>
            {isReady 
              ? isPlaying 
                ? (t("synchronized") || "Sincronizado") 
                : (t("paused") || "Pausado") 
              : (t("loading") || "Carregando")}
          </div>
        </div>

        {/* Player e Controles Principais */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
          <button 
            type="button"
            onClick={togglePlay}
            disabled={!isReady}
            className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            aria-label={isPlaying ? (t("pause") || "Pausar") : (t("play") || "Tocar")}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            )}
          </button>

          {/* Barra de Progresso */}
          <div className="flex-1 flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2 w-full">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums min-w-[35px]">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                disabled={!isReady}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-colors focus:outline-none [--slider-track:#e5e7eb] dark:[--slider-track:#27272a]"
                style={{
                  background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${
                    duration > 0 ? (currentTime / duration) * 100 : 0
                  }%, var(--slider-track) ${
                    duration > 0 ? (currentTime / duration) * 100 : 0
                  }%, var(--slider-track) 100%)`
                }}
              />
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums min-w-[35px]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controles do Lado Direito */}
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            
            {/* Controle de Volume (Puro Local) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="flex items-center justify-center p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors duration-150"
                title={isMuted ? (t("unmute") || "Ativar som") : (t("mute") || "Desativar som")}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="h-1 w-14 sm:w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-700 dark:accent-zinc-300 transition-colors focus:outline-none [--slider-track:#e5e7eb] dark:[--slider-track:#27272a] [--slider-thumb:#52525b] dark:[--slider-thumb:#a1a1aa]"
                style={{
                  background: `linear-gradient(to right, var(--slider-thumb) 0%, var(--slider-thumb) ${
                    isMuted ? 0 : volume
                  }%, var(--slider-track) ${
                    isMuted ? 0 : volume
                  }%, var(--slider-track) 100%)`
                }}
              />
            </div>

            {/* Controle de Velocidade Sincronizada */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSpeedOpen(!speedOpen);
                }}
                disabled={!isReady}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title={t("speedTooltip") || "Velocidade de reprodução sincronizada"}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{speed === 1 ? "1.0x" : `${speed}x`}</span>
              </button>

              {speedOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 w-20 flex flex-col gap-0.5 z-10 shadow-lg" onClick={(e) => e.stopPropagation()}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSpeedChange(rate)}
                      className={`w-full text-left px-2 py-1 text-[11.5px] rounded font-medium transition-colors ${
                        speed === rate 
                          ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold" 
                          : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {rate === 1 ? (t("normal") || "Normal") : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Seção da Transcrição Expansível */}
        {transcription && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20">
            <button
              type="button"
              onClick={() => setIsTranscriptionOpen(!isTranscriptionOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 transition-colors duration-150 focus:outline-none"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                {isTranscriptionOpen 
                  ? (t("hideTranscription") || "Ocultar Transcrição") 
                  : (t("viewTranscription") || "Visualizar Transcrição")}
              </span>
              {isTranscriptionOpen ? (
                <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {isTranscriptionOpen && (
                <motion.div
                  key="transcription"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 border-t border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 whitespace-pre-wrap">
                    {transcription}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Elemento de Áudio Oculto */}
        <audio 
          ref={audioRef} 
          src={url} 
          preload="metadata" 
          className="hidden" 
        />

      </div>
    </NodeViewWrapper>
  );
}

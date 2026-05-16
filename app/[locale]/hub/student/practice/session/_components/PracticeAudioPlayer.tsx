"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PracticeAudioPlayerProps {
  audioUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
  startTime?: number;
  endTime?: number;
  onComplete?: () => void;
  /** Text to read via browser TTS (no audioUrl needed) */
  textToSpeak?: string;
  language?: string;
}

export function PracticeAudioPlayer({
  audioUrl = null,
  isOpen,
  onClose,
  autoPlay = true,
  startTime = 0,
  endTime,
  onComplete,
  textToSpeak,
  language = "en-US",
}: PracticeAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const speakText = useCallback(
    (rateOverride?: number) => {
      if (!textToSpeak || isMuted) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language;
      utterance.rate = rateOverride ?? playbackRate;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        onComplete?.();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [textToSpeak, isMuted, language, playbackRate, onComplete]
  );

  useEffect(() => {
    if (!isOpen) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && textToSpeak && autoPlay) {
      speakText();
    }
  }, [isOpen, autoPlay, speakText, textToSpeak]);

  const togglePlay = () => {
    if (textToSpeak) {
      if (isPlaying) {
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
      } else {
        speakText();
      }
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (endTime && audioRef.current.currentTime >= endTime) {
          audioRef.current.currentTime = startTime;
        }
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
    if (textToSpeak && isPlaying) speakText(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (textToSpeak && next) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    }
    if (audioRef.current) audioRef.current.muted = next;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border p-6 rounded-t-2xl"
        >
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            preload="metadata"
            onLoadedMetadata={() => {
              if (!audioRef.current) return;
              setDuration(audioRef.current.duration || 0);
              audioRef.current.currentTime = startTime;
              if (autoPlay) audioRef.current.play().catch(() => {});
            }}
            onTimeUpdate={() => {
              if (!audioRef.current) return;
              setProgress(audioRef.current.currentTime);
              if (endTime && audioRef.current.currentTime >= endTime) {
                audioRef.current.pause();
                setIsPlaying(false);
                audioRef.current.currentTime = startTime;
                onComplete?.();
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); onComplete?.(); }}
          />

          <div className="max-w-md mx-auto space-y-4">
            {!textToSpeak && (
              <div className="space-y-1">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100 ease-linear"
                    style={{
                      width: endTime
                        ? `${Math.max(0, Math.min(100, ((progress - startTime) / (endTime - startTime)) * 100))}%`
                        : `${(progress / (duration || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{fmt(endTime ? Math.max(0, progress - startTime) : progress)}</span>
                  <span>{fmt(endTime ? endTime - startTime : duration)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={changeSpeed}
                className="text-xs font-bold w-12 h-10 rounded-md"
              >
                {playbackRate}x
              </Button>

              <Button
                size="icon"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg text-2xl"
              >
                {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-muted-foreground">
                {isMuted ? <VolumeX /> : <Volume2 />}
              </Button>
            </div>

            <div className="flex justify-center">
              <button onClick={onClose} className="text-muted-foreground text-sm hover:text-foreground">
                Fechar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

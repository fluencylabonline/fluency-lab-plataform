"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  url: string;
  startTime?: number;
  endTime?: number;
  className?: string;
  title?: string;
}

export const AudioPlayer = ({
  url,
  startTime = 0,
  endTime,
  className,
  title = "Listening"
}: AudioPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const current = audio.currentTime;
      const duration = endTime ? (endTime - startTime) : audio.duration;

      if (duration > 0) {
        const relativeProgress = ((current - startTime) / duration) * 100;
        setProgress(Math.min(Math.max(relativeProgress, 0), 100));
      }

      // Stop if reached endTime
      if (endTime && current >= endTime) {
        audio.pause();
        audio.currentTime = startTime; // Reset to start of snippet
        setPlaying(false);
      }
    };

    const handleEnded = () => {
      setPlaying(false);
      if (audioRef.current) audioRef.current.currentTime = startTime;
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [startTime, endTime]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // If we are outside the range, reset to start
      if (audioRef.current.currentTime < startTime || (endTime && audioRef.current.currentTime >= endTime)) {
        audioRef.current.currentTime = startTime;
      }
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className={cn(
      "w-full card backdrop-blur-sm rounded-md p-4 flex items-center gap-4 border border-border/50 transition-all hover:border-primary/20",
      className
    )}>
      <button
        onClick={togglePlay}
        type="button"
        className="h-12 w-12 flex items-center justify-center bg-primary rounded-full text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-transform shrink-0"
      >
        {playing ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 ml-1 fill-current" />
        )}
      </button>
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-primary" /> {title}
          </span>
          <span>{playing ? "Tocando..." : "Clique para ouvir"}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
          />
        </div>
      </div>
      <audio ref={audioRef} src={url} className="hidden" preload="metadata" />
    </div>
  );
};

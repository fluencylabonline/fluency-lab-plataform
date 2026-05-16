"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ParticipantView,
  type StreamVideoParticipant,
} from "@stream-io/video-react-sdk";

interface ParticipantsGridProps {
  remoteParticipants: StreamVideoParticipant[];
  localParticipant?: StreamVideoParticipant;
  variant?: "standard" | "pip";
}

// Sub-component: renders a screen share track with a fullscreen toggle button
const ScreenShareWithFullscreenButton: React.FC<{
  participant: StreamVideoParticipant;
  isPip?: boolean;
}> = ({ participant, isPip }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current
        .requestFullscreen()
        .catch((err) => console.error("Erro ao entrar em fullscreen:", err));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isPip ? "h-full" : "h-auto p-2"}`}
    >
      <ParticipantView participant={participant} trackType="screenShareTrack" />
      <button
        onClick={toggleFullscreen}
        className={`absolute top-2 right-2 z-10 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-700 text-white rounded-lg transition-colors backdrop-blur-sm ${isPip ? "text-[10px]" : "text-xs"}`}
      >
        {isFullscreen ? "Sair" : isPip ? "Expandir" : "Entrar em Fullscreen"}
      </button>
    </div>
  );
};

export const ParticipantsGrid: React.FC<ParticipantsGridProps> = ({
  remoteParticipants,
  localParticipant,
  variant = "standard",
}) => {
  const isPip = variant === "pip";

  // In PiP mode we focus on the remote participant only
  const mergedParticipants = isPip
    ? remoteParticipants
    : localParticipant
      ? [localParticipant, ...remoteParticipants]
      : remoteParticipants;

  // Deduplicate by userId / sessionId
  const uniqueParticipants = mergedParticipants.filter(
    (participant, index, self) => {
      const id = participant.userId || participant.sessionId;
      return index === self.findIndex((p) => (p.userId || p.sessionId) === id);
    },
  );

  if (isPip && uniqueParticipants.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs font-medium">
        Aguardando participante...
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col ${isPip ? "" : "gap-2 overflow-y-auto"}`}
    >
      {uniqueParticipants.map((participant) => {
        const isScreenSharing =
          participant.publishedTracks?.includes(3) ?? false;
        const isLocal =
          localParticipant &&
          participant.sessionId === localParticipant.sessionId;

        if (!isLocal && isScreenSharing) {
          return (
            <div
              key={participant.sessionId}
              className={isPip ? "flex-1 w-full" : ""}
            >
              <ScreenShareWithFullscreenButton
                participant={participant}
                isPip={isPip}
              />
            </div>
          );
        }

        return (
          <div
            key={participant.sessionId}
            className={`w-full ${isPip ? "flex-1" : "h-auto p-2"}`}
          >
            <div
              className={`relative w-full h-full rounded-md overflow-hidden ${isPip ? "" : "aspect-video"}`}
            >
              <ParticipantView
                participant={participant}
                trackType={isScreenSharing ? "screenShareTrack" : "videoTrack"}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

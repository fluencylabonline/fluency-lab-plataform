"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2 } from "lucide-react";
import {
  ParticipantView,
  type StreamVideoParticipant,
} from "@stream-io/video-react-sdk";

interface ParticipantsGridProps {
  remoteParticipants: StreamVideoParticipant[];
  localParticipant?: StreamVideoParticipant;
  variant?: "standard" | "pip";
}

/**
 * Sub-component: renders a screen share track with an "expand" button.
 *
 * Renders the expanded view through a portal into document.body instead of
 * using the native Fullscreen API — the call panel is a draggable
 * framer-motion element (has a CSS transform), which would otherwise scope
 * any `position: fixed` descendant to the panel's box instead of the
 * viewport. The portal also keeps the docked/floating call panel itself
 * completely untouched while expanded.
 */
const ScreenShareWithFullscreenButton: React.FC<{
  participant: StreamVideoParticipant;
  isPip?: boolean;
}> = ({ participant, isPip }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className={`relative w-full ${isPip ? "h-full" : "h-auto p-2"}`}>
        <ParticipantView participant={participant} trackType="screenShareTrack" />
        <button
          onClick={() => setIsExpanded(true)}
          className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-700 text-white rounded-lg transition-colors backdrop-blur-sm ${isPip ? "text-[10px]" : "text-xs"}`}
        >
          <Maximize2 size={isPip ? 10 : 12} />
          Expandir
        </button>
      </div>

      {isExpanded &&
        createPortal(
          <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm text-sm"
            >
              <X size={16} />
              Recolher
            </button>
            <div className="w-full h-full max-w-[95vw] max-h-[95vh]">
              <ParticipantView participant={participant} trackType="screenShareTrack" />
            </div>
          </div>,
          document.body,
        )}
    </>
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

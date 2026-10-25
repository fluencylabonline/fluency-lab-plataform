"use client";

import { useState } from "react";
import {
  BackgroundFiltersProvider,
  StreamCall,
  StreamVideo,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { MyUILayout } from "./MyUILayout";
import { readBlurPreference } from "./BackgroundBlurButton";
import { useStreamVideo } from "@/hooks/data/use-stream-video";

interface VideoCallProps {
  userId: string;
  userName: string;
  userRole: string;
  userPhotoUrl?: string | null;
}

/**
 * VideoCall — Orchestrates the Stream SDK providers and renders the call UI.
 *
 * Mounted globally by GlobalVideoCall — survives navigation across the whole app.
 * Does NOT call any APIs — all data comes from useUserStore/useCallStore.
 *
 * Returns null while the client is initializing (no flash/loading spinner
 * since FloatCallButton already provides visual feedback on click).
 */
export function VideoCall({
  userId,
  userName,
  userRole,
  userPhotoUrl,
}: VideoCallProps) {
  const { client, call } = useStreamVideo(userId, userName, userPhotoUrl, userRole);
  // Lido uma vez: o provider só usa estes valores como padrão inicial.
  const [savedBlurLevel] = useState(readBlurPreference);

  if (!client || !call) {
    return null;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <BackgroundFiltersProvider
          backgroundFilter={savedBlurLevel ? "blur" : undefined}
          backgroundBlurLevel={savedBlurLevel ?? 8}
          // Modelo e wasm servidos de /public: o CSP não permite o unpkg padrão.
          basePath="/mediapipe"
          onError={(error) => console.error("[VideoCall] Background filter error:", error)}
        >
          <MyUILayout userName={userName} userRole={userRole} />
        </BackgroundFiltersProvider>
      </StreamCall>
    </StreamVideo>
  );
}

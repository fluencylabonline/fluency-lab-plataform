"use client";

import { useState, useEffect } from "react";
import { StreamVideoClient, type User } from "@stream-io/video-react-sdk";
import { useCallStore } from "@/hooks/data/use-call-store";

/**
 * useStreamVideo — Initializes and manages the StreamVideoClient lifecycle.
 *
 * Refactored from the original implementation:
 * - REMOVED: useSession() / next-auth dependency
 * - REMOVED: fetch("/api/token") — token already generated server-side in startCallAction
 * - REMOVED: useCallContext() — reads directly from useCallStore
 * - ADDED: userId / userName come as parameters (already available from RSC props)
 *
 * The client is created when callState becomes non-null and destroyed on cleanup.
 * Handles browser background throttling by using a mounted flag.
 *
 * @param userId - Authenticated user's Firebase UID (from RSC props)
 * @param userName - Authenticated user's display name (from RSC props)
 * @param userPhotoUrl - Authenticated user's photo URL (optional)
 * @param userRole - Authenticated user's role — used to pick the right cleanup on tab close
 */
export function useStreamVideo(
  userId: string,
  userName: string,
  userPhotoUrl?: string | null,
  userRole?: string
) {
  const { callState } = useCallStore();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<ReturnType<StreamVideoClient["call"]> | null>(null);

  // Best-effort cleanup when the tab/browser is closed abruptly: neither the
  // React unmount cleanup below nor the UI's leave/end handlers run reliably
  // in that case, which would otherwise leave the call session orphaned
  // (no endedAt in Neon). Only the teacher's tab close needs this: a
  // student closing their tab has nothing to clean up server-side anymore —
  // the call stays active for them to rejoin (see useCallStore.hidePanel).
  useEffect(() => {
    if (!callState?.callId || (userRole !== "teacher" && userRole !== "admin")) {
      return;
    }

    const handlePageHide = () => {
      const payload = JSON.stringify({
        callId: callState.callId,
        studentId: callState.studentId,
        notebookId: callState.notebookId,
      });
      navigator.sendBeacon?.(
        "/api/call/leave-beacon",
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [callState, userRole]);

  useEffect(() => {
    if (!callState?.callId || !callState?.streamToken || !callState?.apiKey) {
      return;
    }

    let mounted = true;
    let myClient: StreamVideoClient | null = null;

    const init = async () => {
      try {
        // No external fallback avatar: getstream.io's random_svg generator isn't
        // in the CSP img-src allowlist, and the SDK's Avatar component already
        // falls back to initials when `image` is undefined.
        const user: User = {
          id: userId,
          name: userName,
          image: userPhotoUrl || undefined,
        };

        const newClient = new StreamVideoClient(callState.apiKey);
        await newClient.connectUser(user, callState.streamToken);

        const newCall = newClient.call("default", callState.callId);

        await newCall.getOrCreate({
          data: {
            settings_override: {
              transcription: {
                mode: "auto-on",
                closed_caption_mode: "available",
                language: "auto",
              },
            },
          },
        });

        if (!mounted) {
          await newClient.disconnectUser();
          return;
        }

        myClient = newClient;
        setClient(newClient);
        setCall(newCall);
      } catch (error) {
        console.error("[useStreamVideo] Failed to initialize:", error);
      }
    };

    init();

    return () => {
      mounted = false;
      if (myClient) {
        myClient.disconnectUser().catch(console.error);
      }
      setClient(null);
      setCall(null);
    };
  }, [callState?.callId, callState?.streamToken, callState?.apiKey, userId, userName, userPhotoUrl]);

  return { client, call };
}

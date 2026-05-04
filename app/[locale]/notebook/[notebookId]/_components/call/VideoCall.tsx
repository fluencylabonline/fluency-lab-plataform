"use client";

import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { MyUILayout } from "./MyUILayout";
import { useStreamVideo } from "@/hooks/data/use-stream-video";

interface VideoCallProps {
  userId: string;
  userName: string;
  userRole: string;
  userPhotoUrl?: string | null;
  studentId: string;
  notebookId: string;
}

/**
 * VideoCall — Orchestrates the Stream SDK providers and renders the call UI.
 *
 * Replaces VideoHome.tsx from the original implementation.
 * Does NOT call any APIs — all data comes from props (RSC) and useCallStore.
 *
 * Returns null while the client is initializing (no flash/loading spinner
 * since FloatCallButton already provides visual feedback on click).
 */
export function VideoCall({
  userId,
  userName,
  userRole,
  userPhotoUrl,
  studentId,
  notebookId,
}: VideoCallProps) {
  const { client, call } = useStreamVideo(userId, userName, userPhotoUrl);

  if (!client || !call) {
    return null;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout
          userId={userId}
          userName={userName}
          userRole={userRole}
          studentId={studentId}
          notebookId={notebookId}
        />
      </StreamCall>
    </StreamVideo>
  );
}

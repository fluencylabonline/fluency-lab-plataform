"use client";

import dynamic from "next/dynamic";
import { useUserStore } from "@/modules/user/user.store";
import { useCallStore } from "@/hooks/data/use-call-store";

// O SDK de vídeo (e o CSS dele) e o listener do Firestore só são baixados
// quando realmente necessários: antes entravam no bundle de todas as páginas,
// inclusive landing e páginas públicas.
const VideoCall = dynamic(() => import("./VideoCall").then((m) => m.VideoCall), { ssr: false });
const StudentCallListener = dynamic(() => import("./StudentCallListener"), { ssr: false });

/**
 * GlobalVideoCall — mounted once in Providers, independent of route.
 *
 * Keeps the call listener (students) and the active call UI alive across
 * client-side navigation, so teachers/students can browse the rest of the
 * app (hub, other notebooks) without dropping an ongoing call.
 *
 * Renders nothing on public routes (no authenticated user) or before the
 * persisted user store has hydrated, to avoid a flash of stale call state.
 */
export function GlobalVideoCall() {
  const user = useUserStore((s) => s.user);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const callState = useCallStore((s) => s.callState);
  const isPanelHidden = useCallStore((s) => s.isPanelHidden);

  if (!hasHydrated || !user) {
    return null;
  }

  return (
    <>
      {user.role === "student" && <StudentCallListener userId={user.id} />}
      {callState && !isPanelHidden && (
        <VideoCall
          userId={user.id}
          userName={user.name}
          userRole={user.role}
          userPhotoUrl={user.photoUrl}
        />
      )}
    </>
  );
}

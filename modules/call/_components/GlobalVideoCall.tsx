"use client";

import { useUserStore } from "@/modules/user/user.store";
import { useCallStore } from "@/hooks/data/use-call-store";
import { useStudentCallListener } from "@/hooks/data/use-student-call-listener";
import { VideoCall } from "./VideoCall";

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

  useStudentCallListener(user?.id ?? "", hasHydrated && user?.role === "student");

  if (!hasHydrated || !user || !callState || isPanelHidden) {
    return null;
  }

  return (
    <VideoCall
      userId={user.id}
      userName={user.name}
      userRole={user.role}
      userPhotoUrl={user.photoUrl}
    />
  );
}

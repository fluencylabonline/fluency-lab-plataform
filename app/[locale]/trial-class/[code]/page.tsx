import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-server";
import { roomCodeSchema } from "@/modules/trial-call/trial-call.schema";
import { trialCallService } from "@/modules/trial-call/trial-call.service";
import { HostRoom } from "@/modules/trial-call/_components/HostRoom";
import { Lobby } from "@/modules/trial-call/_components/Lobby";

export const metadata: Metadata = { robots: { index: false, follow: false } };

interface TrialRoomPageProps {
  params: Promise<{ code: string }>;
}

export default async function TrialRoomPage({ params }: TrialRoomPageProps) {
  const { code } = await params;
  const t = await getTranslations("TrialClass.Closed");

  const state = roomCodeSchema.safeParse(code).success
    ? await trialCallService.getPublicState(code)
    : ({ status: "not_found" } as const);

  if (state.status !== "active") {
    const key = state.status === "ended" ? "ended" : "notFound";
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-sm space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t(`${key}Title`)}</h1>
          <p className="text-muted-foreground">{t(`${key}Text`)}</p>
        </div>
      </main>
    );
  }

  // O anfitrião logado entra direto; qualquer outra pessoa passa pelo lobby.
  const user = await getCurrentUser();
  if (user?.role === "admin") {
    const credentials = await trialCallService.getHostCredentials(code, { id: user.id, name: user.name });
    if (credentials) {
      const notes = await trialCallService.getNotes(code, user.id);
      return <HostRoom code={code} credentials={credentials} notes={notes} />;
    }
  }

  return <Lobby code={code} hostName={state.hostName} initialParticipants={state.participants} />;
}

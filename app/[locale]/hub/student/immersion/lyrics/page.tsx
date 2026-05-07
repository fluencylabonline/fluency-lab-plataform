import { getCurrentUser } from "@/lib/auth-server";
import { immersionService } from "@/modules/immersion/immersion.service";
import LyricsTrainingGame from "../_components/lyrics-training";
import { Header } from "@/components/layout/header";
import { LyricsTrainingState } from "@/modules/immersion/immersion.types";

export default async function LyricsTrainingPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch initial progress from server
  const progressRecord = await immersionService.getProgress(user.id, "lyrics-training");
  
  // Cast state safely to LyricsTrainingState or null
  const progress = progressRecord?.state 
    ? (progressRecord.state as unknown as LyricsTrainingState) 
    : null;

  return (
    <div className="flex flex-col min-h-dvh">
      <Header 
        title="Lyrics Training" 
        backHref="/hub/student/immersion"
      />
      <main className="flex-1 overflow-y-auto">
        <LyricsTrainingGame 
          initialProgress={progress}
        />
      </main>
    </div>
  );
}

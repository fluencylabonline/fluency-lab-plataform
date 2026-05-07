import { getCurrentUser } from "@/lib/auth-server";
import { immersionService } from "@/modules/immersion/immersion.service";
import LyricsTrainingGame from "../_components/lyrics-training";
import { LyricsTrainingState } from "@/modules/immersion/immersion.types";

export default async function LyricsTrainingPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const progressRecord = await immersionService.getProgress(user.id, "lyrics-training");
  
  const progress = progressRecord?.state 
    ? (progressRecord.state as unknown as LyricsTrainingState) 
    : null;

  return (
    <LyricsTrainingGame 
      initialProgress={progress}
    />
  );
}

import { getCurrentUser } from "@/lib/auth-server";
import { immersionService } from "@/modules/immersion/immersion.service";
import WordleGame from "../_components/wordle";
import { WordleState, PlayedEntry } from "@/modules/immersion/immersion.types";

export default async function WordlePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const progressRecord = await immersionService.getProgress(user.id, "wordle");
  
  const progress = progressRecord?.state 
    ? (progressRecord.state as unknown as WordleState) 
    : null;
  
  const selectedLang = progressRecord?.lang || "en";
  const availableWords = await immersionService.getAvailableWords(user.id, selectedLang);

  const historyRecords = await immersionService.getHistory(user.id, "wordle");
  
  const history: PlayedEntry[] = historyRecords.map(h => ({
    word: h.word,
    ts: h.playedAt.getTime(),
    success: h.success,
    attempts: h.attempts,
    lang: h.lang,
    length: h.word.length,
    metadata: (h.metadata as Record<string, unknown>) || {}
  }));

  return (
    <WordleGame 
      initialProgress={progress}
      initialAvailableWords={availableWords}
      initialHistory={history}
      selectedLang={selectedLang}
    />
  );
}

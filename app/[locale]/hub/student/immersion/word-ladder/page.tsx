import { getCurrentUser } from "@/lib/auth-server";
import { immersionService } from "@/modules/immersion/immersion.service";
import WordLadderGame from "../_components/word-ladder";
import { Header } from "@/components/layout/header";
import { WordLadderState, PlayedEntry } from "@/modules/immersion/immersion.types";

export default async function WordLadderPage() {
  const user = await getCurrentUser();
  if (!user) return null;


  // Fetch initial progress from server
  const progressRecord = await immersionService.getProgress(user.id, "word-ladder");
  
  // Cast state safely to WordLadderState or null
  const progress = progressRecord?.state 
    ? (progressRecord.state as unknown as WordLadderState) 
    : null;
  
  // Get available words for the user's selected language
  const selectedLang = progressRecord?.lang || "en";
  const availableWords = await immersionService.getAvailableWords(user.id, selectedLang);

  // Fetch history
  const historyRecords = await immersionService.getHistory(user.id, "word-ladder");
  
  // Transform DB records into PlayedEntry[]
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
    <div className="flex flex-col min-h-dvh">
      <Header 
        title="Word Ladder" 
        backHref="/hub/student/immersion"
      />
      <main className="flex-1 overflow-y-auto">
        <WordLadderGame 
          initialProgress={progress}
          initialAvailableWords={availableWords}
          initialHistory={history}
          selectedLang={selectedLang}
        />
      </main>
    </div>
  );
}

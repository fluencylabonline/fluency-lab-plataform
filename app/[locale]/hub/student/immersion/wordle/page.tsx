import { getCurrentUser } from "@/lib/auth-server";
import { immersionService } from "@/modules/immersion/immersion.service";
import WordleGame from "../_components/wordle";
import { Header } from "@/components/layout/header";
import { WordleState, PlayedEntry } from "@/modules/immersion/immersion.types";

export default async function WordlePage() {
  const user = await getCurrentUser();
  if (!user) return null;


  // Fetch initial progress from server
  const progressRecord = await immersionService.getProgress(user.id, "wordle");
  
  // Cast state safely to WordleState or null
  // We use a double cast to satisfy TS if the jsonb type is unknown
  const progress = progressRecord?.state 
    ? (progressRecord.state as unknown as WordleState) 
    : null;
  
  // Get available words for the user's selected language
  // Default to English if no progress yet
  const selectedLang = progressRecord?.lang || "en";
  const availableWords = await immersionService.getAvailableWords(user.id, selectedLang);

  // Fetch history
  const historyRecords = await immersionService.getHistory(user.id, "wordle");
  
  // Transform DB records into PlayedEntry[] with safer type casting
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
        title="Wordle" 
        backHref="/hub/student/immersion"
      />
      <main className="flex-1 overflow-y-auto">
        <WordleGame 
          initialProgress={progress}
          initialAvailableWords={availableWords}
          initialHistory={history}
          selectedLang={selectedLang}
        />
      </main>
    </div>
  );
}

/**
 * Parses GetStream JSONL transcription text into human-readable formatted dialogue.
 * `labelFor` maps a Stream user id to the speaker label ("Aluno", "Professor"…);
 * unknown ids are printed raw and lines without an id as "Sistema".
 */
export function parseStreamTranscript(rawText: string, labelFor: (userId: string) => string | undefined): string {
  try {
    const lines = rawText.trim().split("\n");
    const formattedLines = lines
      .map((line) => {
        if (!line.trim()) return "";
        try {
          const parsed = JSON.parse(line);
          const text = parsed.text || parsed.alternative?.transcript || "";
          if (!text) return "";
          const rawUserId = parsed.speaker_id || parsed.user_id || parsed.user?.id;
          const speaker = rawUserId ? (labelFor(rawUserId) ?? rawUserId) : "Sistema";
          return `[${speaker}]: ${text}`;
        } catch (e) {
          console.error("[call.transcript] Error parsing transcription line:", e);
          return "";
        }
      })
      .filter(Boolean);

    return formattedLines.join("\n");
  } catch (error) {
    console.error("[call.transcript] Failed to parse transcription:", error);
    return rawText;
  }
}

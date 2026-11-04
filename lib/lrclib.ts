/**
 * Busca a letra sincronizada (LRC) no LrcLib. Diferencia "música sem letra"
 * de "serviço fora do ar/timeout", para a UI não dizer que a letra não existe
 * quando o problema é o terceiro.
 */
export type SyncedLyricsResult =
  | { status: "ok"; lyrics: string }
  | { status: "not_found" }
  | { status: "error" };

export async function fetchSyncedLyrics(track: string, artist: string, timeoutMs = 10_000): Promise<SyncedLyricsResult> {
  try {
    const q = new URLSearchParams({ track_name: track, artist_name: artist });
    const r = await fetch(`https://lrclib.net/api/search?${q.toString()}`, { signal: AbortSignal.timeout(timeoutMs) });
    if (r.status === 404) return { status: "not_found" };
    if (!r.ok) return { status: "error" };
    const arr: unknown = await r.json();
    if (!Array.isArray(arr)) return { status: "error" };
    const item = arr.find((x): x is { syncedLyrics: string } => {
      if (!x || typeof x !== "object") return false;
      const candidate = x as Record<string, unknown>;
      return typeof candidate.syncedLyrics === "string" && candidate.syncedLyrics.length > 0;
    });
    return item ? { status: "ok", lyrics: item.syncedLyrics } : { status: "not_found" };
  } catch {
    return { status: "error" };
  }
}

export type PersistedLyricsTrainingState = {
  selectedLang: string;
  videoUrl: string;
  track: string;
  artist: string;
  lrc: string;
  pauseEvery: 1 | 2;
  currentIndex: number;
  score: number;
  streak: number;
  savedAt: number;
};

export const LYRICS_TRAINING_PERSIST_KEY = "immersion_lyrics_training_progress";
export const LYRICS_TRAINING_PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type LrcLine = { ms: number; text: string };

function normalizeLang(input: unknown): string {
  const base =
    typeof input === "string" ? input.trim().toLowerCase().split("-")[0] : "en";
  return base || "en";
}

function normalizeText(input: unknown, maxLen: number): string {
  if (typeof input !== "string") return "";
  const s = input.trim();
  if (s.length > maxLen) return s.slice(0, maxLen);
  return s;
}

function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes("youtube.com") || host === "youtu.be";
  } catch {
    return false;
  }
}

function parseLrc(lrc: string): LrcLine[] {
  const lines = lrc.split(/\r?\n/);
  const out: LrcLine[] = [];
  for (const line of lines) {
    const m = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/);
    if (!m) continue;
    const ms =
      parseInt(m[1], 10) * 60000 +
      parseInt(m[2], 10) * 1000 +
      (m[3] ? parseInt(m[3], 10) : 0) * 10;
    const text = m[4].trim();
    if (text) out.push({ ms, text });
  }
  return out.sort((a, b) => a.ms - b.ms);
}

export function loadPersistedLyricsTrainingState(): PersistedLyricsTrainingState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LYRICS_TRAINING_PERSIST_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (!data) return null;
    if (typeof data.savedAt !== "number") return null;
    if (Date.now() - data.savedAt > LYRICS_TRAINING_PERSIST_TTL_MS) {
      localStorage.removeItem(LYRICS_TRAINING_PERSIST_KEY);
      return null;
    }

    const videoUrl = normalizeText(data.videoUrl, 500);
    if (!videoUrl || !isValidYouTubeUrl(videoUrl)) return null;

    const track = normalizeText(data.track, 120);
    const artist = normalizeText(data.artist, 120);
    const lrc = typeof data.lrc === "string" ? data.lrc : "";
    const lines = parseLrc(lrc);
    if (!lines.length) return null;

    const pauseEvery = data.pauseEvery === 2 ? 2 : 1;
    const currentIndex =
      typeof data.currentIndex === "number"
        ? Math.max(0, Math.min(lines.length - 1, Math.floor(data.currentIndex)))
        : 0;

    const score =
      typeof data.score === "number" ? Math.max(0, Math.floor(data.score)) : 0;
    const streak =
      typeof data.streak === "number"
        ? Math.max(0, Math.floor(data.streak))
        : 0;

    const selectedLang = normalizeLang(data.selectedLang);

    return {
      selectedLang,
      videoUrl,
      track,
      artist,
      lrc,
      pauseEvery,
      currentIndex,
      score,
      streak,
      savedAt: data.savedAt,
    };
  } catch {
    return null;
  }
}

export function savePersistedLyricsTrainingState(
  state: Omit<PersistedLyricsTrainingState, "savedAt">
) {
  if (typeof window === "undefined") return;
  const payload: PersistedLyricsTrainingState = {
    ...state,
    savedAt: Date.now(),
  };
  localStorage.setItem(LYRICS_TRAINING_PERSIST_KEY, JSON.stringify(payload));
}

export function clearPersistedLyricsTrainingState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LYRICS_TRAINING_PERSIST_KEY);
}

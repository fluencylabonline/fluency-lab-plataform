/**
 * Links de vídeo das lições: só YouTube, Google Drive e Firebase Storage, em https.
 * Qualquer outro texto virava o `src` do iframe (URL relativa da própria página),
 * bloqueado pela CSP e deixando o player em branco para o aluno.
 */
export type VideoProvider = "youtube" | "drive" | "storage";

export const VIDEO_URL_MAX = 2048;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const STORAGE_HOSTS = new Set(["firebasestorage.googleapis.com", "storage.googleapis.com"]);

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractDriveId(url: URL): string | null {
  const byPath = url.pathname.match(/\/file\/d\/([\w-]+)/);
  if (byPath) return byPath[1];
  return url.searchParams.get("id");
}

export function parseVideoUrl(raw: string): { provider: VideoProvider; url: string; embedUrl: string } | null {
  const value = raw.trim();
  if (!value || value.length > VIDEO_URL_MAX) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const id = extractYouTubeId(value);
    return id ? { provider: "youtube", url: value, embedUrl: `https://www.youtube.com/embed/${id}` } : null;
  }
  if (url.hostname === "drive.google.com") {
    const id = extractDriveId(url);
    return id ? { provider: "drive", url: value, embedUrl: `https://drive.google.com/file/d/${id}/preview` } : null;
  }
  if (STORAGE_HOSTS.has(url.hostname)) {
    return { provider: "storage", url: value, embedUrl: value };
  }
  return null;
}

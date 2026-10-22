"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { trackImageDownloadAction } from "@/modules/media/media.actions";
import type { ImageCredit } from "@/modules/curriculum/curriculum.types";

/** Fotos já registradas nesta sessão do navegador (um evento de download por foto). */
const tracked = new Set<string>();

/** Registra o "download" no Unsplash na primeira vez que a foto é exibida. */
export function useTrackUnsplashDownload(credit?: ImageCredit | null, enabled = true) {
  const location = credit?.downloadLocation;
  useEffect(() => {
    if (!enabled || !location || tracked.has(location)) return;
    tracked.add(location);
    void trackImageDownloadAction({ downloadLocation: location }).catch(() => tracked.delete(location));
  }, [location, enabled]);
}

interface UnsplashCreditProps {
  credit?: ImageCredit | null;
  className?: string;
}

/** "Foto de Fulano no Unsplash", com os dois links (exigência do Unsplash). */
export function UnsplashCredit({ credit, className }: UnsplashCreditProps) {
  const t = useTranslations("ImageCredit");
  if (!credit) return null;

  const linkClass = "underline underline-offset-2 hover:text-white";
  // stopPropagation: o crédito fica dentro de cartões clicáveis (virar flashcard).
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <p
      className={cn(
        "pointer-events-auto absolute bottom-1.5 left-1.5 z-10 max-w-[92%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] leading-tight text-white/90 backdrop-blur-sm",
        className
      )}
      onClick={stop}
    >
      {t.rich("photoBy", {
        name: credit.photographer,
        author: (chunks) => (
          <a href={credit.photographerUrl} target="_blank" rel="noopener noreferrer" className={linkClass} onClick={stop}>
            {chunks}
          </a>
        ),
        unsplash: (chunks) => (
          <a href="https://unsplash.com/?utm_source=fluencylab&utm_medium=referral" target="_blank" rel="noopener noreferrer" className={linkClass} onClick={stop}>
            {chunks}
          </a>
        ),
      })}
    </p>
  );
}

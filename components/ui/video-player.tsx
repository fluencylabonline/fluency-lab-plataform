"use client";

import { cn } from "@/lib/utils";
import { parseVideoUrl } from "@/lib/video-url";

interface VideoPlayerProps {
  url: string;
  provider: "youtube" | "drive" | "storage";
  className?: string;
}

export function VideoPlayer({ url, className }: VideoPlayerProps) {
  // Link inválido (texto solto, host não suportado) não vira iframe: antes a página
  // tentava embutir a si mesma e a CSP bloqueava, deixando o quadro em branco.
  const parsed = parseVideoUrl(url);

  return (
    <div className={cn("relative aspect-video w-full bg-black rounded-2xl overflow-hidden", className)}>
      {parsed ? (
        <iframe
          src={parsed.embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
          Vídeo indisponível / Video unavailable
        </div>
      )}
    </div>
  );
}

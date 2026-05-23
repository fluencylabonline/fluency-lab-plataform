"use client";

import { useState } from "react";
import { WhatsAppMessage } from "../communication.types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageCircle, Check, CheckCheck, FileText, Download, X, Film } from "lucide-react";

interface MediaMetadata {
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  voice?: boolean;
}

interface MessageBubbleProps {
  msg: WhatsAppMessage;
}

export function MessageBubble({ msg }: MessageBubbleProps) {
  const isOut = msg.direction === "outbound";
  const isTemplate = msg.content?.startsWith("[Template:");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Safe parsing of metadata JSON
  const meta = (msg.metadata as MediaMetadata) || {};
  const mediaId = meta.mediaId;
  const mimeType = meta.mimeType || "";
  const caption = meta.caption;
  const filename = meta.filename;

  const renderMediaContent = () => {
    if (!mediaId) return <p className="whitespace-pre-line">{msg.content}</p>;

    switch (msg.type) {
      case "image":
        return (
          <div className="space-y-2">
            <div
              className="relative rounded-xl overflow-hidden border border-border/10 cursor-zoom-in max-w-full bg-muted/20"
              onClick={() => setIsLightboxOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/communication/media/${mediaId}`}
                alt={caption || "Imagem do WhatsApp"}
                className="w-full h-auto max-h-[260px] object-cover transition-all hover:scale-[1.02] duration-300"
                loading="lazy"
              />
            </div>
            {caption && <p className="whitespace-pre-line mt-1 text-[13.5px] leading-relaxed">{caption}</p>}

            {/* Premium Fullscreen Lightbox */}
            {isLightboxOpen && (
              <div
                className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                onClick={() => setIsLightboxOpen(false)}
              >
                <button
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95"
                  onClick={() => setIsLightboxOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/communication/media/${mediaId}`}
                  alt={caption || "Imagem ampliada"}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                />
                {caption && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs px-5 py-2.5 rounded-full max-w-[80%] text-center leading-snug">
                    {caption}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="flex flex-col gap-1 py-0.5 min-w-[240px] md:min-w-[290px]">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none mb-1">
              {meta.voice ? "🎙️ Mensagem de Voz" : "🎵 Arquivo de Áudio"}
            </span>
            <audio
              src={`/api/communication/media/${mediaId}`}
              controls
              className="w-full h-8 accent-primary"
            />
          </div>
        );

      case "document":
        return (
          <div className="min-w-[240px] md:min-w-[290px]">
            <a
              href={`/api/communication/media/${mediaId}`}
              download={filename || "documento"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/40 dark:bg-black/20 dark:hover:bg-black/35 rounded-xl border border-border/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate text-foreground leading-snug">{filename || "Documento"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5 font-medium">
                  {mimeType.split("/")[1] || "ARQUIVO"}
                </p>
              </div>
              <div className="p-1.5 rounded-full hover:bg-background shrink-0 transition-colors">
                <Download className="w-4 h-4 text-muted-foreground" />
              </div>
            </a>
            {caption && <p className="whitespace-pre-line mt-2 text-[13.5px] leading-relaxed">{caption}</p>}
          </div>
        );

      case "video":
        return (
          <div className="space-y-2 max-w-[340px]">
            <div className="rounded-xl overflow-hidden border border-border/10 bg-muted/20">
              <video
                src={`/api/communication/media/${mediaId}`}
                controls
                className="w-full max-h-[240px] object-cover"
                poster={`/api/communication/media/${mediaId}#t=0.5`}
              />
            </div>
            {caption && <p className="whitespace-pre-line mt-1 text-[13.5px] leading-relaxed">{caption}</p>}
          </div>
        );

      default:
        // Fallback for other media types (like sticker, etc.)
        return (
          <div className="flex items-center gap-2 py-1">
            <Film className="w-4 h-4 text-muted-foreground" />
            <span className="italic text-muted-foreground">Mídia não suportada ({msg.type})</span>
          </div>
        );
    }
  };

  return (
    <div className={cn("flex w-full relative z-10", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[78%] md:max-w-[62%] px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm",
          isOut
            ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tr-sm border border-emerald-200/20"
            : "bg-[#ffffff] dark:bg-[#202c33] border border-border/10 dark:border-none text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-sm"
        )}
      >
        {isTemplate ? (
          <div className="flex flex-col gap-1.5">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md w-fit",
                isOut
                  ? "bg-[#005c4b]/10 dark:bg-white/10 text-[#005c4b] dark:text-emerald-300"
                  : "bg-primary/10 text-primary"
              )}
            >
              <MessageCircle className="w-3 h-3" />
              Template
            </div>
            <p className="font-mono text-xs opacity-90 leading-snug">{msg.content}</p>
          </div>
        ) : (
          renderMediaContent()
        )}

        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1.5 text-[10px] select-none opacity-70",
            isOut ? "text-[#111b21] dark:text-[#e9edef]" : "text-muted-foreground"
          )}
        >
          {format(new Date(msg.createdAt), "HH:mm")}
          {isOut && (
            msg.status === "read"
              ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
              : <Check className="w-3.5 h-3.5 opacity-60" />
          )}
        </div>
      </div>
    </div>
  );
}

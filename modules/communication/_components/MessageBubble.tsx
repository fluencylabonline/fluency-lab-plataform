"use client";

import { useState, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { WhatsAppMessage, WhatsAppTemplate } from "../communication.types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageCircle, Check, CheckCheck, FileText, Download, X, Film, RotateCcw, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { notify } from "@/components/ui/toaster";
import { resendWhatsAppMessageAction } from "../communication.actions";

interface MediaMetadata {
  mediaId?: string;
  mediaUrl?: string;
  mimeType?: string;
  caption?: string;
  filename?: string;
  voice?: boolean;
}

interface WhatsAppMessageMetadata {
  components?: {
    type?: string;
    parameters?: {
      type?: string;
      text?: string;
      action?: {
        order_details?: {
          payment_settings?: {
            type: string;
            pix_dynamic_code?: {
              code: string;
            };
          }[];
        };
      };
    }[];
  }[];
}

interface MessageBubbleProps {
  msg: WhatsAppMessage;
  templates?: WhatsAppTemplate[];
  onResendSuccess?: () => void;
}

function MessageBubbleComponent({ msg, templates = [], onResendSuccess }: MessageBubbleProps) {
  const isOut = msg.direction === "outbound";
  const isTemplate = msg.content?.startsWith("[Template:");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isResending) return;

    setIsResending(true);
    try {
      const res = await resendWhatsAppMessageAction({ messageId: msg.id });
      if (res?.data?.success) {
        notify.success("Mensagem reenviada com sucesso!");
        onResendSuccess?.();
      } else {
        notify.error(res?.data?.error || "Falha ao reenviar mensagem.");
      }
    } catch (err) {
      console.error("[MessageBubble] Error resending message:", err);
      notify.error("Erro técnico ao reenviar mensagem.");
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  const [copiedPix, setCopiedPix] = useState(false);

  // Safe parsing of metadata JSON
  const meta = (msg.metadata as MediaMetadata) || {};
  const mediaId = meta.mediaId;
  const mimeType = meta.mimeType || "";
  const caption = meta.caption;
  const filename = meta.filename;

  const getPixPayload = (content: string | null, metadata: unknown): string | null => {
    if (content?.startsWith("000201")) return content;
    if (metadata && typeof metadata === "object") {
      const metaObj = metadata as WhatsAppMessageMetadata;
      const comps = metaObj.components || [];
      for (const comp of comps) {
        const params = comp.parameters || [];
        for (const param of params) {
          if (typeof param.text === "string" && param.text.startsWith("000201")) {
            return param.text;
          }
          if (param.type === "action" && param.action?.order_details?.payment_settings) {
            const settings = param.action.order_details.payment_settings;
            for (const s of settings) {
              if (s.type === "pix_dynamic_code" && s.pix_dynamic_code?.code) {
                return s.pix_dynamic_code.code;
               }
            }
          }
        }
      }
    }
    if (content) {
      const match = content.match(/000201[a-zA-Z0-9_\-\.\=\+\/\s]+/);
      if (match) return match[0];
    }
    return null;
  };

  const pixPayload = getPixPayload(msg.content, msg.metadata);

  const renderMediaContent = () => {
    if (msg.type === "text" || msg.type === "template") {
      const isPix = msg.content?.startsWith("000201");
      if (isPix) {
        return (
          <div className="space-y-2.5">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">Pagamento Pix Recebido/Enviado</p>
            <p className="text-xs text-muted-foreground select-all break-all">{msg.content}</p>
          </div>
        );
      }
      return <p className="whitespace-pre-line">{msg.content}</p>;
    }

    const sourceUrl = meta.mediaUrl || `/api/communication/media/${mediaId}`;

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
                src={sourceUrl}
                alt={caption || "Imagem do WhatsApp"}
                className="w-full h-auto max-h-[260px] object-cover transition-all hover:scale-[1.02] duration-300"
                loading="lazy"
              />
            </div>
            {caption && <p className="whitespace-pre-line mt-1 text-[13.5px] leading-relaxed">{caption}</p>}

            {/* Premium Fullscreen Lightbox */}
            {isLightboxOpen && typeof document !== "undefined" && createPortal(
              <div
                className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                onClick={() => setIsLightboxOpen(false)}
              >
                <button
                  type="button"
                  aria-label="Fechar visualização"
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95 z-10"
                  onClick={() => setIsLightboxOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sourceUrl}
                  alt={caption || "Imagem ampliada"}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                />
                {caption && (
                  <div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm border border-white/10 text-white text-xs px-5 py-2.5 rounded-full max-w-[80%] text-center leading-snug"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {caption}
                  </div>
                )}
              </div>,
              document.body
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
              src={sourceUrl}
              controls
              className="w-full h-8 accent-primary"
            />
          </div>
        );

      case "document":
        return (
          <div className="min-w-[240px] md:min-w-[290px]">
            <a
              href={sourceUrl}
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
                src={sourceUrl}
                controls
                className="w-full max-h-[240px] object-cover"
                poster={`${sourceUrl}#t=0.5`}
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
            <p className="text-[13px] opacity-90 leading-snug whitespace-pre-wrap">
              {(() => {
                if (isTemplate) {
                  const match = msg.content?.match(/\[Template:\s*(.+?)\]/);
                  if (match && match[1]) {
                    const templateName = match[1];
                    const template = templates.find((t) => t.name === templateName);
                    if (template) {
                      const bodyComp = template.components.find((c) => c.type === "BODY");
                      if (bodyComp?.text) {
                        let interpolated = bodyComp.text;
                        const metadataComps = (msg.metadata as WhatsAppMessageMetadata)?.components || [];
                        const bodyParams = metadataComps.find((c) => c.type === "body" || c.type === "BODY")?.parameters || [];
                        if (bodyParams.length > 0) {
                          bodyParams.forEach((param, idx: number) => {
                            interpolated = interpolated.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), param.text || '');
                          });
                          return interpolated;
                        }
                        return bodyComp.text;
                      }
                      return msg.content;
                    } else {
                      // Template não encontrado
                      return "⚠️ [Template não disponível]";
                    }
                  }
                }
                return msg.content;
              })()}
            </p>
          </div>
        ) : (
          renderMediaContent()
        )}

        {pixPayload && (
          <div className="mt-3 p-3 bg-[#ffffff] dark:bg-[#182229] rounded-xl border border-emerald-500/20 dark:border-border/30 space-y-2.5 max-w-[200px] mx-auto animate-in fade-in slide-in-from-top-1 text-center">
            <span className="text-[9px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider block">⚡ QR Code Pix</span>
            <div className="flex justify-center bg-white p-2 rounded-lg border border-border/10">
              <QRCodeSVG value={pixPayload} size={110} />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(pixPayload);
                setCopiedPix(true);
                notify.success("Código Pix copiado!");
                setTimeout(() => setCopiedPix(false), 2000);
              }}
              className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg bg-[#00a884] hover:bg-[#008f72] text-white transition-all active:scale-[0.98]"
            >
              {copiedPix ? "Copiado!" : "Copiar Pix"}
            </button>
          </div>
        )}

        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1.5 text-[10px] select-none opacity-70",
            isOut ? "text-[#111b21] dark:text-[#e9edef]" : "text-muted-foreground"
          )}
        >
          {(() => {
            try {
              //eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawDate = msg.createdAt || (msg as any).created_at;
              const dateVal = rawDate ? new Date(rawDate) : new Date();
              return isNaN(dateVal.getTime()) ? "" : format(dateVal, "HH:mm");
            } catch (err) {
              console.error("[MessageBubble] Error formatting time:", err);
              return "";
            }
          })()}
          {isOut && (
            msg.status === "read" ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            ) : msg.status === "delivered" ? (
              <CheckCheck className="w-3.5 h-3.5 text-muted-foreground opacity-80" />
            ) : msg.status === "sent" ? (
              <Check className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
            ) : msg.status === "failed" ? (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-red-500 text-[10px] font-bold inline-flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                  Falhou
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-bold text-[10px] border border-red-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Tentar reenviar mensagem via WhatsApp"
                >
                  <RotateCcw className={cn("w-3 h-3", isResending && "animate-spin")} />
                  {isResending ? "Reenviando..." : "Reenviar"}
                </button>
              </div>
            ) : (
              <Check className="w-3.5 h-3.5 text-muted-foreground opacity-30 animate-pulse" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// `onResendSuccess` is a fresh closure on every parent render, and `templates`
// only changes when the templates SWR cache re-fetches — comparing the fields
// that actually change a message's appearance avoids re-rendering the whole
// message list on every conversation/messages poll.
function areMessageBubblePropsEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  return (
    prev.msg.id === next.msg.id &&
    prev.msg.status === next.msg.status &&
    prev.msg.content === next.msg.content &&
    prev.msg.createdAt === next.msg.createdAt &&
    prev.templates === next.templates
  );
}

export const MessageBubble = memo(MessageBubbleComponent, areMessageBubblePropsEqual);

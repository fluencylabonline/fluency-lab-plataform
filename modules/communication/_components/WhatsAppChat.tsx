"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  getWhatsAppConversationsAction,
  getWhatsAppMessagesAction,
  sendWhatsAppTextMessageAction,
  markWhatsAppConversationAsReadAction,
  updateWhatsAppContactNameAction,
  updateWhatsAppConversationLabelsAction
} from "@/modules/communication/communication.actions";
import { WhatsAppConversation, WhatsAppMessage, WhatsAppLabel } from "@/modules/communication/communication.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody
} from "@/components/ui/vault";
import {
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  ChevronLeft,
  Search,
  Loader2,
  Wifi,
  Tag,
  Plus,
  X,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { notify } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/ui/use-device";
import { cn } from "@/lib/utils";

// ─── Colors mapping for WhatsApp Business-like Labels ─────────────────────────

const LABEL_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  blue: { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", hex: "#0070f3" },
  orange: { bg: "bg-orange-500/10 dark:bg-orange-500/15", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", hex: "#f5a623" },
  green: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-[#00a884] dark:text-emerald-400", border: "border-emerald-500/20", hex: "#00a884" },
  red: { bg: "bg-red-500/10 dark:bg-red-500/15", text: "text-red-600 dark:text-red-400", border: "border-red-500/20", hex: "#ff0055" },
  purple: { bg: "bg-purple-500/10 dark:bg-purple-500/15", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20", hex: "#7928ca" },
  yellow: { bg: "bg-yellow-500/10 dark:bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/20", hex: "#e3b300" },
};

const DEFAULT_LABELS: WhatsAppLabel[] = [
  { id: "1", name: "Novo Aluno", color: "blue" },
  { id: "2", name: "Aguardando", color: "orange" },
  { id: "3", name: "Pago", color: "green" },
  { id: "4", name: "Importante", color: "red" },
  { id: "5", name: "Lead Frio", color: "purple" },
];

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ seed, name, size = 40 }: { seed: string; name?: string | null; size?: number }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 50) % 360;

  // Extract initials if name is available, otherwise default to phone digits
  let label = "WA";
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      label = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts[0]) {
      label = parts[0].slice(0, 2).toUpperCase();
    }
  } else {
    label = seed.replace(/\D/g, "").slice(-4) || "WA";
  }

  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold select-none shadow-sm"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.33,
        background: `linear-gradient(135deg, hsl(${h1},68%,58%), hsl(${h2},80%,42%))`,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </div>
  );
}

// ─── Timestamp pill ───────────────────────────────────────────────────────────

function TimestampPill({ date }: { date: Date }) {
  return (
    <div className="flex justify-center my-4 relative z-10">
      <span className="px-3 py-1 rounded-full bg-[#ffffff] dark:bg-[#182229] shadow-sm text-[11px] font-medium text-muted-foreground tracking-wide border border-border/10">
        {format(date, "dd/MM/yyyy")}
      </span>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: WhatsAppMessage }) {
  const isOut = msg.direction === "outbound";
  const isTemplate = msg.content?.startsWith("[Template:");

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
          <p className="whitespace-pre-line">{msg.content}</p>
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

// ─── Conversation list item ───────────────────────────────────────────────────

function ConvItem({
  conv,
  isSelected,
  onClick,
}: {
  conv: WhatsAppConversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const displayName = conv.studentName || conv.contactName || `+${conv.waId}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3.5 flex items-center gap-3 transition-colors text-left border-b border-border/30 relative",
        "hover:bg-muted/50 active:bg-muted/80",
        isSelected && "bg-primary/8 border-l-[3px] border-l-primary"
      )}
    >
      <Avatar seed={conv.waId} name={displayName} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span
            className={cn(
              "text-[13.5px] truncate text-foreground",
              conv.unreadCount > 0 ? "font-bold" : "font-medium"
            )}
          >
            {displayName}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
            {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "HH:mm") : ""}
          </span>
        </div>

        {/* Labels list */}
        {conv.labels && conv.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1 animate-in fade-in duration-200">
            {conv.labels.map((lbl: WhatsAppLabel) => {
              const colors = LABEL_COLORS[lbl.color] || LABEL_COLORS.blue;
              return (
                <span
                  key={lbl.id}
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md border",
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  {lbl.name}
                </span>
              );
            })}
          </div>
        )}

        <p
          className={cn(
            "text-xs truncate",
            conv.unreadCount > 0
              ? "text-foreground font-medium"
              : "text-muted-foreground italic"
          )}
        >
          {conv.lastMessageContent || "Sem mensagens"}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <div className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
        </div>
      )}
    </button>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ConvSkeleton() {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border/30 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-muted-foreground/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-muted-foreground/10 rounded w-2/5" />
        <div className="h-3 bg-muted-foreground/10 rounded w-3/5" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 select-none">
      <div className="w-20 h-20 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center mb-5">
        <MessageCircle className="w-9 h-9 text-primary/60" />
      </div>
      <h3 className="font-semibold text-base text-foreground mb-2">Central de Atendimento</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
        Selecione uma conversa para visualizar mensagens e responder em tempo real.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WhatsAppChat() {
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Contact details & Labels Drawer properties
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [contactNameInput, setContactNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Available labels loaded from localStorage to support persistent custom tags
  const [availableLabels, setAvailableLabels] = useState<WhatsAppLabel[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("whatsapp-custom-labels");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_LABELS;
        }
      }
    }
    return DEFAULT_LABELS;
  });

  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("blue");
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  useEffect(() => {
    localStorage.setItem("whatsapp-custom-labels", JSON.stringify(availableLabels));
  }, [availableLabels]);

  const { data: conversations, mutate: mutateConvs, isLoading: isLoadingConvs } = useSWR(
    "whatsapp-conversations",
    async () => {
      const result = await getWhatsAppConversationsAction();
      return (result?.data as unknown as WhatsAppConversation[]) || [];
    },
    { refreshInterval: 5000 }
  );

  const { data: messages, mutate: mutateMessages, isLoading: isLoadingMessages } = useSWR(
    selectedConv ? `whatsapp-messages-${selectedConv.id}` : null,
    async () => {
      const result = await getWhatsAppMessagesAction({ conversationId: selectedConv!.id });
      return (result?.data || []).reverse();
    },
    { refreshInterval: 3000 }
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync details input when contact is switched
  useEffect(() => {
    if (selectedConv) {
      setContactNameInput(selectedConv.contactName || "");
    } else {
      setIsDetailsOpen(false);
    }
  }, [selectedConv]);

  const handleSelectConv = async (conv: WhatsAppConversation) => {
    setSelectedConv(conv);
    if (conv.unreadCount > 0) {
      await markWhatsAppConversationAsReadAction({ conversationId: conv.id });
      mutateConvs();
    }
    // Focus input after a tick (avoids layout shift on mobile)
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleBack = () => setSelectedConv(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv || isSending) return;

    setIsSending(true);
    try {
      const result = await sendWhatsAppTextMessageAction({
        to: selectedConv.waId,
        text: messageText,
      });

      if (result?.data) {
        setMessageText("");
        mutateMessages();
        mutateConvs();
      } else {
        notify.error("Erro ao enviar mensagem. Verifique se está dentro da janela de 24h.");
      }
    } catch {
      notify.error("Erro técnico ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  // Save Name details
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv) return;

    setIsSavingName(true);
    try {
      const result = await updateWhatsAppContactNameAction({
        conversationId: selectedConv.id,
        name: contactNameInput.trim(),
      });

      if (result?.data?.success) {
        // Sync local selected conversation state
        const updated = { ...selectedConv, contactName: contactNameInput.trim() };
        setSelectedConv(updated);
        mutateConvs(); // Refresh sidebar list instantly!
        notify.success("Nome atualizado com sucesso!");
      } else {
        notify.error("Erro ao atualizar o nome.");
      }
    } catch {
      notify.error("Erro técnico ao atualizar nome.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Toggle checklist label
  const handleToggleLabel = async (lbl: WhatsAppLabel, isChecked: boolean) => {
    if (!selectedConv) return;

    const currentLabels = selectedConv.labels || [];
    let updatedLabels: WhatsAppLabel[] = [];

    if (isChecked) {
      // Add label if not present
      if (!currentLabels.some((l) => l.id === lbl.id)) {
        updatedLabels = [...currentLabels, lbl];
      } else {
        updatedLabels = currentLabels;
      }
    } else {
      // Remove label
      updatedLabels = currentLabels.filter((l) => l.id !== lbl.id);
    }

    try {
      const result = await updateWhatsAppConversationLabelsAction({
        conversationId: selectedConv.id,
        labels: updatedLabels,
      });

      if (result?.data?.success) {
        // Update local selected conversation labels state
        const updatedConv = { ...selectedConv, labels: updatedLabels };
        setSelectedConv(updatedConv);
        mutateConvs(); // Refresh sidebar lists immediately!
        notify.success(isChecked ? "Etiqueta vinculada!" : "Etiqueta removida!");
      } else {
        notify.error("Erro ao atualizar etiquetas.");
      }
    } catch {
      notify.error("Erro técnico ao atualizar etiquetas.");
    }
  };

  // Create custom label
  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    const newLabel: WhatsAppLabel = {
      id: Math.random().toString(),
      name: newLabelName.trim(),
      color: newLabelColor,
    };

    setAvailableLabels([...availableLabels, newLabel]);
    setNewLabelName("");
    setNewLabelColor("blue");
    setIsCreatingLabel(false);
    notify.success("Etiqueta criada!");
  };

  const filteredConversations = conversations?.filter((conv: WhatsAppConversation) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      conv.waId.toLowerCase().includes(q) ||
      conv.studentName?.toLowerCase().includes(q) ||
      conv.contactName?.toLowerCase().includes(q) ||
      conv.lastMessageContent?.toLowerCase().includes(q)
    );
  });

  // On mobile: show sidebar OR chat, never both
  const showSidebar = !isMobile || !selectedConv;
  const showChat = !isMobile || !!selectedConv;

  const currentDisplayName = selectedConv
    ? selectedConv.studentName || selectedConv.contactName || `+${selectedConv.waId}`
    : "";

  return (
    /*
     * Parent layout yields us flex-1 flex flex-col relative.
     * h-full fills it completely and beautifully.
     */
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col border-r border-border/50 bg-background/80 backdrop-blur-sm",
          // desktop: fixed width; mobile: full-width or hidden
          "w-full md:w-[320px] lg:w-[360px] shrink-0",
          !showSidebar && "hidden md:flex",
          showSidebar && "flex"
        )}
      >
        {/* Header */}
        <div className="flex-none px-4 pt-4 pb-3 border-b border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4.5 h-4.5 text-primary" />
              Conversas
            </h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conversa ou etiqueta…"
              className="pl-9 h-9 text-[13px] bg-muted/40 border-border/40 rounded-xl focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {isLoadingConvs ? (
            Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)
          ) : filteredConversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <MessageCircle className="w-8 h-8 opacity-20" />
              <span className="text-sm">Nenhuma conversa.</span>
            </div>
          ) : (
            filteredConversations?.map((conv: WhatsAppConversation) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isSelected={selectedConv?.id === conv.id}
                onClick={() => handleSelectConv(conv)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Chat panel ────────────────────────────────────────────────── */}
      <section
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-muted/5",
          !showChat && "hidden md:flex"
        )}
      >
        {selectedConv ? (
          <>
            {/* Chat header (clickable to slide-out contact details) */}
            <header 
              onClick={() => setIsDetailsOpen(true)}
              className="flex-none flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm cursor-pointer hover:bg-muted/30 transition-colors z-10"
              title="Clique para ver os detalhes do contato e etiquetas"
            >
              {isMobile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBack();
                  }}
                  aria-label="Voltar"
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/70 transition-colors mr-0.5"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              )}
              <Avatar seed={selectedConv.waId} name={currentDisplayName} size={40} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <p className="text-[14.5px] font-bold text-foreground truncate">
                    {currentDisplayName}
                  </p>
                  
                  {/* Attached labels in header */}
                  {selectedConv.labels && selectedConv.labels.map((lbl: WhatsAppLabel) => {
                    const colors = LABEL_COLORS[lbl.color] || LABEL_COLORS.blue;
                    return (
                      <span
                        key={lbl.id}
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 select-none animate-in scale-in duration-200",
                          colors.bg,
                          colors.text,
                          colors.border
                        )}
                      >
                        {lbl.name}
                      </span>
                    );
                  })}
                </div>
                
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(selectedConv.studentName || selectedConv.contactName) && (
                    <span className="text-[11px] text-muted-foreground mr-1.5 font-medium select-all">
                      +{selectedConv.waId}
                    </span>
                  )}
                  <Wifi className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-emerald-500 font-semibold tracking-wide uppercase select-none">
                    Online (Meta API)
                  </span>
                </div>
              </div>
            </header>

            {/* Messages area with official WhatsApp background doodle and light/dark theme colors */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 scroll-smooth relative bg-[#efeae2] dark:bg-[#0b141a]"
            >
              {/* WhatsApp background pattern watermark - z-0 with higher opacity to be clearly visible */}
              <div 
                className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-[0.45] dark:opacity-[0.06] pointer-events-none mix-blend-overlay z-0" 
              />
              
              <div className="relative space-y-2 z-10">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                  </div>
                ) : (
                  messages?.map((msg: WhatsAppMessage, idx: number) => {
                    const prev = messages[idx - 1];
                    const showDate =
                      !prev ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(prev.createdAt).toDateString();
                    return (
                      <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-1 duration-150">
                        {showDate && <TimestampPill date={new Date(msg.createdAt)} />}
                        <MessageBubble msg={msg} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Input */}
            <footer className="flex-none px-3 py-3 border-t border-border/50 bg-[#f0f2f5] dark:bg-[#202c33] z-20">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite sua mensagem…"
                  disabled={isSending}
                  className={cn(
                    "flex-1 h-11 px-4 text-[13.5px] rounded-full",
                    "bg-[#ffffff] dark:bg-[#2a3942] border-[#ffffff] dark:border-[#2a3942] text-[#111b21] dark:text-[#e9edef] focus-visible:ring-primary/30",
                    "placeholder:text-muted-foreground/60 transition-colors"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as unknown as React.FormEvent);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || isSending}
                  className="h-11 w-11 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                  aria-label="Enviar mensagem"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </footer>

            {/* Sliding contact details & Label management Vault */}
            <Vault open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <VaultContent className="max-w-md">
                <VaultHeader>
                  <VaultTitle>Dados do Contato</VaultTitle>
                  <VaultDescription>Visualize e gerencie as etiquetas e o nome do contato</VaultDescription>
                </VaultHeader>
                <VaultBody className="space-y-5 pt-3">
                  
                  {/* Contact Profile circle */}
                  <div className="flex flex-col items-center text-center pb-6 border-b border-border/40">
                    <Avatar seed={selectedConv.waId} name={currentDisplayName} size={80} />
                    <h3 className="font-bold text-lg mt-3 text-foreground select-all leading-tight">
                      {currentDisplayName}
                    </h3>
                    {selectedConv.studentName && selectedConv.contactName && (
                      <p className="text-xs text-muted-foreground mt-0.5 select-all">
                        Apelido: {selectedConv.contactName}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 bg-muted/40 px-3 py-1 rounded-full border border-border/10 select-all">
                      <span className="text-xs font-semibold text-foreground/80">+{selectedConv.waId}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          navigator.clipboard.writeText(`+${selectedConv.waId}`);
                          notify.success("Número copiado!");
                        }}
                        className="w-5 h-5 rounded-full hover:bg-muted"
                        title="Copiar telefone para área de transferência"
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Nome Customizado Form */}
                  <div className="space-y-2 pb-4 border-b border-border/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Contato</h4>
                    <form onSubmit={handleSaveName} className="flex gap-2 items-center">
                      <Input
                        value={contactNameInput}
                        onChange={(e) => setContactNameInput(e.target.value)}
                        placeholder="Adicionar nome customizado..."
                        className="h-9 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/20 border-border/30"
                      />
                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={isSavingName}
                        className="h-9 text-xs font-semibold rounded-xl bg-primary px-4 shrink-0 transition-transform active:scale-95 disabled:opacity-40"
                      >
                        {isSavingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar"}
                      </Button>
                    </form>
                  </div>

                  {/* Labels List & custom label creation */}
                  <div className="space-y-4 pt-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        Etiquetas da Conversa
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                        className="h-7 text-[11px] font-semibold text-primary px-2 rounded-lg flex items-center gap-1"
                      >
                        {isCreatingLabel ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {isCreatingLabel ? "Cancelar" : "Nova"}
                      </Button>
                    </div>

                    {/* Nova Etiqueta Form */}
                    {isCreatingLabel && (
                      <form onSubmit={handleCreateLabel} className="bg-muted/30 border border-border/20 rounded-xl p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome da Etiqueta</label>
                          <Input
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            placeholder="Ex: Novo Cliente, Pendente..."
                            className="h-8 text-xs bg-background border-border/30 rounded-lg"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground block">Cor de Destaque</label>
                          <div className="flex gap-2">
                            {Object.keys(LABEL_COLORS).map((colorKey) => {
                              const isSelected = newLabelColor === colorKey;
                              const colors = LABEL_COLORS[colorKey];
                              return (
                                <button
                                  key={colorKey}
                                  type="button"
                                  onClick={() => setNewLabelColor(colorKey)}
                                  className={cn(
                                    "w-6 h-6 rounded-full border border-border/10 transition-transform active:scale-95 shrink-0",
                                    isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-black scale-105"
                                  )}
                                  style={{ backgroundColor: colors.hex }}
                                  title={colorKey}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={!newLabelName.trim()} 
                          className="w-full h-8 text-xs font-semibold rounded-lg bg-primary"
                        >
                          Criar Etiqueta
                        </Button>
                      </form>
                    )}

                    {/* Lista de Etiquetas */}
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {availableLabels.map((lbl) => {
                        const isChecked = selectedConv.labels?.some((l) => l.id === lbl.id) ?? false;
                        const colors = LABEL_COLORS[lbl.color] || LABEL_COLORS.blue;
                        return (
                          <label
                            key={lbl.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-border/20 hover:bg-muted/20 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleToggleLabel(lbl, e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary border-border/40 shrink-0"
                              />
                              <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-md border",
                                colors.bg,
                                colors.text,
                                colors.border
                              )}>
                                {lbl.name}
                              </span>
                            </div>
                            
                            {/* Delete custom label button if not default */}
                            {!DEFAULT_LABELS.some(d => d.id === lbl.id) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Delete label from availableLabels list
                                  const updatedAvailable = availableLabels.filter(a => a.id !== lbl.id);
                                  setAvailableLabels(updatedAvailable);
                                  // Also toggle off from current conversation if selected
                                  if (isChecked) {
                                    handleToggleLabel(lbl, false);
                                  }
                                  notify.success("Etiqueta removida do sistema!");
                                }}
                                className="p-1 rounded-full hover:bg-muted text-muted-foreground shrink-0 transition-colors"
                                title="Excluir etiqueta do sistema"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </VaultBody>
              </VaultContent>
            </Vault>
          </>
        ) : (
          <EmptyChatState />
        )}
      </section>
    </div>
  );
}
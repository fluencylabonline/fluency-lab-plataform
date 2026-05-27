"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  getWhatsAppConversationsAction,
  getWhatsAppMessagesAction,
  sendWhatsAppTextMessageAction,
  markWhatsAppConversationAsReadAction
} from "@/modules/communication/communication.actions";
import { WhatsAppConversation, WhatsAppMessage, WhatsAppLabel } from "@/modules/communication/communication.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "./Avatar";
import { ConvItem } from "./ConvItem";
import { MessageBubble } from "./MessageBubble";
import { DetailsVault } from "./DetailsVault";
import {
  Send,
  MessageCircle,
  ChevronLeft,
  Search,
  Loader2,
  Wifi
} from "lucide-react";
import { format } from "date-fns";
import { notify } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/ui/use-device";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";

// ─── Colors mapping for Header tags ───────────────────────────────────────────

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

import { SettingsUserDTO } from "@/modules/user/user.schema";

interface WhatsAppChatProps {
  currentUser: SettingsUserDTO;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WhatsAppChat({ currentUser }: WhatsAppChatProps) {
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Contact details & Labels Drawer properties
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
    if (!selectedConv) {
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
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex flex-col border-r border-border/50 bg-background/30 backdrop-blur-sm",
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
            <UserMenu user={currentUser} />
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
            {/* Chat header */}
            <header 
              onClick={() => setIsDetailsOpen(true)}
              className="flex-none flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-[#f0f2f5] dark:bg-[#202c33] backdrop-blur-sm cursor-pointer hover:bg-muted/30 transition-colors z-10"
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

            {/* Messages area with fixed WhatsApp background doodle and light/dark theme colors */}
            <div className="flex-1 relative overflow-hidden bg-[#efeae2] dark:bg-[#0b141a]">
              {/* WhatsApp background pattern watermark - z-0 with higher opacity to be clearly visible and stationary */}
              <div 
                className="absolute inset-0 bg-[url('/backgrounds/whatsapp-light.png')] dark:bg-[url('/backgrounds/whatsapp-dark.png')] bg-repeat pointer-events-none z-0 opacity-50" 
              />
              
              {/* Scrollable messages feed */}
              <div
                ref={scrollRef}
                className="absolute inset-0 overflow-y-auto overscroll-contain px-4 py-4 scroll-smooth z-10"
              >
                <div className="relative space-y-2">
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
            </div>

            {/* Input footer */}
            <footer className="flex-none px-3 py-3 border-t border-border/50 bg-[#f0f2f5] dark:bg-[#202c33] z-50">
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

            {/* Sliding contact details drawer */}
            <DetailsVault
              open={isDetailsOpen}
              onOpenChange={setIsDetailsOpen}
              selectedConv={selectedConv}
              setSelectedConv={setSelectedConv}
              mutateConvs={mutateConvs}
              availableLabels={availableLabels}
              setAvailableLabels={setAvailableLabels}
              currentDisplayName={currentDisplayName}
            />
          </>
        ) : (
          <EmptyChatState />
        )}
      </section>
    </div>
  );
}
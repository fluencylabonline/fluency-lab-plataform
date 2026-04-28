"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  getWhatsAppConversationsAction,
  getWhatsAppMessagesAction,
  sendWhatsAppTextMessageAction,
  markWhatsAppConversationAsReadAction
} from "@/modules/communication/communication.actions";
import { WhatsAppConversation, WhatsAppMessage } from "@/modules/communication/communication.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, MessageCircle, Clock, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { notify } from "@/components/ui/toaster";
import { Shimmer } from "@shimmer-from-structure/react";

export function WhatsAppChat() {
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  const { data: conversations, mutate: mutateConvs, isLoading: isLoadingConvs } = useSWR(
    "whatsapp-conversations",
    async () => {
      const result = await getWhatsAppConversationsAction();
      return result?.data || [];
    },
    { refreshInterval: 5000 }
  );

  // Fetch Messages for selected conversation
  const { data: messages, mutate: mutateMessages, isLoading: isLoadingMessages } = useSWR(
    selectedConv ? `whatsapp-messages-${selectedConv.id}` : null,
    async () => {
      const result = await getWhatsAppMessagesAction({ conversationId: selectedConv!.id });
      return (result?.data || []).reverse(); // Exibir na ordem cronológica
    },
    { refreshInterval: 3000 }
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectConv = async (conv: WhatsAppConversation) => {
    setSelectedConv(conv);
    if (conv.unreadCount > 0) {
      await markWhatsAppConversationAsReadAction({ conversationId: conv.id });
      mutateConvs();
    }
  };

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
      notify.error("Erro técnico ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[600px] border rounded-xl overflow-hidden bg-background">
      {/* Sidebar - Conversations */}
      <div className="w-1/3 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Conversas
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="p-4 space-y-3">
              <div />
            </div>
          ) : conversations?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            conversations?.map((conv: WhatsAppConversation) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv)}
                className={`w-full p-4 flex items-start gap-3 transition-colors hover:bg-muted/30 border-b text-left ${selectedConv?.id === conv.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm truncate">+{conv.waId}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "HH:mm") : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate italic">
                    {conv.lastMessageContent || "Sem mensagens"}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {conv.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/5">
        {selectedConv ? (
          <>
            <div className="p-4 border-b bg-background flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">+{selectedConv.waId}</h4>
                <p className="text-[10px] text-green-500 font-medium">Online (Meta API)</p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90"
            >
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                messages?.map((msg: WhatsAppMessage) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group ${msg.direction === "outbound"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-background border rounded-tl-none"
                        }`}
                    >
                      <p className="mb-1">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 text-[9px] opacity-70`}>
                        {format(new Date(msg.createdAt), "HH:mm")}
                        {msg.direction === "outbound" && (
                          <span>
                            {msg.status === "read" ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-background border-t flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={!messageText.trim() || isSending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 opacity-20" />
            </div>
            <h3 className="font-medium mb-2 text-foreground">Sua Central de Atendimento</h3>
            <p className="text-sm max-w-xs">
              Selecione uma conversa ao lado para visualizar o histórico e responder seus alunos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

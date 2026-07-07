"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  getWhatsAppTemplatesAction,
  getWhatsAppConversationsAction,
  getWhatsAppMessagesAction,
  sendWhatsAppTextMessageAction,
  markWhatsAppConversationAsReadAction,
  sendWhatsAppTemplateAction,
  getWhatsAppQuickRepliesAction,
  createWhatsAppQuickReplyAction,
  deleteWhatsAppQuickReplyAction
} from "@/modules/communication/communication.actions";
import { searchStudentsAction } from "@/modules/user/user.actions";
import { WhatsAppConversation, WhatsAppMessage, WhatsAppLabel, WhatsAppTemplate } from "@/modules/communication/communication.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "./Avatar";
import { ConvItem } from "./ConvItem";
import { MessageBubble } from "./MessageBubble";
import { DetailsVault } from "./DetailsVault";
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
  ChevronLeft,
  Search,
  Loader2,
  Wifi,
  Plus,
  Zap,
  BookOpen,
  Trash2,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { notify } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/ui/use-device";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";
import { SettingsUserDTO } from "@/modules/user/user.schema";

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

function TimestampPill({ date }: { date: Date }) {
  return (
    <div className="flex justify-center my-4 relative z-10">
      <span className="px-3 py-1 rounded-full bg-[#ffffff] dark:bg-[#182229] shadow-sm text-[11px] font-medium text-muted-foreground tracking-wide border border-border/10">
        {format(date, "dd/MM/yyyy")}
      </span>
    </div>
  );
}

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

interface WhatsAppChatProps {
  currentUser: SettingsUserDTO;
}

export function WhatsAppChat({ currentUser }: WhatsAppChatProps) {
  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<"active" | "archived" | "replies">("active");
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [selectedQuickReply, setSelectedQuickReply] = useState<any | null>(null);
  
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewArchived, setViewArchived] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Quick replies selection / popover
  const [showQuickRepliesPopover, setShowQuickRepliesPopover] = useState(false);
  const [showSlashPopup, setShowSlashPopup] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");

  // Template sending state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSendTemplateOpen, setIsSendTemplateOpen] = useState(false);

  // New Chat fields
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatStudentId, setNewChatStudentId] = useState<string | null>(null);
  const [newChatStudentName, setNewChatStudentName] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  // Selected template & parameters
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateParams, setTemplateParams] = useState<string[]>([]);
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);

  // Quick replies CRUD state
  const [qrShortcut, setQrShortcut] = useState("");
  const [qrTitle, setQrTitle] = useState("");
  const [qrContent, setQrContent] = useState("");
  const [isCreatingQR, setIsCreatingQR] = useState(false);

  // Available labels from localStorage
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

  // Sync SWR variables when viewArchived shifts
  useEffect(() => {
    if (activeTab === "active") setViewArchived(false);
    if (activeTab === "archived") setViewArchived(true);
  }, [activeTab]);

  const { data: conversations, mutate: mutateConvs, isLoading: isLoadingConvs } = useSWR(
    `whatsapp-conversations-${viewArchived}`,
    async () => {
      const result = await getWhatsAppConversationsAction({ includeArchived: viewArchived });
      return (result?.data as unknown as WhatsAppConversation[]) || [];
    },
    { refreshInterval: 5000 }
  );

  const { data: templates } = useSWR(
    "whatsapp-templates",
    async () => {
      const result = await getWhatsAppTemplatesAction();
      return (result?.data as unknown as WhatsAppTemplate[]) || [];
    },
    { revalidateOnFocus: false }
  );

  const { data: quickReplies, mutate: mutateQuickReplies } = useSWR(
    "whatsapp-quick-replies",
    async () => {
      const result = await getWhatsAppQuickRepliesAction();
      return (result?.data as any[]) || [];
    }
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

  // Pre-fill student name in variables when a template is selected inside an active chat
  useEffect(() => {
    if (selectedTemplate && selectedConv) {
      const initialParams: string[] = [];
      const count = getTemplateParamsCount(selectedTemplate);
      for (let i = 0; i < count; i++) {
        if (i === 0 && selectedConv.studentName) {
          initialParams.push(selectedConv.studentName);
        } else {
          initialParams.push("");
        }
      }
      setTemplateParams(initialParams);
    } else {
      setTemplateParams([]);
    }
  }, [selectedTemplate, selectedConv]);

  const handleSelectConv = async (conv: WhatsAppConversation) => {
    setSelectedConv(conv);
    setSelectedQuickReply(null);
    if (conv.unreadCount > 0) {
      await markWhatsAppConversationAsReadAction({ conversationId: conv.id });
      mutateConvs();
    }
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleBack = () => {
    setSelectedConv(null);
    setSelectedQuickReply(null);
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
      notify.error("Erro técnico ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  // Search student autocomplete logic
  const handleSearchStudents = async (query: string) => {
    if (query.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }
    setIsSearchingStudents(true);
    try {
      const res = await searchStudentsAction({ term: query });
      if (res?.data?.success && res.data.data) {
        setStudentSearchResults(res.data.data);
      } else {
        setStudentSearchResults([]);
      }
    } catch {
      setStudentSearchResults([]);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  const getTemplateParamsCount = (template: WhatsAppTemplate) => {
    const bodyComp = template.components.find((c: any) => c.type === "BODY" || c.type === "body");
    if (!bodyComp?.text) return 0;
    const matches = bodyComp.text.match(/\{\{\d+\}\}/g) || [];
    return new Set(matches).size;
  };

  const handleSendTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = selectedConv ? selectedConv.waId : newChatPhone;
    if (!phone || !selectedTemplate || isSendingTemplate) return;

    setIsSendingTemplate(false);
    const componentsToSend = [
      {
        type: "body",
        parameters: templateParams.map(val => ({ type: "text", text: val }))
      }
    ];

    setIsSendingTemplate(true);
    try {
      const result = await sendWhatsAppTemplateAction({
        to: phone,
        templateName: selectedTemplate.name,
        components: componentsToSend
      });

      if (result?.data?.messages?.[0]?.id) {
        notify.success("Template enviado com sucesso!");
        setIsNewChatOpen(false);
        setIsSendTemplateOpen(false);
        setSelectedTemplate(null);
        setTemplateParams([]);
        setNewChatPhone("");
        setNewChatStudentId(null);
        setNewChatStudentName("");
        
        mutateConvs();
        if (selectedConv) {
          mutateMessages();
        } else {
          // If initiating a new chat, try to auto-select it
          setTimeout(() => {
            mutateConvs().then((updatedList) => {
              const match = updatedList?.find((c: any) => c.waId === phone);
              if (match) handleSelectConv(match);
            });
          }, 800);
        }
      } else {
        notify.error("Erro ao enviar template.");
      }
    } catch {
      notify.error("Falha técnica no envio.");
    } finally {
      setIsSendingTemplate(false);
    }
  };

  const handleCreateQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrShortcut.trim() || !qrTitle.trim() || !qrContent.trim() || isCreatingQR) return;

    setIsCreatingQR(true);
    try {
      const res = await createWhatsAppQuickReplyAction({
        shortcut: qrShortcut,
        title: qrTitle,
        content: qrContent
      });

      if (res?.data?.success) {
        setQrShortcut("");
        setQrTitle("");
        setQrContent("");
        mutateQuickReplies();
        notify.success("Resposta rápida salva!");
      } else {
        notify.error(res?.data?.error || "Erro ao salvar.");
      }
    } catch {
      notify.error("Erro técnico.");
    } finally {
      setIsCreatingQR(false);
    }
  };

  const handleDeleteQuickReply = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta resposta rápida?")) return;
    try {
      const res = await deleteWhatsAppQuickReplyAction({ id });
      if (res?.data?.success) {
        mutateQuickReplies();
        setSelectedQuickReply(null);
        notify.success("Resposta excluída!");
      } else {
        notify.error("Erro ao excluir.");
      }
    } catch {
      notify.error("Erro técnico.");
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

  const filteredQuickReplies = quickReplies?.filter((qr: any) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return qr.shortcut.toLowerCase().includes(q) || qr.title.toLowerCase().includes(q);
  });

  const showSidebar = !isMobile || (!selectedConv && !selectedQuickReply);
  const showChat = !isMobile || !!selectedConv || !!selectedQuickReply;

  const currentDisplayName = selectedConv
    ? selectedConv.studentName || selectedConv.contactName || `+${selectedConv.waId}`
    : "";

  const approvedTemplates = templates?.filter(t => t.status === "APPROVED") || [];

  return (
    <div className="flex h-full w-full overflow-hidden select-none">

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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedTemplate(null);
                  setTemplateParams([]);
                  setIsNewChatOpen(true);
                }}
                className="w-8 h-8 rounded-full hover:bg-muted"
                title="Nova Conversa por Template"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </Button>
              <UserMenu user={currentUser} />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conversa ou atalho..."
              className="pl-9 h-9 text-[13px] bg-muted/40 border-border/40 rounded-xl focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 mt-2 bg-muted/30 p-1 rounded-lg border border-border/40">
            <button
              onClick={() => { setActiveTab("active"); setSelectedConv(null); setSelectedQuickReply(null); }}
              className={cn(
                "flex-1 py-1 text-[11px] font-bold rounded-md transition-all",
                activeTab === "active" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ativas
            </button>
            <button
              onClick={() => { setActiveTab("archived"); setSelectedConv(null); setSelectedQuickReply(null); }}
              className={cn(
                "flex-1 py-1 text-[11px] font-bold rounded-md transition-all",
                activeTab === "archived" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Arquivadas
            </button>
            <button
              onClick={() => { setActiveTab("replies"); setSelectedConv(null); setSelectedQuickReply(null); }}
              className={cn(
                "flex-1 py-1 text-[11px] font-bold rounded-md transition-all",
                activeTab === "replies" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Respostas
            </button>
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeTab === "replies" ? (
            <div className="p-3 space-y-2">
              <button
                onClick={() => setSelectedQuickReply({ isNew: true })}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-border/60 hover:border-primary/50 text-xs font-bold text-muted-foreground hover:text-primary rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Nova Resposta Rápida
              </button>
              
              {filteredQuickReplies?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-1.5 text-center">
                  <Zap className="w-8 h-8 opacity-20" />
                  <span className="text-xs">Nenhuma resposta encontrada.</span>
                </div>
              ) : (
                filteredQuickReplies?.map((qr: any) => (
                  <button
                    key={qr.id}
                    onClick={() => { setSelectedQuickReply(qr); setSelectedConv(null); }}
                    className={cn(
                      "w-full p-3 flex flex-col text-left border border-border/10 rounded-xl transition-all hover:bg-muted/40 gap-1",
                      selectedQuickReply?.id === qr.id && "bg-primary/5 border-primary/30"
                    )}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-extrabold text-primary">{qr.shortcut}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(qr.createdAt), "dd/MM/yy")}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground truncate w-full">{qr.title}</span>
                    <span className="text-[11px] text-muted-foreground truncate w-full">{qr.content}</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </aside>

      {/* ── Detail / Chat Panel ────────────────────────────────────────── */}
      <section
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-muted/5",
          !showChat && "hidden md:flex"
        )}
      >
        {selectedQuickReply ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-card max-w-2xl mx-auto w-full my-auto space-y-6 rounded-2xl border border-border/10 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between w-full border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <button onClick={handleBack} className="p-1 rounded-full hover:bg-muted">
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                )}
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-base text-foreground">
                  {selectedQuickReply.isNew ? "Criar Resposta Rápida" : "Visualizar Resposta Rápida"}
                </h3>
              </div>
              {!selectedQuickReply.isNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteQuickReply(selectedQuickReply.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 rounded-lg font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
                </Button>
              )}
            </div>

            {selectedQuickReply.isNew ? (
              <form onSubmit={handleCreateQuickReply} className="w-full space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Atalho de Gatilho</label>
                  <Input
                    required
                    value={qrShortcut}
                    onChange={(e) => setQrShortcut(e.target.value)}
                    placeholder="Ex: /boasvindas"
                    className="h-10 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/20 border-border/30"
                  />
                  <p className="text-[10px] text-muted-foreground">Deve começar com "/" seguido de letras, sem espaços.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Título / Identificador</label>
                  <Input
                    required
                    value={qrTitle}
                    onChange={(e) => setQrTitle(e.target.value)}
                    placeholder="Ex: Mensagem de Boas Vindas"
                    className="h-10 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/20 border-border/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Conteúdo da Mensagem</label>
                  <textarea
                    required
                    value={qrContent}
                    onChange={(e) => setQrContent(e.target.value)}
                    placeholder="Escreva a resposta automática que será inserida ao digitar o atalho..."
                    className="w-full h-32 p-3 text-xs bg-muted/20 border border-border/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl text-foreground placeholder:text-muted-foreground/60 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isCreatingQR}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40"
                >
                  {isCreatingQR ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Resposta Rápida"}
                </Button>
              </form>
            ) : (
              <div className="w-full space-y-4 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Atalho</span>
                  <p className="text-xs font-bold text-primary select-all bg-primary/5 border border-primary/10 px-3 py-2 rounded-lg w-fit">
                    {selectedQuickReply.shortcut}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Título</span>
                  <p className="text-xs font-bold text-foreground select-all bg-muted/30 border border-border/10 px-3 py-2 rounded-lg">
                    {selectedQuickReply.title}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Mensagem da Resposta</span>
                  <p className="text-xs text-foreground select-all whitespace-pre-wrap bg-muted/30 border border-border/10 p-3.5 rounded-xl leading-relaxed">
                    {selectedQuickReply.content}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : selectedConv ? (
          <>
            {/* Chat header */}
            <header 
              onClick={() => setIsDetailsOpen(true)}
              className="flex-none flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-[#f0f2f5] dark:bg-[#202c33] backdrop-blur-sm cursor-pointer hover:bg-muted/30 transition-colors z-10 select-none"
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
              <Avatar seed={selectedConv.waId} photoUrl={selectedConv.photoUrl} name={currentDisplayName} size={40} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <p className="text-[14px] font-bold text-foreground truncate">
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
                    <span className="text-[10px] text-muted-foreground mr-1.5 font-medium select-all">
                      +{selectedConv.waId}
                    </span>
                  )}
                  <Wifi className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[9px] text-emerald-500 font-semibold tracking-wide uppercase select-none">
                    Online (Meta API)
                  </span>
                </div>
              </div>
            </header>

            {/* Messages area */}
            <div className="flex-1 relative overflow-hidden bg-[#efeae2] dark:bg-[#0b141a]">
              <div 
                className="absolute inset-0 bg-[url('/backgrounds/whatsapp-light.png')] dark:bg-[url('/backgrounds/whatsapp-dark.png')] bg-repeat pointer-events-none z-0 opacity-50" 
              />
              
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
                          <MessageBubble msg={msg} templates={templates} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Input footer */}
            <footer className="flex-none px-3 py-3 border-t border-border/50 bg-[#f0f2f5] dark:bg-[#202c33] z-50 relative">
              
              {/* Autocomplete Slash Popup */}
              {showSlashPopup && (
                <div className="absolute bottom-16 left-4 right-4 bg-background border border-border/50 rounded-xl shadow-xl max-h-40 overflow-y-auto z-[9999] divide-y divide-border/10">
                  {quickReplies
                    ?.filter(qr => qr.shortcut.toLowerCase().includes(slashQuery))
                    .map(qr => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => {
                          const words = messageText.split(/\s+/);
                          words.pop();
                          const prefix = words.join(" ");
                          setMessageText((prefix ? prefix + " " : "") + qr.content);
                          setShowSlashPopup(false);
                          inputRef.current?.focus();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/50 transition-colors text-xs"
                      >
                        <span className="font-bold text-primary">{qr.shortcut}</span>
                        <span className="text-muted-foreground truncate max-w-[200px]">{qr.title}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Quick Replies Popover list */}
              {showQuickRepliesPopover && (
                <div className="absolute bottom-16 left-4 w-72 bg-background border border-border/50 rounded-xl shadow-xl max-h-56 overflow-y-auto z-[9999] p-2 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 tracking-wider border-b border-border/10">Respostas Rápidas</p>
                  {quickReplies?.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 italic text-center">Nenhuma resposta cadastrada</p>
                  ) : (
                    quickReplies?.map(qr => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => {
                          setMessageText(qr.content);
                          setShowQuickRepliesPopover(false);
                          inputRef.current?.focus();
                        }}
                        className="w-full flex flex-col p-2 text-left hover:bg-muted rounded-lg transition-colors text-xs gap-0.5"
                      >
                        <span className="font-bold text-foreground">{qr.title}</span>
                        <span className="text-[10px] text-muted-foreground truncate w-full">{qr.content}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-1.5"
              >
                {/* Quick replies button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowQuickRepliesPopover(!showQuickRepliesPopover)}
                  className="h-10 w-10 rounded-full hover:bg-muted-foreground/10 shrink-0 text-amber-500"
                  title="Respostas Rápidas"
                >
                  <Zap className="w-5 h-5 fill-amber-500" />
                </Button>

                {/* Templates picker button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateParams([]);
                    setIsSendTemplateOpen(true);
                  }}
                  className="h-10 w-10 rounded-full hover:bg-muted-foreground/10 shrink-0 text-blue-500"
                  title="Enviar Template"
                >
                  <BookOpen className="w-5 h-5" />
                </Button>

                <Input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    const lastWord = e.target.value.split(/\s+/).pop() || "";
                    if (lastWord.startsWith("/")) {
                      setShowSlashPopup(true);
                      setSlashQuery(lastWord.toLowerCase());
                    } else {
                      setShowSlashPopup(false);
                    }
                  }}
                  placeholder="Digite sua mensagem ou '/' para respostas..."
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

      {/* ── Vault: Nova Conversa (Templates Picker & Sender) ───────────── */}
      <Vault open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <VaultContent className="max-w-md">
          <VaultHeader>
            <VaultTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Iniciar Nova Conversa
            </VaultTitle>
            <VaultDescription>Busque um estudante ou digite o telefone direto para enviar um template do WhatsApp.</VaultDescription>
          </VaultHeader>
          <VaultBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Estudante FluencyLab</label>
              <div className="relative">
                <Input
                  value={studentSearchQuery}
                  onChange={(e) => {
                    setStudentSearchQuery(e.target.value);
                    handleSearchStudents(e.target.value);
                  }}
                  placeholder="Buscar estudante cadastrado..."
                  className="h-10 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/20 border-border/30"
                />
                {isSearchingStudents && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {studentSearchResults.length > 0 && (
                <div className="border border-border/20 bg-card rounded-xl max-h-36 overflow-y-auto divide-y divide-border/10 shadow-lg">
                  {studentSearchResults.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setNewChatStudentId(student.id);
                        setNewChatStudentName(student.name);
                        // Strip + and spaces from phone
                        const cleanPhone = student.phone ? student.phone.replace(/[^0-9]/g, "") : "";
                        setNewChatPhone(cleanPhone);
                        setStudentSearchQuery("");
                        setStudentSearchResults([]);
                        notify.success(`Estudante selecionado: ${student.name}`);
                      }}
                      className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <Avatar seed={student.id} photoUrl={student.photoUrl} name={student.name} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{student.phone || "Sem telefone"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Telefone de Destino (DDI + DDD + Número)</label>
              <Input
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Ex: 5511999999999"
                className="h-10 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/20 border-border/30"
              />
            </div>

            {newChatStudentName && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4 shrink-0" />
                Vinculará à conta de: <strong>{newChatStudentName}</strong>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Escolher Template</label>
              <select
                onChange={(e) => {
                  const t = approvedTemplates.find((temp: any) => temp.name === e.target.value);
                  setSelectedTemplate(t || null);
                }}
                className="w-full h-10 px-3 text-xs bg-muted/20 border border-border/30 rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 select-none"
              >
                <option value="">Selecione um template aprovado...</option>
                {approvedTemplates.map((t: any) => (
                  <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="space-y-3 p-3 bg-muted/20 rounded-xl border border-border/20">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conteúdo do Template:</span>
                <p className="text-xs bg-[#ffffff] dark:bg-[#182229] border border-border/10 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.components.find((c: any) => c.type === "BODY" || c.type === "body")?.text}
                </p>

                {/* Parameters inputs */}
                {(() => {
                  const count = getTemplateParamsCount(selectedTemplate);
                  if (count === 0) return null;
                  return (
                    <div className="space-y-2.5 pt-2 border-t border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Variáveis (Params)</span>
                      {Array.from({ length: count }).map((_, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground">Parâmetro {"{{"}{idx + 1}{"}}"}</label>
                          <Input
                            value={templateParams[idx] || ""}
                            onChange={(e) => {
                              const newParams = [...templateParams];
                              newParams[idx] = e.target.value;
                              setTemplateParams(newParams);
                            }}
                            placeholder={`Ex: Valor para variável ${idx + 1}`}
                            className="h-8 text-xs rounded-lg bg-background border-border/30 focus-visible:ring-primary/10"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <Button
              onClick={handleSendTemplate}
              disabled={!newChatPhone || !selectedTemplate || isSendingTemplate}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40"
            >
              {isSendingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar Conversa e Enviar"}
            </Button>
          </VaultBody>
        </VaultContent>
      </Vault>

      {/* ── Vault: Enviar Template (Inside Chat) ─────────────────────── */}
      <Vault open={isSendTemplateOpen} onOpenChange={setIsSendTemplateOpen}>
        <VaultContent className="max-w-md">
          <VaultHeader>
            <VaultTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Enviar Template por WhatsApp
            </VaultTitle>
            <VaultDescription>Selecione um template homologado na Meta para enviar a esta conversa.</VaultDescription>
          </VaultHeader>
          <VaultBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Escolher Template</label>
              <select
                onChange={(e) => {
                  const t = approvedTemplates.find((temp: any) => temp.name === e.target.value);
                  setSelectedTemplate(t || null);
                }}
                className="w-full h-10 px-3 text-xs bg-muted/20 border border-border/30 rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 select-none"
              >
                <option value="">Selecione um template aprovado...</option>
                {approvedTemplates.map((t: any) => (
                  <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="space-y-3 p-3 bg-muted/20 rounded-xl border border-border/20">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conteúdo do Template:</span>
                <p className="text-xs bg-[#ffffff] dark:bg-[#182229] border border-border/10 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.components.find((c: any) => c.type === "BODY" || c.type === "body")?.text}
                </p>

                {/* Parameters inputs */}
                {(() => {
                  const count = getTemplateParamsCount(selectedTemplate);
                  if (count === 0) return null;
                  return (
                    <div className="space-y-2.5 pt-2 border-t border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Variáveis (Params)</span>
                      {Array.from({ length: count }).map((_, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground">Parâmetro {"{{"}{idx + 1}{"}}"}</label>
                          <Input
                            value={templateParams[idx] || ""}
                            onChange={(e) => {
                              const newParams = [...templateParams];
                              newParams[idx] = e.target.value;
                              setTemplateParams(newParams);
                            }}
                            placeholder={`Ex: Valor para variável ${idx + 1}`}
                            className="h-8 text-xs rounded-lg bg-background border-border/30 focus-visible:ring-primary/10"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            <Button
              onClick={handleSendTemplate}
              disabled={!selectedTemplate || isSendingTemplate}
              className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40"
            >
              {isSendingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Template"}
            </Button>
          </VaultBody>
        </VaultContent>
      </Vault>

    </div>
  );
}
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Bell, MessageSquare, History, CheckCircle2, Clock, XCircle, RotateCcw, Trash2, MessageCircle } from "lucide-react";
import { Header, HeaderAction } from "@/components/layout/header";
import { useIsMobile } from "@/hooks/ui/use-device";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { WhatsAppTemplate, WhatsAppMetaComponent } from "@/modules/communication/communication.types";
import { NotificationHistoryItem } from "@/modules/notification/notification.types";
import { SendNotificationVault } from "./SendNotificationVault";
import { CreateWhatsAppTemplateVault } from "./CreateWhatsAppTemplateVault";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { getWhatsAppTemplatesAction, deleteWhatsAppTemplateAction } from "@/modules/communication/communication.actions";
import { notify } from "@/components/ui/toaster";
import { WhatsAppChat } from "@/app/[locale]/hub/admin/communication/_components/WhatsAppChat";
import { SendWhatsAppMessageVault } from "@/app/[locale]/hub/admin/communication/_components/SendWhatsAppMessageVault";
import { 
  Vault, 
  VaultContent, 
  VaultHeader, 
  VaultTitle, 
  VaultDescription, 
  VaultFooter, 
  VaultPrimaryButton, 
  VaultSecondaryButton,
  VaultIcon
} from "@/components/ui/vault";


interface CommunicationDashboardProps {
  initialTemplates: WhatsAppTemplate[];
  initialHistory: NotificationHistoryItem[];
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

export function CommunicationDashboard({ initialTemplates, initialHistory, user }: CommunicationDashboardProps) {
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isWabaOpen, setIsWabaOpen] = useState(false);
  const [isSendWaOpen, setIsSendWaOpen] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(initialTemplates);
  const [showDeleteVault, setShowDeleteVault] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(initialHistory.length / itemsPerPage);
  const paginatedHistory = initialHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshTemplates = async () => {
    setIsRefreshing(true);
    try {
      const result = await getWhatsAppTemplatesAction();
      if (result?.data) {
        setTemplates(result.data);
        notify.success("Templates atualizados!");
      }
    } catch {
      notify.error("Erro ao atualizar templates");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteTemplate = (name: string) => {
    setTemplateToDelete(name);
    setShowDeleteVault(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    const name = templateToDelete;

    try {
      const result = await deleteWhatsAppTemplateAction({ name });
      if (result?.data?.success) {
        notify.success("Template excluído com sucesso!");
        setTemplates(prev => prev.filter(t => t.name !== name));
      }
    } catch {
      notify.error("Erro ao excluir template");
    } finally {
      setShowDeleteVault(false);
      setTemplateToDelete(null);
    }
  };

  const isMobile = useIsMobile();

  const headerActions: HeaderAction[] = isMobile ? [
    {
      component: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Plus className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações de Comunicação</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsNotifyOpen(true)}>
              <Bell className="w-4 h-4 mr-2" />
              Enviar Notificação
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsWabaOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSendWaOpen(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Nova Conversa WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ] : [
    {
      component: (
        <Button
          onClick={() => setIsNotifyOpen(true)}
          variant="outline"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Enviar Notificação
        </Button>
      )
    },
    {
      component: (
        <Button
          onClick={() => setIsWabaOpen(true)}
          variant="outline"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Novo Template
        </Button>
      )
    },
    {
      component: (
        <Button
          onClick={() => setIsSendWaOpen(true)}
          variant="outline"
          size="sm"
          className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
          leftIcon={<MessageSquare className="w-4 h-4" />}
        >
          Nova Conversa
        </Button>
      )
    }
  ];

  return (
    <div>
      <Header
        title="Comunicação"
        subtitle="Gerencie notificações e templates do WhatsApp"
        user={user}
        actions={headerActions}
        className="contents"
      />

      <main className="container">
        <Tabs defaultValue="history" className="w-full">
          <div className="flex flex-col gap-4 sm:flex-row items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                WhatsApp Business
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Conversas
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-3">
            {initialHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma notificação enviada recentemente.
              </div>
            ) : (
              paginatedHistory.map((item) => (
                <div key={item.id} className="card p-4 flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.body}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px] px-1.5 h-4">
                        Para: {item.userName || "Desconhecido"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={handleRefreshTemplates}
              isLoading={isRefreshing}
              leftIcon={<RotateCcw className="w-3 h-3" />}
            >
              Atualizar Status
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum template encontrado na conta Meta.
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="card p-4 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge
                        variant={template.status === "APPROVED" ? "default" : "secondary"}
                        className={`text-[9px] uppercase tracking-wider font-bold h-5 ${template.status === "APPROVED" ? "bg-green-500 hover:bg-green-600" :
                          template.status === "REJECTED" ? "bg-red-500 hover:bg-red-600" : ""
                          }`}
                      >
                        {template.status === "APPROVED" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {template.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                        {template.status === "REJECTED" && <XCircle className="w-3 h-3 mr-1" />}
                        {template.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium">{template.category}</span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                      <p className="text-[10px] text-muted-foreground italic">Idioma: {template.language}</p>
                    </div>

                    <div className="text-[11px] text-muted-foreground line-clamp-3 bg-muted/40 p-2 rounded-lg border border-border/50 font-mono italic">
                      {template.components.find((c: WhatsAppMetaComponent) => c.type === "BODY")?.text || "Sem conteúdo de texto."}
                    </div>
                  </div>

                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground font-mono">ID: {template.id.slice(0, 12)}...</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDeleteTemplate(template.name)}
                      className="text-destructive hover:bg-destructive/10"
                      leftIcon={<Trash2 className="w-3 h-3" />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <WhatsAppChat />
        </TabsContent>
        </Tabs>
      </main>

      <SendNotificationVault open={isNotifyOpen} onOpenChange={setIsNotifyOpen} />
      <CreateWhatsAppTemplateVault open={isWabaOpen} onOpenChange={setIsWabaOpen} />
      <SendWhatsAppMessageVault open={isSendWaOpen} onOpenChange={setIsSendWaOpen} templates={templates} />

      <Vault open={showDeleteVault} onOpenChange={setShowDeleteVault}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="delete" />
            <VaultTitle>Excluir Template?</VaultTitle>
            <VaultDescription>
              Tem certeza que deseja excluir o template <strong>&quot;{templateToDelete}&quot;</strong>? Esta ação é irreversível na Meta.
            </VaultDescription>
          </VaultHeader>
          
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setShowDeleteVault(false)}>
              Cancelar
            </VaultSecondaryButton>
            <VaultPrimaryButton 
              variant="destructive" 
              onClick={confirmDeleteTemplate}
            >
              Excluir Permanentemente
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>

  );
}

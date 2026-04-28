"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Bell, MessageSquare, History, CheckCircle2, Clock, XCircle, RotateCcw, Trash2, MessageCircle } from "lucide-react";

import { WhatsAppTemplate, WhatsAppMetaComponent } from "@/modules/communication/communication.types";
import { NotificationHistoryItem } from "@/modules/notification/notification.types";
import { SendNotificationVault } from "./SendNotificationVault";
import { CreateWhatsAppTemplateVault } from "./CreateWhatsAppTemplateVault";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { getWhatsAppTemplatesAction, deleteWhatsAppTemplateAction } from "@/modules/communication/communication.actions";
import { notify } from "@/components/ui/toaster";
import { WhatsAppChat } from "@/app/[locale/]hub/admin/communication/_components/WhatsAppChat";


interface CommunicationDashboardProps {
  initialTemplates: WhatsAppTemplate[];
  initialHistory: NotificationHistoryItem[];
}

export function CommunicationDashboard({ initialTemplates, initialHistory }: CommunicationDashboardProps) {
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isWabaOpen, setIsWabaOpen] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(initialTemplates);
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

  const handleDeleteTemplate = async (name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${name}"? Esta ação é irreversível na Meta.`)) return;

    try {
      const result = await deleteWhatsAppTemplateAction({ name });
      if (result?.data?.success) {
        notify.success("Template excluído com sucesso!");
        setTemplates(prev => prev.filter(t => t.name !== name));
      }
    } catch {
      notify.error("Erro ao excluir template");
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
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


          <div className="flex gap-2">
            <Button
              onClick={() => setIsNotifyOpen(true)}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Enviar Notificação
            </Button>
            <Button
              onClick={() => setIsWabaOpen(true)}
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Template
            </Button>
          </div>
        </div>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-3">
            {initialHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma notificação enviada recentemente.
              </div>
            ) : (
              initialHistory.map((item) => (
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


      <SendNotificationVault open={isNotifyOpen} onOpenChange={setIsNotifyOpen} />
      <CreateWhatsAppTemplateVault open={isWabaOpen} onOpenChange={setIsWabaOpen} />
    </div>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { MessageSquare, Check, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { SystemSettings } from "@/modules/settings/settings.schema";
import { updateSystemSettingsAction } from "@/modules/settings/settings.actions";
import { getWhatsAppTemplatesAction } from "@/modules/communication/communication.actions";
import { WhatsAppTemplate } from "@/modules/communication/communication.types";
import { cn } from "@/lib/utils";

const DEFAULT_WHITELIST = [
  "payment_reminder_v4",
  "payment_reminder_v5",
  "payment_overdue_v4",
  "payment_overdue_v5",
  "welcome_first",
  "welcome_first_v4",
  "talk_to_person",
  "class_scheduled_student_v1",
];

interface WhatsAppSettingsProps {
  initialSettings: SystemSettings;
}

export function WhatsAppSettings({ initialSettings }: WhatsAppSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [allowedTemplates, setAllowedTemplates] = useState<string[]>(() => {
    if (initialSettings.allowedWhatsappTemplates && initialSettings.allowedWhatsappTemplates.length > 0) {
      return initialSettings.allowedWhatsappTemplates;
    }
    return DEFAULT_WHITELIST;
  });

  const { data: metaTemplates, isLoading: isLoadingTemplates } = useSWR(
    "whatsapp-templates-admin-settings",
    async () => {
      const res = await getWhatsAppTemplatesAction();
      return (res?.data as unknown as WhatsAppTemplate[]) || [];
    }
  );

  const approvedTemplates = metaTemplates?.filter((t) => t.status === "APPROVED") || [];

  const toggleTemplate = (name: string) => {
    setAllowedTemplates((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateSystemSettingsAction({
        whatsappNumber: initialSettings.whatsappNumber,
        whatsappMessage: initialSettings.whatsappMessage,
        supportEmail: initialSettings.supportEmail,
        contactText: initialSettings.contactText,
        faq: initialSettings.faq || [],
        allowedWhatsappTemplates: allowedTemplates,
      });

      if (result?.data?.success) {
        notify.success("Configurações do WhatsApp salvas com sucesso!");
      } else {
        notify.error(result?.data?.error || "Erro ao salvar configurações.");
      }
    } catch {
      notify.error("Falha técnica ao atualizar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#00a884] flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Templates de WhatsApp Homologados</h3>
              <p className="text-xs text-muted-foreground">
                Selecione os modelos aprovados na Meta API que ficarão disponíveis para envio rápido na Central de Conversas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00a884]">
            <ShieldCheck className="w-4 h-4" />
            {approvedTemplates.length} Templates Aprovados
          </div>
        </div>
      </div>

      {/* Grid of Templates Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Modelos de Mensagem ({allowedTemplates.length} Selecionados)
          </h4>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAllowedTemplates(approvedTemplates.map((t) => t.name))}
              className="text-xs h-8"
            >
              Selecionar Todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAllowedTemplates([])}
              className="text-xs h-8"
            >
              Desmarcar Todos
            </Button>
          </div>
        </div>

        {isLoadingTemplates ? (
          <div className="flex flex-col items-center justify-center py-16 card space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
            <p className="text-xs text-muted-foreground font-medium">Carregando templates da Meta API...</p>
          </div>
        ) : approvedTemplates.length === 0 ? (
          <div className="card p-10 text-center space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">Nenhum template aprovado encontrado.</p>
            <p className="text-xs text-muted-foreground">
              Verifique se os templates foram cadastrados e aprovados no Painel do Desenvolvedor da Meta.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedTemplates.map((template) => {
              const isEnabled = allowedTemplates.includes(template.name);
              const bodyComponent = template.components?.find(
                (c) => c.type === "BODY" || (c.type as unknown as string) === "body"
              );
              const bodyText = bodyComponent?.text || "(Sem conteúdo de corpo de texto)";

              return (
                <div
                  key={template.id}
                  onClick={() => toggleTemplate(template.name)}
                  className={cn(
                    "item p-5 border rounded-xl transition-all cursor-pointer select-none space-y-3 relative flex flex-col justify-between",
                    isEnabled
                      ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm"
                      : "border-border/30 bg-muted/10 opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-foreground truncate">
                          {template.name}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border shrink-0">
                          {template.category}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0",
                          isEnabled
                            ? "bg-[#00a884] border-[#00a884] text-white"
                            : "border-border/50 bg-background"
                        )}
                      >
                        {isEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="text-xs text-foreground/90 whitespace-pre-wrap bg-background/80 dark:bg-black/30 border border-border/20 p-3 rounded-lg leading-relaxed font-sans">
                      {bodyText}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border/10">
                    <span>Idioma: <strong className="text-foreground">{template.language}</strong></span>
                    <span className={cn(
                      "font-semibold flex items-center gap-1",
                      isEnabled ? "text-[#00a884]" : "text-muted-foreground"
                    )}>
                      {isEnabled ? (
                        <>
                          <Sparkles className="w-3 h-3" /> Disponível em Conversas
                        </>
                      ) : (
                        "Oculto em Conversas"
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button Footer */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-11 px-8 min-w-40 gap-2 bg-[#00a884] hover:bg-[#008f72] text-white font-bold"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Globe, Mail, MessageSquare, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/components/ui/toaster";
import {
  updateSystemSettingsSchema,
  UpdateSystemSettingsValues,
  SystemSettings,
} from "@/modules/settings/settings.schema";
import { updateSystemSettingsAction } from "@/modules/settings/settings.actions";

interface PlatformSettingsProps {
  initialSettings: SystemSettings;
}

export function PlatformSettings({ initialSettings }: PlatformSettingsProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSystemSettingsValues>({
    resolver: zodResolver(updateSystemSettingsSchema),
    defaultValues: {
      whatsappNumber: initialSettings.whatsappNumber,
      whatsappMessage: initialSettings.whatsappMessage,
      supportEmail: initialSettings.supportEmail,
      contactText: initialSettings.contactText,
      faq: initialSettings.faq || [],
    },
  });

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "faq",
  });

  const onSubmit = async (values: UpdateSystemSettingsValues) => {
    const promise = (async () => {
      const result = await updateSystemSettingsAction(values);
      if (result?.data?.success) {
        return "Configurações da plataforma atualizadas com sucesso!";
      }
      throw new Error(result?.data?.error || "Erro ao atualizar configurações");
    })();

    notify.promise(promise, {
      loading: "Salvando configurações...",
      success: (msg) => msg,
      error: (err: unknown) => (err as Error).message || "Erro inesperado",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Channels Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Canais de Atendimento</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">E-mail de Suporte</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                {...register("supportEmail")}
                className="pl-9 h-11"
                placeholder="suporte@exemplo.com"
              />
            </div>
            {errors.supportEmail && (
              <p className="text-xs text-red-650 dark:text-red-400 mt-1">{errors.supportEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Número de WhatsApp (Apenas números + DDI)</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                {...register("whatsappNumber")}
                className="pl-9 h-11"
                placeholder="5549936180727"
              />
            </div>
            {errors.whatsappNumber && (
              <p className="text-xs text-red-650 dark:text-red-400 mt-1">{errors.whatsappNumber.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <label className="text-sm font-semibold text-muted-foreground">Mensagem Inicial do WhatsApp (URL Encoded automaticamente)</label>
          <Textarea
            {...register("whatsappMessage")}
            placeholder="Digite a mensagem padrão que o aluno enviará ao clicar..."
            rows={2}
          />
          {errors.whatsappMessage && (
            <p className="text-xs text-red-650 dark:text-red-400 mt-1">{errors.whatsappMessage.message}</p>
          )}
        </div>

        <div className="space-y-2 mt-4">
          <label className="text-sm font-semibold text-muted-foreground">Texto de Contato no Modal</label>
          <Textarea
            {...register("contactText")}
            placeholder="Texto explicativo exibido no modal de suporte..."
            rows={3}
          />
          {errors.contactText && (
            <p className="text-xs text-red-650 dark:text-red-400 mt-1">{errors.contactText.message}</p>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Perguntas Frequentes (FAQ)</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ question: "", answer: "" })}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pergunta
          </Button>
        </div>

        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">Nenhuma pergunta frequente adicionada ainda.</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ question: "", answer: "" })}
                className="mt-2 text-primary"
              >
                Criar a primeira
              </Button>
            </div>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="item p-4 border rounded-lg bg-slate-50/20 dark:bg-slate-900/10 space-y-3 relative group">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Pergunta #{index + 1}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      disabled={index === 0}
                      onClick={() => swap(index, index - 1)}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7"
                      disabled={index === fields.length - 1}
                      onClick={() => swap(index, index + 1)}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="w-7 h-7 text-red-500 hover:text-red-700"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Input
                      type="text"
                      placeholder="Pergunta (ex: Como posso reagendar uma aula?)"
                      {...register(`faq.${index}.question` as const)}
                      className="h-10 bg-background"
                    />
                    {errors.faq?.[index]?.question && (
                      <p className="text-xs text-red-650 dark:text-red-400 mt-0.5">
                        {errors.faq[index]?.question?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Textarea
                      placeholder="Resposta correspondente..."
                      {...register(`faq.${index}.answer` as const)}
                      className="bg-background"
                      rows={2}
                    />
                    {errors.faq?.[index]?.answer && (
                      <p className="text-xs text-red-650 dark:text-red-400 mt-0.5">
                        {errors.faq[index]?.answer?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} className="h-11 px-8 min-w-40 gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultForm,
  VaultField,
  VaultInput
} from "@/components/ui/vault";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWhatsAppTemplateSchema, CreateWhatsAppTemplateValues } from "@/modules/communication/communication.schema";
import { createWhatsAppTemplateAction } from "@/modules/communication/communication.actions";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";

interface CreateWhatsAppTemplateVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWhatsAppTemplateVault({ open, onOpenChange }: CreateWhatsAppTemplateVaultProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<CreateWhatsAppTemplateValues>({
    resolver: zodResolver(createWhatsAppTemplateSchema),
    defaultValues: {
      category: "UTILITY",
      language: "pt_BR",
    }
  });

  const onSubmit = async (data: CreateWhatsAppTemplateValues) => {
    setIsLoading(true);
    try {
      const bodyText = data.bodyText;
      const components = [
        {
          type: "BODY",
          text: bodyText,
        }
      ];

      const result = await createWhatsAppTemplateAction({
        ...data,
        components
      });

      if (result?.data?.success) {
        notify.success("Template enviado para aprovação!");
        reset();
        onOpenChange(false);
      } else {
        notify.error("Erro ao criar template na Meta");
      }
    } catch {
      notify.error("Erro inesperado ao criar template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultTitle>Novo Template WhatsApp</VaultTitle>
          <VaultDescription>Crie um novo modelo de mensagem para o WhatsApp Business API.</VaultDescription>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={handleSubmit(onSubmit)}>
            <VaultField label="Nome do Template (Slug)" error={errors.name?.message}>
              <VaultInput
                {...register("name")}
                placeholder="ex: lembrete_pagamento_v2"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Apenas letras minúsculas, números e sublinhados.</p>
            </VaultField>

            <div className="grid grid-cols-2 gap-4">
              <VaultField label="Categoria">
                <Select
                  onValueChange={(val) => setValue("category", val as CreateWhatsAppTemplateValues["category"])}
                  defaultValue="UTILITY"
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTILITY">Utilidade</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>

              <VaultField label="Idioma">
                <Select
                  onValueChange={(val) => setValue("language", val)}
                  defaultValue="pt_BR"
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Idioma..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt_BR">Português (BR)</SelectItem>
                    <SelectItem value="en_US">Inglês (US)</SelectItem>
                    <SelectItem value="es">Espanhol</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>
            </div>

            <VaultField label="Conteúdo da Mensagem (Corpo)">
              <Textarea
                {...register("bodyText")}
                placeholder="Olá {{1}}, seu boleto vence hoje!"
                rows={4}
                className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4 py-3 text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Use {"{{1}}"}, {"{{2}}"} para variáveis.</p>
            </VaultField>
          </VaultForm>
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)}>
            Cancelar
          </VaultSecondaryButton>
          <VaultPrimaryButton
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? "Criando..." : "Criar Template"}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}

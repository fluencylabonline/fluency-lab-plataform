"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VaultField } from "@/components/ui/vault";
import { type SchoolSettings } from "@/modules/contract/contract.schema";

interface SchoolAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
}

const schoolSettingsFormSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "O nome fantasia é obrigatório."),
  legalName: z.string().min(2, "A razão social é obrigatória."),
  taxId: z.string().min(9, "CNPJ ou Tax ID inválido."),
  representativeName: z.string().min(2, "O nome do representante é obrigatório."),
  representativeTaxId: z.string().min(11, "O CPF ou Tax ID do representante é inválido."),
  supportPhone: z.string().optional().nullable(),
  address: z.object({
    street: z.string().min(1, "A rua é obrigatória."),
    number: z.string().min(1, "O número é obrigatório."),
    neighborhood: z.string().min(1, "O bairro é obrigatório."),
    city: z.string().min(1, "A cidade é obrigatória."),
    state: z.string().min(2, "O estado é obrigatório."),
    zip: z.string().min(5, "O CEP ou ZIP é obrigatório."),
  }),
});

export type SchoolSettingsFormValues = z.input<typeof schoolSettingsFormSchema>;

interface SchoolSettingsTabProps {
  schoolSettings: SchoolSettings | null;
  onSubmit: (values: SchoolSettingsFormValues) => void;
  isPending: boolean;
}

export function SchoolSettingsTab({
  schoolSettings,
  onSubmit,
  isPending,
}: SchoolSettingsTabProps) {
  const t = useTranslations("Contracts");

  const initialAddress = schoolSettings?.address as SchoolAddress | undefined;

  const form = useForm<SchoolSettingsFormValues>({
    resolver: zodResolver(schoolSettingsFormSchema),
    defaultValues: {
      id: schoolSettings?.id || null,
      name: schoolSettings?.name || "",
      legalName: schoolSettings?.legalName || "",
      taxId: schoolSettings?.taxId || "",
      representativeName: schoolSettings?.representativeName || "",
      representativeTaxId: schoolSettings?.representativeTaxId || "",
      supportPhone: schoolSettings?.supportPhone || "",
      address: {
        street: initialAddress?.street || "",
        number: initialAddress?.number || "",
        neighborhood: initialAddress?.neighborhood || "",
        city: initialAddress?.city || "",
        state: initialAddress?.state || "",
        zip: initialAddress?.zip || "",
      },
    },
  });

  // Re-fill form if DB settings change
  useEffect(() => {
    if (schoolSettings) {
      const address = schoolSettings.address as SchoolAddress;
      form.reset({
        id: schoolSettings.id,
        name: schoolSettings.name,
        legalName: schoolSettings.legalName,
        taxId: schoolSettings.taxId,
        representativeName: schoolSettings.representativeName,
        representativeTaxId: schoolSettings.representativeTaxId,
        supportPhone: schoolSettings.supportPhone || "",
        address: {
          street: address.street || "",
          number: address.number || "",
          neighborhood: address.neighborhood || "",
          city: address.city || "",
          state: address.state || "",
          zip: address.zip || "",
        },
      });
    }
  }, [schoolSettings, form]);

  return (
    <div className="card p-6 w-full">
      <div className="flex items-center gap-3 border-b border-gray-200/50 dark:border-gray-800 pb-4 mb-6">
        <Building className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t("school.title") || "Configurações da Escola"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("school.desc") || "Estes dados serão injetados nos templates de contrato em substituição aos placeholders como {{school.name}}, {{school.taxId}}, etc."}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VaultField
            label={t("school.name") || "Nome Fantasia da Escola"}
            error={form.formState.errors.name?.message}
            required
          >
            <Input
              placeholder={t("school.namePlaceholder") || "FluencyLab Idiomas"}
              {...form.register("name")}
            />
          </VaultField>

          <VaultField
            label={t("school.legalName") || "Razão Social"}
            error={form.formState.errors.legalName?.message}
            required
          >
            <Input
              placeholder={t("school.legalNamePlaceholder") || "FluencyLab S/A Limitada"}
              {...form.register("legalName")}
            />
          </VaultField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VaultField
            label={t("school.taxId") || "CNPJ ou Tax ID"}
            error={form.formState.errors.taxId?.message}
            required
          >
            <Input
              placeholder="00.000.000/0001-00"
              {...form.register("taxId")}
            />
          </VaultField>

          <VaultField
            label={t("school.representativeName") || "Representante Legal"}
            error={form.formState.errors.representativeName?.message}
            required
          >
            <Input
              placeholder={t("school.repPlaceholder") || "Nome do Gestor"}
              {...form.register("representativeName")}
            />
          </VaultField>

          <VaultField
            label={t("school.representativeTaxId") || "CPF do Representante"}
            error={form.formState.errors.representativeTaxId?.message}
            required
          >
            <Input
              placeholder="000.000.000-00"
              {...form.register("representativeTaxId")}
            />
          </VaultField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VaultField
            label={t("school.supportPhone") || "WhatsApp / Telefone de Suporte"}
            error={form.formState.errors.supportPhone?.message}
          >
            <Input
              placeholder="+55 (11) 99999-9999"
              {...form.register("supportPhone")}
            />
          </VaultField>
        </div>

        {/* Sub address panel */}
        <div className="p-4 bg-muted/20 rounded-lg border border-gray-200/50 dark:border-gray-800 space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            {t("school.address") || "Endereço Institucional"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VaultField
              label="CEP / ZIP"
              error={form.formState.errors.address?.zip?.message}
              required
            >
              <Input
                placeholder="00000-000"
                {...form.register("address.zip")}
              />
            </VaultField>

            <div className="md:col-span-2">
              <VaultField
                label="Logradouro (Rua/Avenida)"
                error={form.formState.errors.address?.street?.message}
                required
              >
                <Input
                  placeholder="Av. Paulista"
                  {...form.register("address.street")}
                />
              </VaultField>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <VaultField
              label="Número"
              error={form.formState.errors.address?.number?.message}
              required
            >
              <Input
                placeholder="1000"
                {...form.register("address.number")}
              />
            </VaultField>

            <VaultField
              label="Bairro"
              error={form.formState.errors.address?.neighborhood?.message}
              required
            >
              <Input
                placeholder="Bela Vista"
                {...form.register("address.neighborhood")}
              />
            </VaultField>

            <VaultField
              label="Cidade"
              error={form.formState.errors.address?.city?.message}
              required
            >
              <Input
                placeholder="São Paulo"
                {...form.register("address.city")}
              />
            </VaultField>

            <VaultField
              label="Estado / UF"
              error={form.formState.errors.address?.state?.message}
              required
            >
              <Input
                placeholder="SP"
                maxLength={2}
                {...form.register("address.state")}
              />
            </VaultField>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
          >
            {t("school.save") || "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}

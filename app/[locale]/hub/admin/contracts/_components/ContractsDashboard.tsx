"use client";

import { useState, useTransition } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultForm,
  VaultField,
  VaultFooter,
  VaultPrimaryButton
} from "@/components/ui/vault";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { notify } from "@/components/ui/toaster";
import {
  createContractTemplateAction,
  updateSchoolSettingsAction,
  getContractDownloadUrlAction,
  resendContractEmailAction,
} from "@/modules/contract/contract.actions";
import {
  type ContractTemplate,
  type ContractInstance,
  type SchoolSettings,
} from "@/modules/contract/contract.schema";
import {
  FileText,
  Plus,
  Building,
  CheckCircle2,
  FileCode,
  Sparkles,
} from "lucide-react";

import type { User } from "@/modules/user/user.schema";
import { ContractTemplatesTab } from "./ContractTemplatesTab";
import { ContractInstancesTab } from "./ContractInstancesTab";
import { SchoolSettingsTab, type SchoolSettingsFormValues } from "./SchoolSettingsTab";

// Types mapping for standard Drizzle load
interface ContractInstanceExtended extends ContractInstance {
  template: ContractTemplate;
  user: {
    name: string;
    email: string;
  };
}

interface ContractsDashboardProps {
  user: User;
  initialTemplates: ContractTemplate[];
  initialInstances: ContractInstanceExtended[];
  initialSchoolSettings: SchoolSettings | null;
}

// Client validation schemas
const createTemplateFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  content: z.string().min(10, "O conteúdo do contrato é obrigatório."),
  region: z.enum(["BR", "US"]),
  type: z.enum(["student", "teacher"]),
  partyType: z.enum(["individual", "business"]),
  durationMonths: z.number().int().min(1, "A duração deve ser de pelo menos 1 mês.").optional().nullable(),
});

type CreateTemplateFormValues = z.infer<typeof createTemplateFormSchema>;

export function ContractsDashboard({
  user,
  initialTemplates,
  initialInstances,
  initialSchoolSettings,
}: ContractsDashboardProps) {
  const t = useTranslations("Contracts");
  const [isPending, startTransition] = useTransition();

  // Local dashboard state for instant UI updates
  const [templates, setTemplates] = useState<ContractTemplate[]>(initialTemplates);
  const [instances] = useState<ContractInstanceExtended[]>(initialInstances);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(initialSchoolSettings);

  // Modals state
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  // Forms initializations
  const templateForm = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateFormSchema),
    defaultValues: {
      name: "",
      content: "",
      region: "BR",
      type: "student",
      partyType: "individual",
      durationMonths: undefined,
    },
  });

  const selectedType = useWatch({
    control: templateForm.control,
    name: "type",
    defaultValue: "student",
  });

  // Actions execution helpers
  const handleCreateTemplate = async (values: CreateTemplateFormValues) => {
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          durationMonths: (values.durationMonths === undefined || isNaN(values.durationMonths as number) || values.durationMonths === null) 
            ? null 
            : Number(values.durationMonths),
        };
        const result = await createContractTemplateAction(payload);
        if (result?.data?.success && result.data.data) {
          notify.success(t("notifications.templateCreated") || "Template de contrato criado com sucesso!");
          
          // Prepend new active template and update others under the same name and region to inactive
          const newTemplate = result.data.data as ContractTemplate;
          setTemplates((prev) => {
            const updated = prev.map((item) =>
              item.name === newTemplate.name && item.region === newTemplate.region
                ? { ...item, isActive: false }
                : item
            );
            return [newTemplate, ...updated];
          });
          
          templateForm.reset();
          setIsCreateTemplateOpen(false);
        } else {
          notify.error(result?.data?.error || t("notifications.createTemplateError") || "Falha ao criar o template.");
        }
      } catch {
        notify.error(t("notifications.unexpectedError") || "Erro inesperado ao realizar operação.");
      }
    });
  };

  const handleStartUpdateTemplate = (template: ContractTemplate) => {
    templateForm.reset({
      name: template.name,
      content: template.content,
      region: template.region,
      type: template.type,
      partyType: template.partyType,
      durationMonths: template.durationMonths || undefined,
    });
    setIsViewTemplateOpen(false);
    setIsCreateTemplateOpen(true);
  };

  const handleUpdateSchoolSettings = async (values: SchoolSettingsFormValues) => {
    startTransition(async () => {
      try {
        const result = await updateSchoolSettingsAction(values);
        if (result?.data?.success && result.data.data) {
          notify.success(t("notifications.schoolSettingsUpdated") || "Configurações da escola salvas com sucesso!");
          setSchoolSettings(result.data.data as SchoolSettings);
        } else {
          notify.error(result?.data?.error || t("notifications.schoolSettingsUpdateError") || "Falha ao atualizar configurações.");
        }
      } catch {
        notify.error(t("notifications.unexpectedError") || "Erro inesperado ao realizar operação.");
      }
    });
  };

  const handleDownloadContract = async (instanceId: string) => {
    setActionLoadingId(instanceId);
    try {
      const result = await getContractDownloadUrlAction({ instanceId });
      if (result?.data?.success && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
        notify.success(t("notifications.downloadInitiated") || "Download iniciado.");
      } else {
        notify.error(result?.data?.error || t("notifications.downloadError") || "Não foi possível carregar o arquivo PDF.");
      }
    } catch {
      notify.error(t("notifications.unexpectedError") || "Erro inesperado ao realizar operação.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendEmail = async (instanceId: string) => {
    setActionLoadingId(instanceId);
    try {
      const result = await resendContractEmailAction({ instanceId });
      if (result?.data?.success) {
        notify.success(t("notifications.emailSent") || "E-mail com contrato enviado com sucesso.");
      } else {
        notify.error(result?.data?.error || t("notifications.emailError") || "Erro ao reenviar e-mail de contrato.");
      }
    } catch {
      notify.error(t("notifications.unexpectedError") || "Erro inesperado ao realizar operação.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <header>
        <Header
          title={t("title") || "Contratos"}
          user={user}
          showSubHeader={false}
          className="contents"
        />
      </header>

      <main className="container max-w-7xl mx-auto space-y-6">
        {/* Sleek top intro bar */}
        <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {t("dashboardTitle") || "Painel de Gestão Contratual"}
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("dashboardDesc") || "Crie modelos de contratos, visualize assinaturas de alunos/professores e controle as configurações de auto-assinatura."}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateTemplateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("createTemplate") || "Criar Template"}
          </Button>
        </div>

        {/* Tab system */}
        <Tabs defaultValue="templates">
          <TabsList variant="line" className="mb-6 flex gap-4 border-b border-gray-200/50 dark:border-gray-800 pb-px">
            <TabsTrigger value="templates" className="pb-3 text-base">
              <FileCode className="w-4 h-4 mr-2" />
              {t("tabs.templates") || "Modelos de Contrato"}
            </TabsTrigger>
            <TabsTrigger value="instances" className="pb-3 text-base">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t("tabs.signatures") || "Assinaturas & Status"}
            </TabsTrigger>
            <TabsTrigger value="school" className="pb-3 text-base">
              <Building className="w-4 h-4 mr-2" />
              {t("tabs.schoolSettings") || "Dados da Escola"}
            </TabsTrigger>
          </TabsList>

          {/* Templates list Tab */}
          <TabsContent value="templates" className="space-y-4">
            <ContractTemplatesTab
              templates={templates}
              onView={(template) => {
                setSelectedTemplate(template);
                setIsViewTemplateOpen(true);
              }}
              onCreateNew={() => setIsCreateTemplateOpen(true)}
            />
          </TabsContent>

          {/* Instances Tab */}
          <TabsContent value="instances" className="space-y-4">
            <ContractInstancesTab
              instances={instances}
              actionLoadingId={actionLoadingId}
              onDownload={handleDownloadContract}
              onResendEmail={handleResendEmail}
            />
          </TabsContent>

          {/* School Settings Tab */}
          <TabsContent value="school" className="space-y-4">
            <SchoolSettingsTab
              schoolSettings={schoolSettings}
              onSubmit={handleUpdateSchoolSettings}
              isPending={isPending}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Vaul-based Modal Vault for Template Creation */}
      <Vault open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
        <VaultContent className="sm:max-w-2xl animate-in fade-in zoom-in-95 duration-200">
          <VaultHeader>
            <VaultTitle>{t("createTemplate") || "Criar Novo Modelo"}</VaultTitle>
            <VaultDescription>
              {t("createTemplateDesc") || "Crie um novo molde base. Caso já exista um template com o mesmo nome e região, a versão será incrementada e as antigas desativadas."}
            </VaultDescription>
          </VaultHeader>

          <VaultForm onSubmit={templateForm.handleSubmit(handleCreateTemplate)} className="space-y-4 pt-4">
            <VaultField
              label={t("form.name") || "Nome Fantasia do Modelo"}
              error={templateForm.formState.errors.name?.message}
              required
            >
              <Input
                placeholder="Ex: Contrato de Prestação de Serviços Acadêmicos"
                {...templateForm.register("name")}
              />
            </VaultField>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VaultField
                label={t("form.type") || "Destinatário"}
                error={templateForm.formState.errors.type?.message}
                required
              >
                <Controller
                  control={templateForm.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Aluno (Student)</SelectItem>
                        <SelectItem value="teacher">Professor (Teacher)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </VaultField>

              <VaultField
                label={t("form.region") || "Região (Idioma)"}
                error={templateForm.formState.errors.region?.message}
                required
              >
                <Controller
                  control={templateForm.control}
                  name="region"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BR">Brasil (BR)</SelectItem>
                        <SelectItem value="US">Estados Unidos (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </VaultField>

              <VaultField
                label={t("form.partyType") || "Tipo de Pessoa"}
                error={templateForm.formState.errors.partyType?.message}
                required
              >
                <Controller
                  control={templateForm.control}
                  name="partyType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Pessoa Física (PF)</SelectItem>
                        <SelectItem value="business">Pessoa Jurídica (PJ)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </VaultField>
            </div>

            {selectedType === "teacher" && (
              <VaultField
                label="Duração do Contrato (Meses)"
                error={templateForm.formState.errors.durationMonths?.message}
                required
              >
                <Input
                  type="number"
                  placeholder="Ex: 12"
                  {...templateForm.register("durationMonths", { valueAsNumber: true })}
                />
              </VaultField>
            )}

            <VaultField
              label={t("form.content") || "Conteúdo do Contrato (Monospace)"}
              error={templateForm.formState.errors.content?.message}
              required
            >
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground leading-normal block">
                  Você pode usar chaves duplas para placeholders como:
                  <code className="bg-muted px-1.5 py-0.5 rounded mx-1 text-primary">{"{{user.name}}"}</code>,
                  <code className="bg-muted px-1.5 py-0.5 rounded mx-1 text-primary">{"{{user.taxId}}"}</code>,
                  <code className="bg-muted px-1.5 py-0.5 rounded mx-1 text-primary">{"{{school.legalName}}"}</code>,
                  <code className="bg-muted px-1.5 py-0.5 rounded mx-1 text-primary">{"{{school.taxId}}"}</code>,
                  <code className="bg-muted px-1.5 py-0.5 rounded mx-1 text-primary">{"{{date}}"}</code>.
                </span>
                <Textarea
                  placeholder="Escreva os termos e condições do contrato aqui..."
                  className="font-mono text-sm min-h-[250px] leading-relaxed bg-gray-50/50 dark:bg-gray-950/20"
                  {...templateForm.register("content")}
                />
              </div>
            </VaultField>

            <VaultFooter className="mt-6">
              <VaultPrimaryButton type="submit" disabled={isPending}>
                {t("create") || "Criar Template"}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultContent>
      </Vault>

      {/* Vault de Leitura do Conteúdo do Contrato */}
      <Vault open={isViewTemplateOpen} onOpenChange={setIsViewTemplateOpen}>
        <VaultContent className="sm:max-w-3xl animate-in fade-in zoom-in-95 duration-200">
          <VaultHeader>
            <VaultTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-primary" />
              {selectedTemplate?.name}
            </VaultTitle>
            <VaultDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
              <span>Região: <strong className="uppercase">{selectedTemplate?.region}</strong></span>
              <span>Destinatário: <strong>{selectedTemplate?.type === "student" ? "Aluno" : "Professor"}</strong></span>
              <span>Tipo: <strong>{selectedTemplate?.partyType === "individual" ? "Pessoa Física (PF)" : "Pessoa Jurídica (PJ)"}</strong></span>
              {selectedTemplate?.durationMonths && (
                <span>Duração: <strong>{selectedTemplate.durationMonths} meses</strong></span>
              )}
              <span>Versão atual: <strong className="font-mono bg-muted px-1.5 py-0.5 rounded">v{selectedTemplate?.version}</strong></span>
            </VaultDescription>
          </VaultHeader>

          <div className="py-4 space-y-4">
            <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                Este é o molde base usado para gerar assinaturas. Os campos envoltos em <code>{"{{...}}"}</code> serão preenchidos dinamicamente com os dados do usuário e da escola no momento da assinatura.
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto border rounded-lg bg-gray-50/50 dark:bg-gray-950/20 p-4 leading-relaxed font-mono text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {selectedTemplate?.content}
            </div>
          </div>

          <VaultFooter className="mt-4 border-t pt-4">
            <Button
              onClick={() => selectedTemplate && handleStartUpdateTemplate(selectedTemplate)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar Nova Versão ({selectedTemplate ? `v${parseInt(selectedTemplate.version) + 1}` : ""})
            </Button>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}

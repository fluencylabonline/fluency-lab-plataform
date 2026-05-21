"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
  VaultPrimaryButton,
  VaultSecondaryButton,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Download,
  Mail,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  FileCode,
  Calendar,
  Sparkles,
} from "lucide-react";

import type { User } from "@/modules/user/user.schema";

// Types mapping for standard Drizzle load
interface ContractInstanceExtended extends ContractInstance {
  template: ContractTemplate;
  user: {
    name: string;
    email: string;
  };
}

interface SchoolAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
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
});

const schoolSettingsFormSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "O nome fantasia é obrigatório."),
  legalName: z.string().min(2, "A razão social é obrigatória."),
  taxId: z.string().min(9, "CNPJ ou Tax ID inválido."),
  representativeName: z.string().min(2, "O nome do representante é obrigatório."),
  representativeTaxId: z.string().min(11, "O CPF ou Tax ID do representante é inválido."),
  address: z.object({
    street: z.string().min(1, "A rua é obrigatória."),
    number: z.string().min(1, "O número é obrigatório."),
    neighborhood: z.string().min(1, "O bairro é obrigatório."),
    city: z.string().min(1, "A cidade é obrigatória."),
    state: z.string().min(2, "O estado é obrigatório."),
    zip: z.string().min(5, "O CEP ou ZIP é obrigatório."),
  }),
});

type CreateTemplateFormValues = z.input<typeof createTemplateFormSchema>;
type SchoolSettingsFormValues = z.input<typeof schoolSettingsFormSchema>;

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

  // Forms initializations
  const templateForm = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateFormSchema),
    defaultValues: {
      name: "",
      content: "",
      region: "BR",
      type: "student",
      partyType: "individual",
    },
  });

  const initialAddress = schoolSettings?.address as SchoolAddress | undefined;

  const schoolSettingsForm = useForm<SchoolSettingsFormValues>({
    resolver: zodResolver(schoolSettingsFormSchema),
    defaultValues: {
      id: schoolSettings?.id || null,
      name: schoolSettings?.name || "",
      legalName: schoolSettings?.legalName || "",
      taxId: schoolSettings?.taxId || "",
      representativeName: schoolSettings?.representativeName || "",
      representativeTaxId: schoolSettings?.representativeTaxId || "",
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
      schoolSettingsForm.reset({
        id: schoolSettings.id,
        name: schoolSettings.name,
        legalName: schoolSettings.legalName,
        taxId: schoolSettings.taxId,
        representativeName: schoolSettings.representativeName,
        representativeTaxId: schoolSettings.representativeTaxId,
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
  }, [schoolSettings, schoolSettingsForm]);

  // Actions execution helpers
  const handleCreateTemplate = async (values: CreateTemplateFormValues) => {
    startTransition(async () => {
      try {
        const result = await createContractTemplateAction(values);
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

  // Helper formatting values
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge variant="success">{t("status.signed") || "Assinado"}</Badge>;
      case "pending":
        return <Badge variant="warning">{t("status.pending") || "Pendente"}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("status.cancelled") || "Cancelado"}</Badge>;
      case "expired":
        return <Badge variant="outline">{t("status.expired") || "Expirado"}</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  return (
    <div>
      <header>
        <Header
          title={t("title") || "Contratos"}
          user={user}
          showSubHeader={false}
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
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("templates.listTitle") || "Templates Disponíveis"}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {templates.length} {templates.length === 1 ? "modelo encontrado" : "modelos encontrados"}
                </span>
              </div>

              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {t("templates.empty") || "Nenhum modelo de contrato cadastrado."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {t("templates.emptyDesc") || "Crie um novo modelo para habilitar as assinaturas automáticas."}
                  </p>
                  <Button onClick={() => setIsCreateTemplateOpen(true)}>
                    {t("createTemplate") || "Criar Template"}
                  </Button>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("templates.name") || "Nome do Documento"}</TableHead>
                        <TableHead>{t("templates.region") || "Região"}</TableHead>
                        <TableHead>{t("templates.type") || "Destinatário"}</TableHead>
                        <TableHead>{t("templates.partyType") || "Tipo de Assinatura"}</TableHead>
                        <TableHead className="text-center">{t("templates.version") || "Versão"}</TableHead>
                        <TableHead className="text-center">{t("templates.status") || "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                            {template.name}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 capitalize">
                              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                              {template.region}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {template.type === "student" ? "Aluno" : "Professor"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize text-xs font-medium bg-muted px-2.5 py-1 rounded">
                              {template.partyType === "individual" ? "Pessoa Física (PF)" : "Pessoa Jurídica (PJ)"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            v{template.version}
                          </TableCell>
                          <TableCell className="text-center">
                            {template.isActive ? (
                              <Badge variant="success">{t("templates.active") || "Ativo"}</Badge>
                            ) : (
                              <Badge variant="ghost">{t("templates.inactive") || "Inativo"}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Instances Tab */}
          <TabsContent value="instances" className="space-y-4">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {t("instances.title") || "Contratos Gerados & Assinados"}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {instances.length} {instances.length === 1 ? "registro encontrado" : "registros encontrados"}
                </span>
              </div>

              {instances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {t("instances.empty") || "Nenhum contrato gerado ou assinado."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("instances.emptyDesc") || "As assinaturas dos usuários serão listadas aqui conforme o fluxo do sistema."}
                  </p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("instances.user") || "Usuário"}</TableHead>
                        <TableHead>{t("instances.template") || "Template"}</TableHead>
                        <TableHead>{t("instances.status") || "Status"}</TableHead>
                        <TableHead>{t("instances.createdAt") || "Gerado em"}</TableHead>
                        <TableHead>{t("instances.signedAt") || "Assinado em"}</TableHead>
                        <TableHead className="text-right">{t("instances.actions") || "Ações"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instances.map((instance) => (
                        <TableRow key={instance.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {instance.user?.name || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {instance.user?.email || ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                {instance.template?.name || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                v{instance.template?.version || "1"} ({instance.template?.region || "BR"})
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(instance.status)}</TableCell>
                          <TableCell className="text-xs">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {new Date(instance.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {instance.signedAt ? (
                              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {new Date(instance.signedAt).toLocaleDateString("pt-BR")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {t("status.awaiting") || "Pendente"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {instance.status === "signed" && instance.pdfUrl && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadContract(instance.id)}
                                    isLoading={actionLoadingId === instance.id}
                                    title={t("actions.download") || "Baixar PDF"}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendEmail(instance.id)}
                                    isLoading={actionLoadingId === instance.id}
                                    title={t("actions.resendEmail") || "Reenviar Contrato"}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {instance.pdfUrl && (
                                <a
                                  href={`/verify/${instance.integrityHash || ""}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                                  title={t("actions.verify") || "Verificar Assinatura"}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* School Settings Tab */}
          <TabsContent value="school" className="space-y-4">
            <div className="card p-6 max-w-4xl">
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

              <form onSubmit={schoolSettingsForm.handleSubmit(handleUpdateSchoolSettings)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VaultField
                    label={t("school.name") || "Nome Fantasia da Escola"}
                    error={schoolSettingsForm.formState.errors.name?.message}
                    required
                  >
                    <Input
                      placeholder={t("school.namePlaceholder") || "FluencyLab Idiomas"}
                      {...schoolSettingsForm.register("name")}
                    />
                  </VaultField>

                  <VaultField
                    label={t("school.legalName") || "Razão Social"}
                    error={schoolSettingsForm.formState.errors.legalName?.message}
                    required
                  >
                    <Input
                      placeholder={t("school.legalNamePlaceholder") || "FluencyLab S/A Limitada"}
                      {...schoolSettingsForm.register("legalName")}
                    />
                  </VaultField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <VaultField
                    label={t("school.taxId") || "CNPJ ou Tax ID"}
                    error={schoolSettingsForm.formState.errors.taxId?.message}
                    required
                  >
                    <Input
                      placeholder="00.000.000/0001-00"
                      {...schoolSettingsForm.register("taxId")}
                    />
                  </VaultField>

                  <VaultField
                    label={t("school.representativeName") || "Representante Legal"}
                    error={schoolSettingsForm.formState.errors.representativeName?.message}
                    required
                  >
                    <Input
                      placeholder={t("school.repPlaceholder") || "Nome do Gestor"}
                      {...schoolSettingsForm.register("representativeName")}
                    />
                  </VaultField>

                  <VaultField
                    label={t("school.representativeTaxId") || "CPF do Representante"}
                    error={schoolSettingsForm.formState.errors.representativeTaxId?.message}
                    required
                  >
                    <Input
                      placeholder="000.000.000-00"
                      {...schoolSettingsForm.register("representativeTaxId")}
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
                      error={schoolSettingsForm.formState.errors.address?.zip?.message}
                      required
                    >
                      <Input
                        placeholder="00000-000"
                        {...schoolSettingsForm.register("address.zip")}
                      />
                    </VaultField>

                    <div className="md:col-span-2">
                      <VaultField
                        label="Logradouro (Rua/Avenida)"
                        error={schoolSettingsForm.formState.errors.address?.street?.message}
                        required
                      >
                        <Input
                          placeholder="Av. Paulista"
                          {...schoolSettingsForm.register("address.street")}
                        />
                      </VaultField>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <VaultField
                      label="Número"
                      error={schoolSettingsForm.formState.errors.address?.number?.message}
                      required
                    >
                      <Input
                        placeholder="1000"
                        {...schoolSettingsForm.register("address.number")}
                      />
                    </VaultField>

                    <VaultField
                      label="Bairro"
                      error={schoolSettingsForm.formState.errors.address?.neighborhood?.message}
                      required
                    >
                      <Input
                        placeholder="Bela Vista"
                        {...schoolSettingsForm.register("address.neighborhood")}
                      />
                    </VaultField>

                    <VaultField
                      label="Cidade"
                      error={schoolSettingsForm.formState.errors.address?.city?.message}
                      required
                    >
                      <Input
                        placeholder="São Paulo"
                        {...schoolSettingsForm.register("address.city")}
                      />
                    </VaultField>

                    <VaultField
                      label="Estado / UF"
                      error={schoolSettingsForm.formState.errors.address?.state?.message}
                      required
                    >
                      <Input
                        placeholder="SP"
                        maxLength={2}
                        {...schoolSettingsForm.register("address.state")}
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
              <VaultSecondaryButton type="button" onClick={() => setIsCreateTemplateOpen(false)}>
                {t("cancel") || "Cancelar"}
              </VaultSecondaryButton>
              <VaultPrimaryButton type="submit" disabled={isPending}>
                {t("create") || "Criar Template"}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultContent>
      </Vault>
    </div>
  );
}

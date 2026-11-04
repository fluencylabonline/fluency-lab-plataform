"use client";

import { useTranslations } from "next-intl";
import { useValidationMessage } from "@/hooks/use-validation-message";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserAction } from "@/modules/user/user.actions";
import { notify } from "@/components/ui/toaster";
import { UserRoles } from "@/lib/rbac";
import {
  Vault,
  VaultBody,
  VaultContent,
  VaultField,
  VaultFooter,
  VaultForm,
  VaultHeader,
  VaultInput,
  VaultTitle,
  VaultDescription,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultIcon,
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserSchema, type CreateUserValues } from "@/modules/user/user.schema";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, Plus, X, Loader2, CreditCard, Info, ArrowLeft, Mail, FileText, UserCheck, Globe, Calendar } from "lucide-react";
import { CalendarVault } from "@/components/ui/calendar";
import { getPlansAction } from "@/modules/billing/billing.actions";
import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Plan } from "@/modules/billing/billing.schema";

interface CreateUserVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserVault({ open, onOpenChange }: CreateUserVaultProps) {
  const t = useTranslations("UserManagement");
  const vm = useValidationMessage();
  const tRoles = useTranslations("UserRoles");
  const { locale } = useParams();

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "student",
      classesStartDate: "",
      languages: [],
      locale: (locale === "en" || locale === "pt") ? locale : "pt",
      cellphone: "",
      assignedPlanId: null,
    },
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string, name: string }[]>([]);

  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState<CreateUserValues | null>(null);
  const [isSubmittingReal, setIsSubmittingReal] = useState(false);

  useEffect(() => {
    if (open) {
      getPlansAction().then(result => {
        if (result?.data?.success) {
          setPlans(result.data.data);
        }
      });
      getLanguagesAction({}).then(result => {
        if (result?.data) {
          setAvailableLanguages(result.data.map(l => ({ code: l.code, name: l.name })));
        }
      });
    } else {
      setIsConfirming(false);
      setFormData(null);
      setIsSubmittingReal(false);
    }
  }, [open]);

  const { formState: { errors, isSubmitting }, handleSubmit, reset, setValue, control } = form;

  const role = useWatch({ control, name: "role" });
  const assignedPlanId = useWatch({ control, name: "assignedPlanId" });
  const localeValue = useWatch({ control, name: "locale" });
  const classesStartDate = useWatch({ control, name: "classesStartDate" });

  const onSubmit: SubmitHandler<CreateUserValues> = (data) => {
    console.log("[CreateUserVault] onSubmit (pre-confirmation):", data);
    setFormData(data);
    setIsConfirming(true);
  };

  const handleRealSubmit = async () => {
    if (!formData) return;
    console.log("[CreateUserVault] handleRealSubmit:", formData);
    setIsSubmittingReal(true);
    const toastId = "create-user-toast";
    notify.loading(t("toasts.creatingUser"), undefined, toastId);

    try {
      const result = await createUserAction(formData);

      if (result?.data?.success) {
        notify.success(
          t("toasts.successTitle"),
          t("toasts.successDescription", { email: formData.email }),
          toastId
        );
        onOpenChange(false);
        reset();
      } else {
        const errorKey = result?.data?.error;
        if (errorKey === "userAlreadyExists") {
          notify.error(
            t("toasts.userAlreadyExists"),
            t("toasts.userAlreadyExistsDescription"),
            toastId
          );
        } else {
          notify.error(
            t("toasts.errorTitle"),
            t("toasts.errorDescription"),
            toastId
          );
        }
      }
    } catch (error) {
      console.error("[CreateUserVault] error:", error);
      const isActionSkew =
        String(error).includes("UnrecognizedActionError") ||
        String(error).includes("was not found on the server") ||
        String(error).includes("Server Action");

      if (isActionSkew) {
        notify.error(
          "Nova versão disponível",
          "A plataforma foi atualizada em produção. A página será recarregada para sincronizar a nova versão...",
          toastId
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      notify.error(
        t("toasts.errorTitle"),
        t("toasts.errorDescription"),
        toastId
      );
    } finally {
      setIsSubmittingReal(false);
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        {isConfirming && formData ? (
          <>
            <VaultIcon type="confirm" />
            <VaultHeader>
              <VaultTitle>{t("confirmTitle") || "Confirmar Dados"}</VaultTitle>
              <VaultDescription>{t("confirmDescription") || "Revise as informações abaixo antes de criar o usuário."}</VaultDescription>
            </VaultHeader>

            <VaultBody className="space-y-4">
              {/* User Information */}
              <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/40 dark:bg-white/5 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-white/10 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Informações Pessoais</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Nome Completo</span>
                      <span className="font-medium text-foreground">{formData.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">E-mail</span>
                      <span className="font-medium text-foreground">{formData.email}</span>
                    </div>
                    {formData.cellphone && (
                      <div>
                        <span className="text-xs text-muted-foreground block">Celular</span>
                        <span className="font-medium text-foreground">{formData.cellphone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground block">Idioma de Exibição</span>
                      <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        {formData.locale === "pt" ? "Português (Brasil)" : "English (US)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Função / Tipo</span>
                      <span className="font-medium text-foreground mt-0.5 inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground font-semibold">
                        {tRoles(formData.role as Parameters<typeof tRoles>[0]) || formData.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Billing & Contract Information */}
              {formData.role === UserRoles.STUDENT && (
                <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50/40 dark:bg-white/5 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-white/10 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">Pacote & Contrato</span>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground block">Data de Início das Aulas</span>
                        <span className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {formData.classesStartDate ? (() => {
                            const parts = formData.classesStartDate.split("-");
                            if (parts.length === 3) {
                              return `${parts[2]}/${parts[1]}/${parts[0]}`;
                            }
                            return formData.classesStartDate;
                          })() : "Não informada"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Plano Vinculado</span>
                        <span className="font-medium text-foreground block mt-0.5">
                          {(() => {
                            const plan = plans.find(p => p.id === formData.assignedPlanId);
                            return plan ? (
                              <span className="inline-flex items-center gap-1.5">
                                {plan.name}
                                {plan.language && (
                                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full dark:bg-primary/20 dark:text-primary-foreground">
                                    {plan.language}
                                  </span>
                                )}
                              </span>
                            ) : (
                              "Nenhum plano"
                            );
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Contract Notice Alert */}
                    {formData.assignedPlanId && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs flex gap-2 items-start leading-relaxed">
                        <FileText className="w-4 h-4 shrink-0 mt-0.5 text-yellow-500" />
                        <span>
                          {t("contractNotice") || "O contrato do aluno será criado automaticamente com base neste pacote. Isso definirá a duração do contrato e o valor da mensalidade."}
                        </span>
                      </div>
                    )}

                    {/* Billing Simulation */}
                    {formData.classesStartDate && formData.assignedPlanId && (
                      <div className="mt-2 p-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-gray-200/50 dark:border-gray-700/50 pb-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Simulação de Faturamento</span>
                        </div>
                        {(() => {
                          const plan = plans.find(p => p.id === formData.assignedPlanId);
                          if (!plan) return null;

                          const dateObj = new Date(formData.classesStartDate + "T12:00:00");
                          const currentDay = dateObj.getDate();

                          let remainingClasses = 4;
                          let isProRata = false;

                          if (currentDay >= 20) {
                            remainingClasses = 1;
                            isProRata = true;
                          } else if (currentDay >= 15) {
                            remainingClasses = 2;
                            isProRata = true;
                          } else if (currentDay >= 6) {
                            remainingClasses = 3;
                            isProRata = true;
                          } else {
                            remainingClasses = 4;
                            isProRata = false;
                          }

                          const price = plan.price;
                          const proRataAmount = Math.round((price / 4) * remainingClasses);

                          let calculatedDueDate: Date;
                          if (currentDay >= 20) {
                            calculatedDueDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
                          } else {
                            calculatedDueDate = new Date(dateObj);
                            calculatedDueDate.setDate(calculatedDueDate.getDate() + 10);
                          }

                          const formatCurrency = (val: number, cur: string) => {
                            const value = val / 100;
                            return cur === "USD"
                              ? `US$ ${value.toFixed(2)}`
                              : `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                          };

                          const formattedDueDate = `${String(calculatedDueDate.getDate()).padStart(2, "0")}/${String(calculatedDueDate.getMonth() + 1).padStart(2, "0")}/${calculatedDueDate.getFullYear()}`;

                          return (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Mensalidade Cheia:</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(price, plan.currency || "BRL")}
                                </span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>Primeiro Pagamento ({isProRata ? `Proporcional: ${remainingClasses}/4 semanas` : "Integral"}):</span>
                                <span className="font-semibold text-primary">
                                  {formatCurrency(proRataAmount, plan.currency || "BRL")}
                                </span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>Vencimento do 1º Pagamento:</span>
                                <span className="font-medium text-foreground">
                                  {formattedDueDate}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Password Instructions Alert */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex gap-2 items-start leading-relaxed">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>
                  {t("emailNotice") || "Um e-mail será enviado para este endereço com as instruções para criação da senha."}
                </span>
              </div>
            </VaultBody>

            <VaultFooter className="mt-2">
              <VaultSecondaryButton
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={isSubmittingReal}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("backBtn") || "Voltar"}
              </VaultSecondaryButton>
              <VaultPrimaryButton
                type="button"
                onClick={handleRealSubmit}
                disabled={isSubmittingReal}
              >
                {isSubmittingReal ? (
                  <Loader2 className="w-5 h-5 ml-1 animate-spin" />
                ) : (
                  <>
                    {t("confirmAndCreateBtn") || "Confirmar e Criar"}
                    <Check className="w-5 h-5 ml-1" />
                  </>
                )}
              </VaultPrimaryButton>
            </VaultFooter>
          </>
        ) : (
          <>
            <VaultIcon type="user" />
            <VaultHeader>
              <VaultTitle>{t("createUserTitle")}</VaultTitle>
              <VaultDescription>{t("createUserDescription")}</VaultDescription>
            </VaultHeader>

            <VaultForm onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}>
              <VaultBody>
                <VaultField
                  label={t("fullName")}
                  required
                  error={vm(errors.name?.message)}
                >
                  <VaultInput
                    {...form.register("name")}
                    placeholder={t("fullNamePlaceholder")}
                  />
                </VaultField>

                <VaultField
                  label={t("email")}
                  required
                  error={vm(errors.email?.message)}
                >
                  <VaultInput
                    type="email"
                    {...form.register("email")}
                    placeholder={t("emailPlaceholder")}
                  />
                </VaultField>

                <VaultField
                  label={t("cellphone")}
                  error={vm(errors.cellphone?.message)}
                >
                  <VaultInput
                    {...form.register("cellphone")}
                    placeholder="Ex: 5511999999999"
                  />
                </VaultField>

                <div className="grid grid-cols-2 gap-4">
                  <VaultField
                    label={t("displayLanguage") || "Idioma de exibição"}
                    required
                    error={vm(errors.locale?.message)}
                  >
                    <Select
                      value={localeValue}
                      onValueChange={(val) => setValue("locale", val as "pt" | "en", { shouldValidate: true })}
                    >
                      <SelectTrigger className="h-10 rounded-md bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-medium">
                        <SelectValue placeholder={t("displayLanguagePlaceholder") || "Selecione o idioma de exibição"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value="pt" className="rounded-lg">
                          Português (Brasil)
                        </SelectItem>
                        <SelectItem value="en" className="rounded-lg">
                          English (US)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </VaultField>

                  <VaultField
                    label={t("type")}
                    required
                    error={vm(errors.role?.message)}
                  >
                    <Select
                      value={role}
                      onValueChange={(val) => setValue("role", val as UserRoles)}
                    >
                      <SelectTrigger className="h-10 rounded-md bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {Object.entries(UserRoles).map(([, value]) => (
                          <SelectItem key={value} value={value} className="rounded-lg">
                            {tRoles(value as Parameters<typeof tRoles>[0]) || value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </VaultField>
                </div>

                {role === UserRoles.STUDENT && (
                  <>
                    <VaultField label={t("classesStartDate")}>
                      <input type="hidden" {...form.register("classesStartDate")} value={classesStartDate || ""} />
                      <CalendarVault
                        date={classesStartDate ? new Date(classesStartDate + "T12:00:00") : undefined}
                        onSelect={(date) => {
                          const formatted = date 
                            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` 
                            : "";
                          setValue("classesStartDate", formatted, { shouldValidate: true });
                        }}
                        placeholder={t("classesStartDatePlaceholder") || "Selecione a data"}
                        label={t("classesStartDate")}
                        className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md font-medium"
                      />
                    </VaultField>

                    <VaultField label={t("assignedPlan")} error={vm(errors.assignedPlanId?.message)}>
                      <div className="space-y-2">
                        {assignedPlanId ? (
                          (() => {
                            const selectedPlan = plans.find((p) => p.id === assignedPlanId);
                            return (
                              <div className="flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/20">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                  <span className="text-sm font-medium truncate">
                                    {selectedPlan?.name}
                                  </span>
                                  {selectedPlan?.language && (
                                    <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 dark:bg-primary/20 dark:text-primary-foreground">
                                      {selectedPlan.language}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setValue("assignedPlanId", null)}
                                  className="h-8 w-8 p-0 hover:bg-primary/10 text-primary ml-2 shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })()
                        ) : (
                          <Command className="rounded-md border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                            <CommandInput placeholder={t("search")} />
                            <CommandList className="max-h-[200px]">
                              <CommandEmpty>{t("noResults")}</CommandEmpty>
                              <CommandGroup>
                                {plans.map((plan) => (
                                  <CommandItem
                                    key={plan.id}
                                    value={plan.name}
                                    onSelect={() => {
                                      setValue("assignedPlanId", plan.id);
                                      // Auto-fill studying language if it matches the plan's language
                                      if (plan.language) {
                                        const matchedLang = availableLanguages.find(
                                          (l) => l.name.toLowerCase() === plan.language?.toLowerCase()
                                        );
                                        if (matchedLang) {
                                          setValue("languages", [matchedLang.code], { shouldValidate: true });
                                        }
                                      }
                                    }}
                                    className="rounded-lg flex justify-between items-center"
                                  >
                                    <span>{plan.name}</span>
                                    {plan.language && (
                                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full dark:bg-primary/20 dark:text-primary-foreground">
                                        {plan.language}
                                      </span>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        )}
                      </div>
                    </VaultField>

                    {classesStartDate && (
                      <div className="mt-4 p-4 rounded-md border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <CreditCard className="w-4 h-4 text-primary shrink-0" />
                          <span>Simulação de Faturamento</span>
                        </div>

                        {!assignedPlanId ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
                            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            Aguardando plano de aulas para calcular valor proporcional.
                          </p>
                        ) : (
                          (() => {
                            const plan = plans.find(p => p.id === assignedPlanId);
                            if (!plan) return null;

                            const dateObj = new Date(classesStartDate + "T12:00:00");
                            const currentDay = dateObj.getDate();

                            let remainingClasses = 4;
                            let isProRata = false;

                            if (currentDay >= 20) {
                              remainingClasses = 1;
                              isProRata = true;
                            } else if (currentDay >= 15) {
                              remainingClasses = 2;
                              isProRata = true;
                            } else if (currentDay >= 6) {
                              remainingClasses = 3;
                              isProRata = true;
                            } else {
                              remainingClasses = 4;
                              isProRata = false;
                            }

                            const price = plan.price;
                            const proRataAmount = Math.round((price / 4) * remainingClasses);

                            let calculatedDueDate: Date;
                            if (currentDay >= 20) {
                              calculatedDueDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
                            } else {
                              calculatedDueDate = new Date(dateObj);
                              calculatedDueDate.setDate(calculatedDueDate.getDate() + 10);
                            }

                            const formatCurrency = (val: number, cur: string) => {
                              const value = val / 100;
                              return cur === "USD"
                                ? `US$ ${value.toFixed(2)}`
                                : `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                            };

                            const formattedDueDate = `${String(calculatedDueDate.getDate()).padStart(2, "0")}/${String(calculatedDueDate.getMonth() + 1).padStart(2, "0")}/${calculatedDueDate.getFullYear()}`;

                            return (
                              <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Mensalidade Cheia:</span>
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(price, plan.currency || "BRL")}
                                  </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Primeiro Pagamento ({isProRata ? `Proporcional: ${remainingClasses}/4 semanas` : "Integral"}):</span>
                                  <span className="font-semibold text-primary">
                                    {formatCurrency(proRataAmount, plan.currency || "BRL")}
                                  </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Vencimento do 1º Pagamento:</span>
                                  <span className="font-medium text-foreground">
                                    {formattedDueDate}
                                  </span>
                                </div>

                                {isProRata && (
                                  <div className="mt-2 p-2.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] leading-relaxed">
                                    Cálculo Pró-rata ativo. O valor proporcional é calculado dividindo a mensalidade em 4 partes (semanas) e cobrando apenas as semanas restantes a partir da data de início das aulas (dia {currentDay}). Isso se aplica independentemente do plano ter 2, 3 ou mais aulas semanais.
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    )}
                  </>
                )}
            </VaultBody>

            <VaultFooter className="mt-2">
              <VaultSecondaryButton
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </VaultSecondaryButton>
              <VaultPrimaryButton
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-1 animate-spin" />
                  </>
                ) : (
                  <>
                    {t("createUser")}
                    <Plus className="w-5 h-5 ml-1" />
                  </>
                )}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </>
      )}
      </VaultContent>
    </Vault>
  );
}
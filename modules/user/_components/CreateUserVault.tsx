"use client";

import { useTranslations } from "next-intl";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createUserSchema, type CreateUserValues } from "@/modules/user/user.schema";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, Plus, X } from "lucide-react";
import { getPlansAction } from "@/modules/billing/billing.actions";
import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface CreateUserVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserVault({ open, onOpenChange }: CreateUserVaultProps) {
  const t = useTranslations("UserManagement");
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
      cellphone: "",
      assignedPlanId: null,
    },
  });

  const [plans, setPlans] = useState<{ id: string, name: string }[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string, name: string }[]>([]);

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
    }
  }, [open]);

  const { formState: { errors, isSubmitting }, handleSubmit, reset, setValue, getValues, control } = form;

  const role = useWatch({ control, name: "role" });
  const selectedLanguages = useWatch({ control, name: "languages" }) || [];
  const assignedPlanId = useWatch({ control, name: "assignedPlanId" });

  const onSubmit: SubmitHandler<CreateUserValues> = async (data) => {
    const promise = createUserAction({
      ...data,
      locale: locale as "pt" | "en",
    });

    notify.promise(promise, {
      loading: t("toasts.creatingUser"),
      success: (result) => {
        if (result?.data?.success) {
          onOpenChange(false);
          reset();
          return t("toasts.successTitle");
        }
        throw new Error(result?.data?.error || "error");
      },
      error: () => {
        return t("toasts.errorTitle");
      },
    });
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
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
              error={errors.name?.message ? t(errors.name.message as Parameters<typeof t>[0]) : undefined}
            >
              <VaultInput
                {...form.register("name")}
                placeholder={t("fullNamePlaceholder")}
              />
            </VaultField>

            <VaultField
              label={t("email")}
              required
              error={errors.email?.message ? t(errors.email.message as Parameters<typeof t>[0]) : undefined}
            >
              <VaultInput
                type="email"
                {...form.register("email")}
                placeholder={t("emailPlaceholder")}
              />
            </VaultField>

            <VaultField
              label={t("cellphone")}
              error={errors.cellphone?.message ? t(errors.cellphone.message as Parameters<typeof t>[0]) : undefined}
            >
              <VaultInput
                {...form.register("cellphone")}
                placeholder="Ex: +55 11 99999-9999"
              />
            </VaultField>

            <VaultField
              label={t("type")}
              required
              error={errors.role?.message ? t(errors.role.message as Parameters<typeof t>[0]) : undefined}
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

            {role === UserRoles.STUDENT && (
              <>
                <VaultField label={t("classesStartDate")}>
                  <VaultInput
                    type="date"
                    {...form.register("classesStartDate")}
                    className="h-10"
                  />
                </VaultField>

                <VaultField label={t("assignedPlan")} error={errors.assignedPlanId?.message}>
                  <div className="space-y-2">
                    {assignedPlanId ? (
                      <div className="flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            {plans.find((p) => p.id === assignedPlanId)?.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setValue("assignedPlanId", null)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 text-primary"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
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
                                }}
                                className="rounded-lg"
                              >
                                {plan.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    )}
                  </div>
                </VaultField>

                <VaultField label={t("studyingLanguages")}>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {availableLanguages.map((lang) => (
                      <label key={lang.code} className="flex items-center gap-2 cursor-pointer group">
                        <Checkbox
                          checked={selectedLanguages.includes(lang.code)}
                          onCheckedChange={(checked) => {
                            const current = getValues("languages") || [];
                            if (checked) {
                              setValue("languages", [...current, lang.code]);
                            } else {
                              setValue("languages", current.filter((l) => l !== lang.code));
                            }
                          }}
                          className="rounded-md border-gray-300 dark:border-gray-600 accent-primary"
                        />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">
                          {lang.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </VaultField>
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
              {t("createUser")}
              <Plus className="w-5 h-5 ml-1" />
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultForm>
      </VaultContent>
    </Vault>
  );
}
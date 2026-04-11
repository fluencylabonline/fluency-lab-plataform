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
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { createUserSchema, type CreateUserValues } from "@/modules/user/user.schema";

interface CreateUserVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_LANGUAGES = [
  { id: "english", label: "Inglês" },
  { id: "portuguese", label: "Português" },
  { id: "spanish", label: "Espanhol" },
];

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
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, reset, setValue, getValues, control } = form;

  const role = useWatch({ control, name: "role" });
  const selectedLanguages = useWatch({ control, name: "languages" }) || [];

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
              label={t("type")}
              required
              error={errors.role?.message ? t(errors.role.message as Parameters<typeof t>[0]) : undefined}
            >
              <Select
                value={role}
                onValueChange={(val) => setValue("role", val as UserRoles)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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

                <VaultField label={t("studyingLanguages")}>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <label key={lang.id} className="flex items-center gap-2 cursor-pointer group">
                        <Checkbox
                          checked={selectedLanguages.includes(lang.id)}
                          onChange={(e) => {
                            const checked = (e.target as HTMLInputElement).checked;
                            const current = getValues("languages") || [];
                            if (checked) {
                              setValue("languages", [...current, lang.id]);
                            } else {
                              setValue("languages", current.filter((l) => l !== lang.id));
                            }
                          }}
                          className="rounded-md border-gray-300 dark:border-gray-600 accent-primary"
                        />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">
                          {lang.label}
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
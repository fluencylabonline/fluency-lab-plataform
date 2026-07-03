"use client";

import { useTranslations } from "next-intl";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notify } from "@/components/ui/toaster";
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
import { insertProcedureSchema } from "@/modules/procedure/procedure.schema";
import { z } from "zod";
import { Plus } from "lucide-react";
import { createProcedureAction } from "@/modules/procedure/procedure.actions";
import { useRouter } from "@/i18n/navigation";

type CreateProcedureValues = z.input<typeof insertProcedureSchema>;

interface NewProcedureVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProcedureVault({ open, onOpenChange }: NewProcedureVaultProps) {
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const form = useForm<CreateProcedureValues>({
    resolver: zodResolver(insertProcedureSchema),
    defaultValues: {
      title: "",
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, reset } = form;

  const onSubmit: SubmitHandler<CreateProcedureValues> = async (data) => {
    const promise = createProcedureAction(data);

    notify.promise(promise, {
      loading: "Criando procedimento...",
      success: (result) => {
        if (result?.data?.procedureId) {
          onOpenChange(false);
          reset();
          // Redirect to the procedure editor
          router.push(`/hub/admin/procedures/${result.data.procedureId}`);
          return "Procedimento criado!";
        }
        throw new Error(result?.serverError || "Erro desconhecido");
      },
      error: (err: unknown) => {
        return (err as Error)?.message || "Erro ao criar procedimento";
      },
    });
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-md">
        <VaultIcon type="info" />
        <VaultHeader>
          <VaultTitle>Novo POP</VaultTitle>
          <VaultDescription>Crie um novo Procedimento Operacional Padrão</VaultDescription>
        </VaultHeader>

        <VaultForm onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}>
          <VaultBody className="space-y-4">
            <VaultField
              label="Título do Procedimento"
              required
              error={errors.title?.message}
            >
              <VaultInput
                {...form.register("title")}
                placeholder="Ex: Como realizar matrículas"
                className="h-12 rounded-2xl"
              />
            </VaultField>
          </VaultBody>

          <VaultFooter>
            <VaultSecondaryButton
              type="button"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </VaultSecondaryButton>
            <VaultPrimaryButton
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Criando..." : "Criar POP"}
              <Plus className="w-5 h-5 ml-1" />
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultForm>
      </VaultContent>
    </Vault>
  );
}

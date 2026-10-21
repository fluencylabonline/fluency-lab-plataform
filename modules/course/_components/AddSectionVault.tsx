"use client";

import { useTranslations } from "next-intl";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addSectionAction } from "@/modules/course/course.actions";
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
import { z } from "zod";
import { Plus } from "lucide-react";

const addSectionSchema = z.object({
  title: z.string().min(1, "Campo obrigatório"),
});

import { type Section } from "@/modules/course/course.types";

type AddSectionValues = z.infer<typeof addSectionSchema>;

interface AddSectionVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  nextOrder: number;
  onSuccess?: (section: Section) => void;
}

export function AddSectionVault({ open, onOpenChange, courseId, nextOrder, onSuccess }: AddSectionVaultProps) {
  const tCommon = useTranslations("Common");

  const form = useForm<AddSectionValues>({
    resolver: zodResolver(addSectionSchema),
    defaultValues: {
      title: "",
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, reset } = form;

  const onSubmit: SubmitHandler<AddSectionValues> = async (data) => {
    const promise = addSectionAction({
      courseId,
      title: data.title,
      order: nextOrder,
    });

    notify.promise(promise, {
      loading: tCommon("loading"),
      success: (result) => {
        if (result?.data?.success) {
          onOpenChange(false);
          if (onSuccess && result.data.data) {
            onSuccess(result.data.data);
          }
          reset();
          return tCommon("success");
        }
        throw new Error(result?.data?.error || "error");
      },
      error: (err: unknown) => {
        return (err as Error)?.message || tCommon("error");
      },
    });
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultIcon type="info" />
        <VaultHeader>
          <VaultTitle>Nova Seção</VaultTitle>
          <VaultDescription>Adicione um novo módulo ou capítulo ao curso.</VaultDescription>
        </VaultHeader>

        <VaultForm onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}>
          <VaultBody>
            <VaultField
              label="Título da Seção"
              required
              error={errors.title?.message}
            >
              <VaultInput
                {...form.register("title")}
                placeholder="Ex: Introdução ao Verb to Be"
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
              Criar Seção
              <Plus className="w-5 h-5 ml-1" />
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultForm>
      </VaultContent>
    </Vault>
  );
}

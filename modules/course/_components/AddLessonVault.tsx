"use client";

import { useTranslations } from "next-intl";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addLessonAction } from "@/modules/course/course.actions";
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

const addLessonSchema = z.object({
  title: z.string().min(1, "Campo obrigatório"),
});

type AddLessonValues = z.infer<typeof addLessonSchema>;

import { type Lesson } from "@/modules/course/course.types";

interface AddLessonVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  sectionId: string;
  nextOrder: number;
  onSuccess?: (lesson: Lesson) => void;
}

export function AddLessonVault({ open, onOpenChange, courseId, sectionId, nextOrder, onSuccess }: AddLessonVaultProps) {
  const tCommon = useTranslations("Common");

  const form = useForm<AddLessonValues>({
    resolver: zodResolver(addLessonSchema),
    defaultValues: {
      title: "",
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, reset } = form;

  const onSubmit: SubmitHandler<AddLessonValues> = async (data) => {
    const promise = addLessonAction({
      courseId,
      sectionId,
      title: data.title,
      contentType: "video", // Default value
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
          <VaultTitle>Nova Aula</VaultTitle>
          <VaultDescription>Adicione um novo conteúdo a esta seção.</VaultDescription>
        </VaultHeader>

        <VaultForm onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}>
          <VaultBody>
            <VaultField
              label="Título da Aula"
              required
              error={errors.title?.message}
            >
              <VaultInput
                {...form.register("title")}
                placeholder="Ex: Como usar o Do e Does"
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
              Criar Aula
              <Plus className="w-5 h-5 ml-1" />
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultForm>
      </VaultContent>
    </Vault>
  );
}

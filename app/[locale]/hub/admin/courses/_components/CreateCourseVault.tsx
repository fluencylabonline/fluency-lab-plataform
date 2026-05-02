import { useTranslations } from "next-intl";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCourseAction } from "@/modules/course/course.actions";
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
import { insertCourseSchema } from "@/modules/course/course.schema";
import { type Course } from "@/modules/course/course.types";
import { z } from "zod";
import { Plus, Check, ChevronsUpDown, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button, buttonVariants } from "@/components/ui/button";
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const languages = [
  { label: "Inglês", value: "en" },
  { label: "Espanhol", value: "es" },
  { label: "Francês", value: "fr" },
  { label: "Italiano", value: "it" },
  { label: "Alemão", value: "de" },
  { label: "Japonês", value: "ja" },
  { label: "Português", value: "pt" },
];

type CreateCourseValues = z.input<typeof insertCourseSchema>;

interface CreateCourseVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (course: Course) => void;
}

export function CreateCourseVault({ open, onOpenChange, onSuccess }: CreateCourseVaultProps) {
  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");
  const [isUploading, setIsUploading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const form = useForm<CreateCourseValues>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: "",
      language: "",
      description: "",
      imageUrl: "",
      duration: "",
    },
  });

  const { formState: { errors, isSubmitting }, handleSubmit, reset, setValue, watch } = form;
  const selectedLanguage = watch("language");
  const imageUrl = watch("imageUrl");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      notify.error("Tipo de arquivo não suportado. Use JPEG, PNG ou Webp.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `courses/covers/${crypto.randomUUID()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setValue("imageUrl", url);
      notify.success("Imagem enviada com sucesso!");
    } catch {
      notify.error("Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit: SubmitHandler<CreateCourseValues> = async (data) => {
    const promise = createCourseAction(data);

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
      <VaultContent className="max-w-xl">
        <VaultIcon type="info" />
        <VaultHeader>
          <VaultTitle>{t("createCourse")}</VaultTitle>
          <VaultDescription>{t("subtitle")}</VaultDescription>
        </VaultHeader>

        <VaultForm onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}>
          <VaultBody className="space-y-4">
            <VaultField
              label={t("courseTitle")}
              required
              error={errors.title?.message}
            >
              <VaultInput
                {...form.register("title")}
                placeholder="Ex: Inglês Instrumental"
                className="h-12 rounded-2xl"
              />
            </VaultField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VaultField
                label={t("language")}
                required
                error={errors.language?.message}
              >
                <button
                  type="button"
                  onClick={() => setLangOpen(true)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-between h-12 rounded-xl px-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  )}
                >
                  {selectedLanguage
                    ? languages.find((lang) => lang.value === selectedLanguage)?.label
                    : (t('selectLanguage') || "Selecionar idioma...")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>

                <CommandDialog open={langOpen} onOpenChange={setLangOpen}>
                  <CommandInput placeholder={t('searchLanguage') || "Buscar idioma..."} />
                  <CommandList>
                    <CommandEmpty>{t('noLanguageFound') || "Nenhum idioma encontrado."}</CommandEmpty>
                    <CommandGroup>
                      {languages.map((lang) => (
                        <CommandItem
                          key={lang.value}
                          value={lang.value}
                          onSelect={(currentValue) => {
                            setValue("language", currentValue);
                            setLangOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLanguage === lang.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {lang.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </CommandDialog>
              </VaultField>

              <VaultField
                label={t('totalDuration') || "Duração Total"}
                required
                error={errors.duration?.message}
              >
                <VaultInput
                  {...form.register("duration")}
                  placeholder="Ex: 10h"
                  className="h-12 rounded-2xl"
                />
              </VaultField>
            </div>

            <VaultField
              label={t("description")}
              error={errors.description?.message}
            >
              <VaultInput
                {...form.register("description")}
                placeholder="Descreva o curso..."
                className="h-12 rounded-2xl"
              />
            </VaultField>

            <VaultField
              label={t('courseCover') || "Capa do Curso"}
              required
              error={errors.imageUrl?.message}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-24 w-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground transition-all overflow-hidden bg-gray-50 dark:bg-gray-800/50",
                  imageUrl ? "border-primary/50" : "border-gray-200 dark:border-gray-800"
                )}>
                  {imageUrl ? (
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 opacity-20" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('imageUploadInfo') || "Upload de Imagem (JPEG, PNG • Máx 5MB)"}</p>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full h-10 rounded-xl gap-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {imageUrl ? (t('changeImage') || "Alterar Imagem") : (t('selectFile') || "Selecionar Arquivo")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
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
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (tCommon('creating') || "Criando...") : t("createCourse")}
              <Plus className="w-5 h-5 ml-1" />
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultForm>
      </VaultContent>
    </Vault>
  );
}

"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Loader2, Save, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import {
  Vault,
  VaultBody,
  VaultContent,
  VaultField,
  VaultFooter,
  VaultForm,
  VaultHeader,
  VaultTitle,
} from "@/components/ui/vault";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button, buttonVariants } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { notify } from "@/components/ui/toaster";
import { insertCourseSchema } from "@/modules/course/course.schema";
import { updateCourseAction } from "@/modules/course/course.actions";
import { type Course } from "@/modules/course/course.types";
import { cn } from "@/lib/utils";
import { VaultInput } from "@/components/ui/vault";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

const languages = [
  { label: "Inglês", value: "en" },
  { label: "Espanhol", value: "es" },
  { label: "Francês", value: "fr" },
  { label: "Alemão", value: "de" },
  { label: "Italiano", value: "it" },
  { label: "Japonês", value: "ja" },
  { label: "Português", value: "pt" },
];

const updateSchema = insertCourseSchema.partial();
type UpdateValues = z.input<typeof updateSchema>;

interface EditCourseVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
}

export function EditCourseVault({ open, onOpenChange, course }: EditCourseVaultProps) {
  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");
  const [langOpen, setLangOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: course.title,
      description: course.description,
      language: course.language,
      imageUrl: course.imageUrl,
      duration: course.duration,
      isPublished: course.isPublished,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: course.title,
        description: course.description,
        language: course.language,
        imageUrl: course.imageUrl,
        duration: course.duration,
        isPublished: course.isPublished,
      });
    }
  }, [open, course, reset]);

  const { execute, status } = useAction(updateCourseAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
        notify.success(tCommon("success"));
        onOpenChange(false);
      } else {
        notify.error(result.data?.error || tCommon("error"));
      }
    },
    onError: () => notify.error(tCommon("error")),
  });

  const onSubmit = (values: UpdateValues) => {
    execute({ id: course.id, data: values });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `courses/covers/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setValue("imageUrl", url);
      notify.success(tCommon("success"));
    } catch (error) {
      console.error("Upload error:", error);
      notify.error(tCommon("error"));
    } finally {
      setUploading(false);
    }
  };

  const selectedLanguage = watch("language");
  const imageUrl = watch("imageUrl");
  const isPublished = watch("isPublished");

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-2xl">
        <VaultHeader>
          <VaultTitle>{t("editDetails")}</VaultTitle>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <VaultField label={t("courseTitle")} required error={errors.title?.message}>
                <VaultInput {...register("title")} placeholder="Ex: Inglês do Zero ao Avançado" />
              </VaultField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VaultField label={t("language")} required error={errors.language?.message}>
                  <button
                    type="button"
                    onClick={() => setLangOpen(true)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-between h-12 rounded-md px-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-normal"
                    )}
                  >
                    {selectedLanguage
                      ? languages.find((lang) => lang.value === selectedLanguage)?.label
                      : t("language") + "..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>

                  <CommandDialog open={langOpen} onOpenChange={setLangOpen}>
                    <CommandInput placeholder={tCommon("search") + "..."} />
                    <CommandList>
                      <CommandEmpty>{tCommon("noResults")}</CommandEmpty>
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

                <VaultField label={t("duration")} required error={errors.duration?.message}>
                  <VaultInput {...register("duration")} placeholder={t("durationPlaceholder")} />
                </VaultField>
              </div>

              <VaultField label={t("description")} required error={errors.description?.message}>
                <VaultInput {...register("description")} placeholder={t("descriptionPlaceholder")} />
              </VaultField>

              <VaultField label={t("coverImage")} required error={errors.imageUrl?.message}>
                <div className="flex flex-col gap-4">
                  {imageUrl && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2">
                          <Upload size={16} />
                          {t("changeImage")}
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                  )}

                  {!imageUrl && (
                    <label className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium text-muted-foreground">{t("uploadCapa")}</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </VaultField>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold">{t("courseStatus")}</h4>
                  <p className="text-xs text-muted-foreground">
                    {isPublished ? t("publishedDesc") : t("draftDesc")}
                  </p>
                </div>
                <Controller
                  name="isPublished"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isPublished"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-5 w-5"
                    />
                  )}
                />
              </div>
            </div>

            <VaultFooter className="mt-8">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" className="rounded-md px-8" disabled={status === "executing" || uploading}>
                {status === "executing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("saveChanges")}
                  </>
                )}
              </Button>
            </VaultFooter>
          </VaultForm>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

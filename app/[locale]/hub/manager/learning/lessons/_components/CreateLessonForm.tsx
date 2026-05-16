"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { createLessonAction } from "@/modules/curriculum/curriculum.actions";
import {
    VaultField,
    VaultInput,
} from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Loader2, ArrowRight } from "lucide-react";
import { CEFRLevel } from "@/modules/curriculum/curriculum.types";

// Matches modules/curriculum/curriculum.actions.ts
const createLessonSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
    languageId: z.string().uuid({ message: "Please select a language" }),
    nativeLanguageId: z.string().uuid({ message: "Please select a native language" }),
});

type CreateLessonValues = z.infer<typeof createLessonSchema>;

interface CreateLessonFormProps {
    languages: { id: string; name: string }[];
}

const DIFFICULTIES = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function CreateLessonForm({ languages }: CreateLessonFormProps) {
    const t = useTranslations("Learning");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<CreateLessonValues>({
        resolver: zodResolver(createLessonSchema),
        defaultValues: {
            title: "",
            difficulty: undefined,
            languageId: "",
            nativeLanguageId: "",
        },
    });

    const onSubmit = (values: CreateLessonValues) => {
        startTransition(async () => {
            const result = await createLessonAction(values);
            if (result?.data?.id) {
                notify.success(t("lesson_created_success") || "Lesson draft created!");
                router.push(`/hub/manager/learning/lessons/${result.data.id}`);
            } else {
                notify.error(result?.serverError || "Error creating lesson");
            }
        });
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <VaultField
                label={t("lesson_title")}
                required
                error={form.formState.errors.title?.message}
            >
                <VaultInput
                    {...form.register("title")}
                    placeholder={t("lesson_title_placeholder")}
                    autoFocus
                />
            </VaultField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VaultField
                    label={t("lesson_difficulty")}
                    required
                    error={form.formState.errors.difficulty?.message}
                >
                    <Select
                        onValueChange={(value) => form.setValue("difficulty", value as CEFRLevel)}
                        defaultValue={form.getValues("difficulty")}
                    >
                        <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl">
                            <SelectValue placeholder={t("select_difficulty") || "Select level"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                            {DIFFICULTIES.map((level) => (
                                <SelectItem key={level} value={level} className="py-2.5">
                                    {level}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </VaultField>

                <VaultField
                    label={t("lesson_language")}
                    required
                    error={form.formState.errors.languageId?.message}
                >
                    <Select
                        onValueChange={(value) => form.setValue("languageId", value)}
                        defaultValue={form.getValues("languageId")}
                    >
                        <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl">
                            <SelectValue placeholder={t("select_language") || "Select language"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                            {languages.map((lang) => (
                                <SelectItem key={lang.id} value={lang.id} className="py-2.5">
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </VaultField>

                <VaultField
                    label={t("lesson_native_language")}
                    required
                    error={form.formState.errors.nativeLanguageId?.message}
                >
                    <Select
                        onValueChange={(value) => form.setValue("nativeLanguageId", value)}
                        defaultValue={form.getValues("nativeLanguageId")}
                    >
                        <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl">
                            <SelectValue placeholder={t("select_native_language")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                            {languages.map((lang) => (
                                <SelectItem key={lang.id} value={lang.id} className="py-2.5">
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </VaultField>
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {t("creating")}
                        </>
                    ) : (
                        <>
                            {t("create_lesson_btn")}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}

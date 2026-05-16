"use client";

import * as React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Languages, Plus, Trash2, Loader2, Globe, Link2 } from "lucide-react";
import useSWR from "swr";
import { useTranslations } from "next-intl";

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
    VaultTrigger,
} from "@/components/ui/vault";
import { notify } from "@/components/ui/toaster";
import {
    createLanguageAction,
    deleteLanguageAction,
    getLanguagesAction
} from "@/modules/curriculum/curriculum.actions";
import { LanguageWithLessons } from "@/modules/curriculum/curriculum.types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const languageSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    code: z.string().min(2, "O código deve ter pelo menos 2 caracteres").max(10, "Máximo 10 caracteres"),
});

type LanguageFormValues = z.infer<typeof languageSchema>;

interface LanguagesVaultProps {
    initialData?: LanguageWithLessons[];
}

export function LanguagesVault({ initialData }: LanguagesVaultProps) {
    const t = useTranslations("Media");
    const [isOpen, setIsOpen] = React.useState(false);
    const [languageToDelete, setLanguageToDelete] = React.useState<string | null>(null);

    const { data: languages, mutate, isLoading } = useSWR(
        isOpen ? "languages_list" : null,
        async () => {
            const result = await getLanguagesAction({});
            return result.data || [];
        },
        { fallbackData: initialData }
    );

    const form = useForm<LanguageFormValues>({
        resolver: zodResolver(languageSchema),
        defaultValues: {
            name: "",
            code: "",
        },
    });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = form;

    const onSubmit: SubmitHandler<LanguageFormValues> = async (values) => {
        const result = await createLanguageAction(values);
        if (result?.data) {
            notify.success("Idioma adicionado com sucesso!");
            reset();
            mutate();
        } else {
            notify.error(result?.serverError || "Erro ao adicionar idioma");
        }
    };

    const handleDelete = async () => {
        if (!languageToDelete) return;

        const result = await deleteLanguageAction({ id: languageToDelete });
        if (result?.data?.success) {
            notify.success("Idioma excluído com sucesso!");
            mutate();
            setLanguageToDelete(null);
        } else {
            notify.error("Erro ao excluir idioma. Verifique se existem lições vinculadas.");
            setLanguageToDelete(null);
        }
    };

    return (
        <>
            <Vault open={isOpen} onOpenChange={setIsOpen}>
                <VaultTrigger asChild>
                    <button className="card flex flex-col items-center justify-center p-4 group w-full">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-3 group-hover:scale-110 transition-transform">
                            <Languages className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold">Idiomas</span>
                    </button>
                </VaultTrigger>

                <VaultContent className="max-w-md">
                    <VaultIcon>
                        <Globe className="w-5 h-5 text-primary" />
                    </VaultIcon>
                    <VaultHeader>
                        <VaultTitle>Gerenciar Idiomas</VaultTitle>
                        <VaultDescription>Adicione ou remova os idiomas suportados pela plataforma.</VaultDescription>
                    </VaultHeader>

                    <VaultForm onSubmit={(e: React.FormEvent) => {
                        e.preventDefault();
                        handleSubmit(onSubmit)(e);
                    }}>
                        <VaultBody className="gap-6">
                            <div className="grid grid-cols-2 gap-3">
                                <VaultField
                                    label="Nome (ex: Inglês)"
                                    required
                                    error={errors.name?.message}
                                >
                                    <VaultInput
                                        {...register("name")}
                                        placeholder="Ex: Inglês"
                                    />
                                </VaultField>

                                <VaultField
                                    label="Código (ex: EN)"
                                    required
                                    error={errors.code?.message}
                                >
                                    <VaultInput
                                        {...register("code")}
                                        placeholder="Ex: EN"
                                    />
                                </VaultField>
                            </div>

                            <VaultPrimaryButton
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Adicionar Idioma
                            </VaultPrimaryButton>

                            <div className="flex flex-col gap-2 mt-4 border-t pt-6">
                                <h3 className="text-sm font-bold mb-2">Idiomas Cadastrados</h3>
                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                ) : languages?.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed rounded-2xl bg-muted/20">
                                        <p className="text-sm text-muted-foreground">Nenhum idioma cadastrado.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {languages?.map((lang: LanguageWithLessons) => {
                                            const isLinkedToLesson = lang.targetLessons && lang.targetLessons.length > 0;

                                            return (
                                                <div
                                                    key={lang.id}
                                                    className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-md hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold">{lang.name}</span>
                                                                {isLinkedToLesson && (
                                                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1 rounded-md flex items-center gap-0.5 font-bold">
                                                                        <Link2 className="w-2 h-2" />
                                                                        {lang.targetLessons.length}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang.code}</span>
                                                        </div>
                                                    </div>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                type="button"
                                                                className={cn(
                                                                    "p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors",
                                                                    isLinkedToLesson && "opacity-30 grayscale cursor-default"
                                                                )}
                                                                onClick={() => {
                                                                    if (!isLinkedToLesson) setLanguageToDelete(lang.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </TooltipTrigger>
                                                            {isLinkedToLesson && (
                                                                <TooltipContent>
                                                                    <p className="text-xs">{t('cannotDeleteInUse') || "Não é possível excluir um idioma em uso"}</p>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </VaultBody>
                    </VaultForm>
                </VaultContent>
            </Vault>

            {/* Delete Confirmation Vault */}
            <Vault
                open={!!languageToDelete}
                onOpenChange={(open) => !open && setLanguageToDelete(null)}
            >
                <VaultContent>
                    <VaultIcon type="delete" />
                    <VaultHeader>
                        <VaultTitle>Excluir Idioma</VaultTitle>
                        <VaultDescription>
                            Tem certeza que deseja excluir este idioma? Esta ação não pode ser desfeita.
                        </VaultDescription>
                    </VaultHeader>
                    <VaultFooter className="mt-6 border-none pt-0">
                        <VaultSecondaryButton
                            onClick={() => setLanguageToDelete(null)}
                            className="flex-1"
                        >
                            Cancelar
                        </VaultSecondaryButton>
                        <VaultPrimaryButton
                            variant="destructive"
                            onClick={handleDelete}
                            className="flex-1"
                        >
                            Excluir
                        </VaultPrimaryButton>
                    </VaultFooter>
                </VaultContent>
            </Vault>
        </>
    );
}

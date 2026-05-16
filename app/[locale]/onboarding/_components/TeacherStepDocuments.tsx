"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { teacherOnboardingDocumentsAction } from "@/modules/onboarding/onboarding.actions";
import { teacherOnboardingDocumentsSchema, type TeacherOnboardingDocumentsValues } from "@/modules/user/user.schema";
import { isValidTaxId } from "@/modules/contract/contract.utils";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { type OnboardingData } from "./OnboardingFlow";

interface FieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
    return (
        <div className="space-y-2">
            <label className="block text-[11px] font-medium uppercase tracking-widest text-slate-500">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs text-red-400/80">{error}</p>
            )}
        </div>
    );
}

export function TeacherStepDocuments({
    onNext,
    onBack,
    initialData,
    inputClass,
}: {
    onNext: (data: OnboardingData) => void;
    onBack: () => void;
    initialData: OnboardingData;
    inputClass?: string;
}) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<TeacherOnboardingDocumentsValues>({
        resolver: zodResolver(teacherOnboardingDocumentsSchema.superRefine((data, ctx) => {
            if (!isValidTaxId(data.taxId, "BR", "individual")) {
                ctx.addIssue({
                    code: "custom",
                    message: "CPF inválido",
                    path: ["taxId"],
                });
            }
            if (!isValidTaxId(data.businessTaxId, "BR", "business")) {
                ctx.addIssue({
                    code: "custom",
                    message: "CNPJ inválido",
                    path: ["businessTaxId"],
                });
            }
        })),
        mode: "onChange",
        defaultValues: {
            taxId: initialData.taxId || "",
            businessTaxId: initialData.businessTaxId || "",
        },
    });

    const onSubmit = async (data: TeacherOnboardingDocumentsValues) => {
        setLoading(true);
        const result = await teacherOnboardingDocumentsAction(data);
        setLoading(false);

        if (result?.data?.success) {
            onNext(data);
        } else {
            notify.error(result?.data?.error || "Erro ao salvar");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            <div className="space-y-5">
                <Field
                    label={t("address.taxId") || "CPF"}
                    error={errors.taxId?.message}
                >
                    <input
                        {...register("taxId")}
                        placeholder="000.000.000-00"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label={t("teacher.businessTaxId") || "CNPJ (MEI)"}
                    error={errors.businessTaxId?.message}
                >
                    <input
                        {...register("businessTaxId")}
                        placeholder="00.000.000/0001-00"
                        className={inputClass}
                    />
                </Field>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-white/[0.08] text-sm text-slate-500 transition-all hover:border-white/[0.14] hover:text-slate-300 disabled:opacity-40"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("steps.back") || "Voltar"}
                </button>

                <button
                    type="submit"
                    disabled={loading || !isValid}
                    className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            {t("steps.next") || "Próximo"}
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

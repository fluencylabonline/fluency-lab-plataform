"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { teacherOnboardingWelcomeAction } from "@/modules/onboarding/onboarding.actions";
import { teacherOnboardingWelcomeSchema, type TeacherOnboardingWelcomeValues } from "@/modules/user/user.schema";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
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

export function TeacherStepWelcome({
    onNext,
    initialData,
    inputClass,
}: {
    onNext: (data: OnboardingData) => void;
    initialData: OnboardingData;
    inputClass?: string;
}) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<TeacherOnboardingWelcomeValues>({
        resolver: zodResolver(teacherOnboardingWelcomeSchema),
        mode: "onChange",
        defaultValues: {
            name: initialData.name || "",
            cellphone: initialData.cellphone || "",
        },
    });

    const onSubmit = async (data: TeacherOnboardingWelcomeValues) => {
        setLoading(true);
        const result = await teacherOnboardingWelcomeAction(data);
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
                    label={t("name") || "Nome completo"}
                    error={errors.name?.message}
                >
                    <input
                        {...register("name")}
                        placeholder="Ex: Matheus Fernandes"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label={t("teacher.workCellphone") || "Celular de trabalho"}
                    error={errors.cellphone?.message}
                >
                    <input
                        {...register("cellphone")}
                        placeholder="+55 (11) 99999-9999"
                        className={inputClass}
                    />
                </Field>
            </div>

            <button
                type="submit"
                disabled={loading || !isValid}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
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
        </form>
    );
}

"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { onboardingWelcomeAction } from "@/modules/onboarding/onboarding.actions";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { type OnboardingData } from "./OnboardingFlow";

const welcomeSchema = z.object({
    name: z.string().min(2, "Nome muito curto"),
    nickname: z.string().min(2, "Nome muito curto"),
    birthDate: z.string().min(1, "Data obrigatória"),
});

type WelcomeForm = z.input<typeof welcomeSchema>;

interface FieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
    inputClass?: string;
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

export function StepWelcome({
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
        control,
        formState: { errors },
    } = useForm<WelcomeForm>({
        resolver: zodResolver(welcomeSchema),
        defaultValues: {
            name: initialData.name || "",
            nickname: initialData.nickname || "",
            birthDate: initialData.birthDate
                ? new Date(initialData.birthDate).toISOString().split("T")[0]
                : "",
        },
    });

    const name = useWatch({ control, name: "name" });
    const birthDate = useWatch({ control, name: "birthDate" });
    const isComplete = name?.length >= 2 && birthDate;

    const onSubmit = async (data: WelcomeForm) => {
        setLoading(true);
        const result = await onboardingWelcomeAction(data);
        setLoading(false);

        if (result?.data?.success) {
            onNext({
                ...data,
                birthDate: new Date(data.birthDate)
            });
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
                        placeholder="Ex: Maria Gabi Silva"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label={t("welcome.nickname") || "Como prefere ser chamado"}
                    error={errors.nickname?.message}
                >
                    <input
                        {...register("nickname")}
                        placeholder="Ex: Gabi"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label={t("welcome.birthDate") || "Data de nascimento"}
                    error={errors.birthDate?.message}
                >
                    <input
                        {...register("birthDate")}
                        type="date"
                        className={inputClass}
                    />
                </Field>
            </div>

            <button
                type="submit"
                disabled={loading || !isComplete}
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
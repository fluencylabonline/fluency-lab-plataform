import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { onboardingWelcomeAction } from "@/modules/onboarding/onboarding.actions";
import { onboardingWelcomeSchema, type OnboardingWelcomeValues } from "@/modules/user/user.schema";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, ArrowRight, ExternalLink } from "lucide-react";
import { type OnboardingData } from "./OnboardingFlow";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

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
    } = useForm<OnboardingWelcomeValues>({
        resolver: zodResolver(onboardingWelcomeSchema),
        defaultValues: {
            name: initialData.name || "",
            nickname: initialData.nickname || "",
            birthDate: initialData.birthDate
                ? new Date(initialData.birthDate).toISOString().split("T")[0]
                : "",
            acceptedTerms: false,
            guardianConsent: false,
        },
    });

    const name = useWatch({ control, name: "name" });
    const birthDate = useWatch({ control, name: "birthDate" });
    const acceptedTerms = useWatch({ control, name: "acceptedTerms" });
    
    // Check if user is minor (under 18)
    const isMinor = birthDate ? (new Date().getFullYear() - new Date(birthDate).getFullYear()) < 18 : false;
    const guardianConsent = useWatch({ control, name: "guardianConsent" });

    const isComplete = name?.length >= 2 && birthDate && acceptedTerms && (!isMinor || guardianConsent);

    const onSubmit = async (data: OnboardingWelcomeValues) => {
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

    const getErrorMessage = (message?: string) => {
        if (!message) return undefined;
        const cleanKey = message.startsWith("Onboarding.") ? message.replace("Onboarding.", "") : message;
        const finalKey = cleanKey.startsWith("validation.") ? cleanKey : `validation.${cleanKey}`;
        try {
            return t(finalKey);
        } catch {
            return message;
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            <div className="space-y-5">
                <Field
                    label={t("stepWelcome.name")}
                    error={getErrorMessage(errors.name?.message)}
                >
                    <input
                        {...register("name")}
                        placeholder="Ex: Maria Gabi Silva"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label={t("stepWelcome.nickname")}
                    error={getErrorMessage(errors.nickname?.message)}
                >
                    <input
                        {...register("nickname")}
                        placeholder="Ex: Gabi"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label={t("stepWelcome.birthDate")}
                    error={getErrorMessage(errors.birthDate?.message)}
                >
                    <input
                        {...register("birthDate")}
                        type="date"
                        className={inputClass}
                    />
                </Field>

                <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                            <Controller
                                name="acceptedTerms"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="acceptedTerms"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                        <label htmlFor="acceptedTerms" className="text-sm leading-relaxed text-slate-400 cursor-pointer select-none">
                            {t.rich("stepWelcome.terms", {
                                terms: (chunks) => (
                                    <Link href="/terms" target="_blank" className="text-violet-400 hover:underline inline-flex items-center gap-1">
                                        {chunks} <ExternalLink className="h-3 w-3" />
                                    </Link>
                                ),
                                privacy: (chunks) => (
                                    <Link href="/privacy" target="_blank" className="text-violet-400 hover:underline inline-flex items-center gap-1">
                                        {chunks} <ExternalLink className="h-3 w-3" />
                                    </Link>
                                )
                            })}
                        </label>
                    </div>
                    {errors.acceptedTerms && (
                        <p className="text-xs text-red-400/80">{getErrorMessage(errors.acceptedTerms.message)}</p>
                    )}

                    {isMinor && (
                        <div className="flex flex-col gap-3 p-4 rounded-md border border-violet-500/30 bg-violet-500/5 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex items-start gap-3">
                                <div className="pt-0.5">
                                    <Controller
                                        name="guardianConsent"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="guardianConsent"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                                <label htmlFor="guardianConsent" className="text-sm leading-relaxed text-slate-300 font-medium cursor-pointer select-none">
                                    {t("stepWelcome.guardianConsent")}
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider pl-7">
                                {t("stepWelcome.guardianRequiredHint") || "Consentimento obrigatório para menores de 18 anos"}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !isComplete}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        {t("stepWelcome.next")}
                        <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </button>
        </form>
    );
}

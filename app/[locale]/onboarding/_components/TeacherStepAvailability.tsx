"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { teacherOnboardingAvailabilityAction } from "@/modules/onboarding/onboarding.actions";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { type OnboardingData } from "./OnboardingFlow";
import { z } from "zod";

const availabilitySchema = z.object({
    normalSlots: z.array(z.object({
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm"),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm"),
        startDate: z.string(),
    })).min(3, "Mínimo de 3 horários normais"),
    makeupSlots: z.array(z.object({
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm"),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm"),
        startDate: z.string(),
    })).min(3, "Mínimo de 3 horários de reposição"),
});

type AvailabilityForm = z.infer<typeof availabilitySchema>;

export function TeacherStepAvailability({
    onNext,
    onBack,
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
        control,
        formState: { errors, isValid },
    } = useForm<AvailabilityForm>({
        resolver: zodResolver(availabilitySchema),
        mode: "onChange",
        defaultValues: {
            normalSlots: [
                { startTime: "09:00", endTime: "10:00", startDate: new Date().toISOString().split("T")[0] },
                { startTime: "10:00", endTime: "11:00", startDate: new Date().toISOString().split("T")[0] },
                { startTime: "11:00", endTime: "12:00", startDate: new Date().toISOString().split("T")[0] },
            ],
            makeupSlots: [
                { startTime: "14:00", endTime: "15:00", startDate: new Date().toISOString().split("T")[0] },
                { startTime: "15:00", endTime: "16:00", startDate: new Date().toISOString().split("T")[0] },
                { startTime: "16:00", endTime: "17:00", startDate: new Date().toISOString().split("T")[0] },
            ],
        },
    });

    const { fields: normalFields, append: appendNormal, remove: removeNormal } = useFieldArray({
        control,
        name: "normalSlots",
    });

    const { fields: makeupFields, append: appendMakeup, remove: removeMakeup } = useFieldArray({
        control,
        name: "makeupSlots",
    });

    const onSubmit = async (data: AvailabilityForm) => {
        setLoading(true);
        // Transform strings to dates for the action
        const payload = {
            normalSlots: data.normalSlots.map(s => ({ ...s, startDate: new Date(s.startDate) })),
            makeupSlots: data.makeupSlots.map(s => ({ ...s, startDate: new Date(s.startDate) })),
        };
        const result = await teacherOnboardingAvailabilityAction(payload);
        setLoading(false);

        if (result?.data?.success) {
            onNext({});
        } else {
            notify.error(result?.data?.error || "Erro ao salvar horários");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-200">
                            {t("teacher.normalSlots") || "Horários Normais (Mín. 3)"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => appendNormal({ startTime: "08:00", endTime: "09:00", startDate: new Date().toISOString().split("T")[0] })}
                            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                            Adicionar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {normalFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                                <div className="grid flex-1 grid-cols-3 gap-2">
                                    <input {...register(`normalSlots.${index}.startDate`)} type="date" className={inputClass} />
                                    <input {...register(`normalSlots.${index}.startTime`)} type="time" className={inputClass} />
                                    <input {...register(`normalSlots.${index}.endTime`)} type="time" className={inputClass} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeNormal(index)}
                                    className="mt-2.5 text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {errors.normalSlots?.message && <p className="text-xs text-red-400/80">{errors.normalSlots.message}</p>}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-200">
                            {t("teacher.makeupSlots") || "Horários de Reposição (Mín. 3)"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => appendMakeup({ startTime: "08:00", endTime: "09:00", startDate: new Date().toISOString().split("T")[0] })}
                            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                            Adicionar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {makeupFields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                                <div className="grid flex-1 grid-cols-3 gap-2">
                                    <input {...register(`makeupSlots.${index}.startDate`)} type="date" className={inputClass} />
                                    <input {...register(`makeupSlots.${index}.startTime`)} type="time" className={inputClass} />
                                    <input {...register(`makeupSlots.${index}.endTime`)} type="time" className={inputClass} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMakeup(index)}
                                    className="mt-2.5 text-slate-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {errors.makeupSlots?.message && <p className="text-xs text-red-400/80">{errors.makeupSlots.message}</p>}
                    </div>
                </section>
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
                            {t("steps.next") || "Finalizar"}
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

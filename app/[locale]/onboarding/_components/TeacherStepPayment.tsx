"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { teacherOnboardingPaymentAction } from "@/modules/onboarding/onboarding.actions";
import { teacherOnboardingPaymentSchema, type TeacherOnboardingPaymentValues } from "@/modules/user/user.schema";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, Info, CreditCard } from "lucide-react";
import { type OnboardingData } from "./OnboardingFlow";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

export function TeacherStepPayment({
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
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<TeacherOnboardingPaymentValues>({
        resolver: zodResolver(teacherOnboardingPaymentSchema),
        mode: "onChange",
        defaultValues: {
            pixKey: initialData.pixKey || "",
            pixType: initialData.pixType || "cpf",
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const pixType = watch("pixType");

    const onSubmit = async (data: TeacherOnboardingPaymentValues) => {
        setLoading(true);
        const result = await teacherOnboardingPaymentAction(data);
        setLoading(false);

        if (result?.data?.success) {
            onNext(data);
        } else {
            notify.error(result?.data?.error || "Erro ao salvar");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            
            <div className="flex gap-3 rounded-md border border-blue-500/20 bg-blue-500/[0.07] px-4 py-3.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-400">
                        {t("teacher.paymentNoticeTitle") || "Pagamentos Mensais"}
                    </p>
                    <p className="text-xs text-blue-500/70 leading-relaxed">
                        {t("teacher.paymentNoticeDesc") || "O pagamento é realizado todo dia 15. Mantenha seus registros de aula atualizados para garantir o cálculo correto."}
                    </p>
                </div>
            </div>

            <div className="space-y-5">
                <Field label={t("teacher.pixType") || "Tipo de Chave PIX"} error={errors.pixType?.message}>
                    <Select
                        value={pixType}
                        onValueChange={(value) => setValue("pixType", value, { shouldValidate: true })}
                    >
                        <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="border-white/[0.08] bg-slate-950 text-slate-200">
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="phone">Telefone</SelectItem>
                            <SelectItem value="random">Chave Aleatória</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                <Field
                    label={t("teacher.pixKey") || "Chave PIX"}
                    error={errors.pixKey?.message}
                >
                    <div className="relative">
                        <input
                            {...register("pixKey")}
                            placeholder="Sua chave aqui"
                            className={inputClass}
                        />
                        <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    </div>
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

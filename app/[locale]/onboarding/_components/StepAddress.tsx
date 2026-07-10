"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { onboardingAddressAction, updateOnboardingNationalityAction } from "@/modules/onboarding/onboarding.actions";
import { notify } from "@/components/ui/toaster";
import { useRouter, usePathname } from "@/i18n/navigation";
import { getAddressByCep, isMinor as checkIsMinor, isValidTaxId, isValidCEP, isValidZipCode } from "@/modules/contract/contract.utils";
import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/modules/user/user.schema";
import { type OnboardingData } from "./OnboardingFlow";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const addressFormSchema = z.object({
    nationality: z.string().min(1),
    taxId: z.string().min(1, "Campo obrigatório"),
    cellphone: z.string().min(1, "Campo obrigatório"),
    zipCode: z.string().min(1, "Campo obrigatório"),
    street: z.string().min(1, "Campo obrigatório"),
    number: z.string().min(1, "Campo obrigatório"),
    neighborhood: z.string().min(1, "Campo obrigatório"),
    city: z.string().min(1, "Campo obrigatório"),
    state: z.string().min(1, "Campo obrigatório"),
    guardianName: z.string().optional(),
    guardianTaxId: z.string().optional(),
    guardianRelationship: z.string().optional(),
    guardianCellphone: z.string().optional(),
}).superRefine((data, ctx) => {
    // 1. Validação de Tax ID (CPF ou SSN/Foreign)
    const isBR = data.nationality === "brazilian";
    if (!isValidTaxId(data.taxId, isBR ? "BR" : "US", "individual")) {
        ctx.addIssue({
            code: "custom",
            message: isBR ? "CPF inválido" : "Tax ID inválido",
            path: ["taxId"],
        });
    }

    // 2. Validação de CEP ou ZIP Code
    const isZipValid = isBR ? isValidCEP(data.zipCode) : isValidZipCode(data.zipCode);
    if (!isZipValid) {
        ctx.addIssue({
            code: "custom",
            message: isBR ? "CEP inválido" : "ZIP Code inválido",
            path: ["zipCode"],
        });
    }
});

type AddressForm = z.input<typeof addressFormSchema>;

interface FieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}

function Field({ label, error, children, className }: FieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-slate-500">
                {label}
            </label>
            {children}
            {error && <p className="text-xs text-red-400/80">{error}</p>}
        </div>
    );
}

export function StepAddress({
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
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [isFetchingZip, setIsFetchingZip] = useState(false);

    const minor = checkIsMinor(initialData.birthDate);

    const initial = initialData;
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AddressForm>({
        resolver: zodResolver(addressFormSchema),
        defaultValues: {
            nationality: initial.nationality || "brazilian",
            taxId: initial.taxId || "",
            cellphone: initial.cellphone || "",
            zipCode: initial.zipCode || "",
            street: initial.street || "",
            number: initial.number || "",
            neighborhood: initial.neighborhood || "",
            city: initial.city || "",
            state: initial.state || "",
            guardianName: initial.guardianData?.name || initial.guardianName || "",
            guardianTaxId: initial.guardianData?.taxId || initial.guardianTaxId || "",
            guardianRelationship: initial.guardianData?.relationship || initial.guardianRelationship || "",
            guardianCellphone: initial.guardianData?.cellphone || initial.guardianCellphone || "",
        },
    });

    const nationality = watch("nationality");

    const onSubmit = async (data: AddressForm) => {
        setLoading(true);

        const payload = {
            nationality: data.nationality,
            taxId: data.taxId,
            cellphone: data.cellphone,
            address: {
                zipCode: data.zipCode,
                street: data.street,
                number: data.number,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state,
            },
            guardianData: minor
                ? {
                    name: data.guardianName!,
                    taxId: data.guardianTaxId!,
                    relationship: data.guardianRelationship!,
                    cellphone: data.guardianCellphone!,
                }
                : undefined,
        };

        const result = await onboardingAddressAction(payload);
        setLoading(false);

        if (result?.data?.success) {
            onNext(payload as unknown as Partial<User>);
        } else {
            notify.error(result?.data?.error || "Error");
        }
    };

    const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length === 8 && nationality === "brazilian") {
            setIsFetchingZip(true);
            try {
                const data = await getAddressByCep(value);
                if (data) {
                    setValue("street", data.street, { shouldValidate: true });
                    setValue("neighborhood", data.neighborhood, { shouldValidate: true });
                    setValue("city", data.city, { shouldValidate: true });
                    setValue("state", data.state, { shouldValidate: true });
                }
            } catch {
                console.error("CEP lookup failed");
            } finally {
                setIsFetchingZip(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">

            {/* Minor warning */}
            {minor && (
                <div className="flex gap-3 rounded-md border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3.5">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium text-amber-400">
                            {t("guardian.title")}
                        </p>
                        <p className="text-xs text-amber-500/70">
                            {t("welcome.minorWarning")}
                        </p>
                    </div>
                </div>
            )}

            {/* Nationality + Tax ID */}
            <div className="grid grid-cols-2 gap-3">
                <Field label={t("address.nationality")} error={errors.nationality?.message}>
                    <Select
                        value={nationality}
                        onValueChange={async (value) => {
                            setValue("nationality", value);
                            try {
                                await updateOnboardingNationalityAction({ nationality: value });
                                router.replace(pathname, { locale: value === "foreign" ? "en" : "pt" });
                            } catch (error) {
                                console.error("Failed to update nationality:", error);
                            }
                        }}
                    >
                        <SelectTrigger className={cn(inputClass, "cursor-pointer")}>
                            <SelectValue placeholder={t("address.nationality")} />
                        </SelectTrigger>
                        <SelectContent className="border-white/[0.08] bg-slate-950 text-slate-200">
                            <SelectItem value="brazilian">
                                {t("address.nationalities.brazilian")}
                            </SelectItem>
                            <SelectItem value="foreign">
                                {t("address.nationalities.foreign")}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                <Field
                    label={nationality === "brazilian" ? t("address.taxId") : t("address.taxIdForeign")}
                    error={errors.taxId?.message}
                >
                    <input
                        {...register("taxId")}
                        className={inputClass}
                        placeholder={nationality === "brazilian" ? "000.000.000-00" : ""}
                        inputMode="numeric"
                    />
                </Field>
            </div>

            {/* Cellphone + ZIP */}
            <div className="grid grid-cols-2 gap-3">
                <Field label={t("address.cellphone")} error={errors.cellphone?.message}>
                    <input
                        {...register("cellphone")}
                        placeholder="+55 (11) 99999-9999"
                        className={inputClass}
                        inputMode="tel"
                    />
                </Field>

                <Field
                    label={nationality === "brazilian" ? t("address.zipCode") : t("address.zipCodeForeign")}
                    error={errors.zipCode?.message}
                >
                    <input
                        {...register("zipCode")}
                        onBlur={handleZipCodeBlur}
                        placeholder="00000-000"
                        className={inputClass}
                        inputMode="numeric"
                    />
                </Field>
            </div>

            {/* Street + Number */}
            <div className="grid grid-cols-3 gap-3">
                <Field
                    label={t("address.street")}
                    error={errors.street?.message}
                    className="col-span-2"
                >
                    <input {...register("street")} className={inputClass} />
                </Field>

                <Field label={t("address.number")} error={errors.number?.message}>
                    <input {...register("number")} className={inputClass} inputMode="numeric" />
                </Field>
            </div>

            {/* Neighborhood + City + State */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label={t("address.neighborhood")} error={errors.neighborhood?.message}>
                    <input {...register("neighborhood")} className={inputClass} disabled={isFetchingZip} />
                </Field>

                <Field label={t("address.city")} error={errors.city?.message}>
                    <div className="relative">
                        <input {...register("city")} className={inputClass} disabled={isFetchingZip} />
                        {isFetchingZip && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                            </div>
                        )}
                    </div>
                </Field>

                <Field label={t("address.state")} error={errors.state?.message}>
                    <div className="relative">
                        <input
                            {...register("state")}
                            maxLength={2}
                            className={cn(inputClass, "uppercase")}
                            disabled={isFetchingZip}
                        />
                        {isFetchingZip && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                            </div>
                        )}
                    </div>
                </Field>
            </div>

            {/* Guardian section (minors only) */}
            {minor && (
                <div className="space-y-5 border-t border-white/[0.06] pt-6">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                        {t("guardian.title")}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t("guardian.name")} error={errors.guardianName?.message}>
                            <input {...register("guardianName")} className={inputClass} />
                        </Field>

                        <Field label={t("guardian.taxId")} error={errors.guardianTaxId?.message}>
                            <input {...register("guardianTaxId")} className={inputClass} inputMode="numeric" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label={t("guardian.relationship")}
                            error={errors.guardianRelationship?.message}
                        >
                            <input
                                {...register("guardianRelationship")}
                                placeholder={t("guardian.relationshipPlaceholder")}
                                className={inputClass}
                            />
                        </Field>

                        <Field
                            label={t("guardian.cellphone") || "Celular do Responsável"}
                            error={errors.guardianCellphone?.message}
                        >
                            <input
                                {...register("guardianCellphone")}
                                placeholder="+55 (11) 99999-9999"
                                className={inputClass}
                                inputMode="tel"
                            />
                        </Field>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-1">
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
                    disabled={loading}
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
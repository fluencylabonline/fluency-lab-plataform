"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { onboardingAddressAction } from "@/modules/onboarding/onboarding.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const addressFormSchema = z.object({
    nationality: z.string().min(1),
    taxId: z.string().min(1),
    cellphone: z.string().min(1),
    zipCode: z.string().min(1),
    street: z.string().min(1),
    number: z.string().min(1),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    guardianName: z.string().optional(),
    guardianTaxId: z.string().optional(),
    guardianRelationship: z.string().optional(),
});

type AddressForm = z.input<typeof addressFormSchema>;

export function StepAddress({ onNext, onBack, initialData }: { onNext: (data: any) => void; onBack: () => void; initialData: any }) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);

    const isMinor = () => {
        if (!initialData.birthDate) return false;
        const today = new Date();
        const birth = new Date(initialData.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age < 18;
    };

    const minor = isMinor();

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AddressForm>({
        resolver: zodResolver(addressFormSchema),
        defaultValues: {
            nationality: initialData.nationality || "brazilian",
            taxId: initialData.taxId || "",
            cellphone: initialData.cellphone || "",
            zipCode: initialData.zipCode || "",
            street: initialData.street || "",
            number: initialData.number || "",
            neighborhood: initialData.neighborhood || "",
            city: initialData.city || "",
            state: initialData.state || "",
            guardianName: initialData.guardianData?.name || "",
            guardianTaxId: initialData.guardianData?.taxId || "",
            guardianRelationship: initialData.guardianData?.relationship || "",
        }
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
            guardianData: minor ? {
                name: data.guardianName!,
                taxId: data.guardianTaxId!,
                relationship: data.guardianRelationship!,
            } : undefined
        };

        const result = await onboardingAddressAction(payload);
        setLoading(false);

        if (result?.data?.success) {
            onNext(payload);
        } else {
            notify.error(result?.data?.error || "Error");
        }
    };

    // CEP lookup helper (simple)
    // TODO: passar para contract.utils.ts e melhorar UI enquanto carrega
    const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length === 8 && nationality === "brazilian") {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setValue("street", data.logradouro);
                    setValue("neighborhood", data.bairro);
                    setValue("city", data.localidade);
                    setValue("state", data.uf);
                }
            } catch {
                console.error("CEP lookup failed");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t("address.title")}</h2>
                <p className="text-muted-foreground">{t("address.subtitle")}</p>
            </div>

            {minor && (
                <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-300">{t("guardian.title")}</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-400/80">
                        {t("welcome.minorWarning")}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>{t("address.nationality")}</Label>
                    <Select onValueChange={(v) => setValue("nationality", v)} defaultValue={nationality}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("address.nationalityPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="brazilian">{t("address.nationalities.brazilian")}</SelectItem>
                            <SelectItem value="foreign">{t("address.nationalities.foreign")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="taxId">{nationality === "brazilian" ? t("address.taxId") : t("address.taxIdForeign")}</Label>
                    <Input id="taxId" {...register("taxId")} />
                    {errors.taxId && <p className="text-sm text-destructive">{errors.taxId.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cellphone">{t("address.cellphone")}</Label>
                    <Input id="cellphone" {...register("cellphone")} placeholder="+55 (11) 99999-9999" />
                    {errors.cellphone && <p className="text-sm text-destructive">{errors.cellphone.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="zipCode">{nationality === "brazilian" ? t("address.zipCode") : t("address.zipCodeForeign")}</Label>
                    <Input id="zipCode" {...register("zipCode")} onBlur={handleZipCodeBlur} />
                    {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">{t("address.street")}</Label>
                    <Input id="street" {...register("street")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="number">{t("address.number")}</Label>
                    <Input id="number" {...register("number")} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="neighborhood">{t("address.neighborhood")}</Label>
                    <Input id="neighborhood" {...register("neighborhood")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city">{t("address.city")}</Label>
                    <Input id="city" {...register("city")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">{t("address.state")}</Label>
                    <Input id="state" {...register("state")} />
                </div>
            </div>

            {minor && (
                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-semibold">{t("guardian.title")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="guardianName">{t("guardian.name")}</Label>
                            <Input id="guardianName" {...register("guardianName")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guardianTaxId">{t("guardian.taxId")}</Label>
                            <Input id="guardianTaxId" {...register("guardianTaxId")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guardianRelationship">{t("guardian.relationship")}</Label>
                            <Input id="guardianRelationship" {...register("guardianRelationship")} placeholder={t("guardian.relationshipPlaceholder")} />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={loading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("steps.back") || "Voltar"}
                </Button>
                <Button type="submit" className="flex-[2]" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("steps.next") || "Próximo"}
                </Button>
            </div>
        </form>
    );
}

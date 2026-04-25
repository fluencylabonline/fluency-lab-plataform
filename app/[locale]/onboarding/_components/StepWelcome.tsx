"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { onboardingWelcomeAction } from "@/modules/onboarding/onboarding.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toaster";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const welcomeSchema = z.object({
    name: z.string().min(2, "Name too short"),
    nickname: z.string().min(2, "Name too short"),
    birthDate: z.string().min(1, "Birth date required"),
});

type WelcomeForm = z.input<typeof welcomeSchema>;

export function StepWelcome({ onNext, initialData }: { onNext: (data: any) => void; initialData: any }) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<WelcomeForm>({
        resolver: zodResolver(welcomeSchema),
        defaultValues: {
            name: initialData.name || "",
            nickname: initialData.nickname || "",
            birthDate: initialData.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : "",
        }
    });

    const onSubmit = async (data: WelcomeForm) => {
        setLoading(true);
        const result = await onboardingWelcomeAction(data);
        setLoading(false);

        if (result?.data?.success) {
            onNext(data);
        } else {
            notify.error(result?.data?.error || "Error");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t("welcome.title")}</h2>
                <p className="text-muted-foreground">{t("welcome.subtitle")}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t("name") || "Nome Completo"}</Label>
                    <Input id="name" {...register("name")} placeholder="Ex: Maria Gabi Silva" />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nickname">{t("welcome.nickname")}</Label>
                    <Input id="nickname" {...register("nickname")} placeholder="Ex: Gabi" />
                    {errors.nickname && <p className="text-sm text-destructive">{errors.nickname.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="birthDate">{t("welcome.birthDate")}</Label>
                    <Input id="birthDate" type="date" {...register("birthDate")} />
                    {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("steps.next") || "Próximo"}
            </Button>
        </form>
    );
}

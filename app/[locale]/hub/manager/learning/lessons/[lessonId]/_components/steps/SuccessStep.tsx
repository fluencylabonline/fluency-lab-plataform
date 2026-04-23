"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function SuccessStep() {
    const t = useTranslations("Learning");
    const router = useRouter();

    return (
        <div className="stepper-content flex flex-col items-center justify-center h-min mt-12 text-center">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">{t("congratulations")}</h2>
            <p className="text-muted-foreground mb-10 max-w-sm mx-auto text-lg leading-relaxed">
                {t("lesson_published_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                    onClick={() => router.push("/hub/manager/learning/lessons")}
                >
                    <Home className="w-5 h-5 mr-3" />
                    {t("back_to_dashboard")}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => router.push("/hub/manager/learning/lessons/new")}
                >
                    <Plus className="w-5 h-5 mr-3" />
                    {t("create_another")}
                </Button>
            </div>
        </div>
    );
}

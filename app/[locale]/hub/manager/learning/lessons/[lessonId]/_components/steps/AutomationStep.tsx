"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Zap,
    Image as ImageIcon
} from "lucide-react";
import {
    enrichLinkedItemsAction,
    generateQuizAction
} from "@/modules/curriculum/curriculum.actions";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";

interface AutomationStepProps {
    lessonId: string;
    step: 8 | 9;
    onComplete: () => void;
    hasData?: boolean;
}

export function AutomationStep({ lessonId, step, onComplete, hasData }: AutomationStepProps) {
    const t = useTranslations("Learning");
    const [status, setStatus] = useState<"idle" | "working" | "completed" | "error">("idle");

    const run = async () => {
        if (step === 9 && hasData) {
            onComplete();
            return;
        }

        try {
            setStatus("working");

            if (step === 9) {
                const res = await generateQuizAction({ lessonId });
                if (res?.validationErrors) throw new Error("Validation error");
            } else {
                // Step 8: Call enrichment for all linked items
                const res = await enrichLinkedItemsAction({ lessonId });
                if (res?.validationErrors) throw new Error("Validation error");
            }

            setStatus("completed");
            setTimeout(onComplete, 1500);

        } catch (error) {
            console.error(error);
            setStatus("error");
            notify.error(t("automation_error") || "Error in automated step");
        }
    };

    return (
        <div className="step-content">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {step === 8 ? <ImageIcon className="w-10 h-10 text-primary" /> : <Sparkles className="w-10 h-10 text-primary" />}
            </div>

            <h2 className="text-2xl font-bold mb-3">
                {step === 8 ? t("enrichment_title") : t("quiz_gen_title")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                {step === 8
                    ? t("enrichment_desc")
                    : t("quiz_gen_desc")}
            </p>

            <div className="flex flex-col items-center gap-4">
                {status === "idle" && (
                    <Button onClick={run}>
                        <Zap className="w-5 h-5 mr-3" />
                        {step === 8
                            ? t("start_enrichment")
                            : (hasData ? (t("continue_to_review") || "Continue to review") : t("start_quiz_gen"))}
                    </Button>
                )}

                {status === "working" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-medium animate-pulse text-primary">{t("ai_is_working")}</p>
                    </div>
                )}

                {status === "completed" && (
                    <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        <p className="font-bold text-emerald-500">{t("done")}</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="w-12 h-12 text-destructive" />
                        <Button onClick={run} variant="outline" className="rounded-xl">
                            {t("retry")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

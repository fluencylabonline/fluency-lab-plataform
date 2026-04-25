"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Stepper } from "@/components/ui/stepper";
import type { User } from "@/modules/user/user.schema";
import { StepWelcome } from "./StepWelcome";
import { StepAddress } from "./StepAddress";
import { StepPayment } from "./StepPayment";
import { StepContract } from "./StepContract";
import { StepBestPractices } from "./StepBestPractices";

interface OnboardingWizardProps {
    user: User;
}

export function OnboardingWizard({ user }: OnboardingWizardProps) {
    const t = useTranslations("Onboarding");
    // Start from the user's saved step, defaulting to 1 (welcome)
    const [currentStep, setCurrentStep] = useState(user.onboardingStep || 1);
    const [onboardingData, setOnboardingData] = useState<Partial<User>>(user);

    const steps = [
        { id: 1, title: t("steps.welcome") },
        { id: 2, title: t("steps.documents") },
        { id: 3, title: t("steps.payment") },
        { id: 4, title: t("steps.contract") },
        { id: 5, title: t("steps.finish") || "Finalizar" },
    ];

    const nextStep = (data?: Partial<User>) => {
        if (data) {
            setOnboardingData((prev) => ({ ...prev, ...data }));
        }
        setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-10 shadow-xl border border-border/50 overflow-hidden relative">
            <div className="mb-8">
                <Stepper steps={steps} currentStep={currentStep} />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {currentStep === 1 && (
                        <StepWelcome
                            onNext={nextStep}
                            initialData={onboardingData}
                        />
                    )}
                    {currentStep === 2 && (
                        <StepAddress
                            onNext={nextStep}
                            onBack={prevStep}
                            initialData={onboardingData}
                        />
                    )}
                    {currentStep === 3 && (
                        <StepPayment
                            onNext={nextStep}
                            onBack={prevStep}
                            user={onboardingData as User}
                        />
                    )}
                    {currentStep === 4 && (
                        <StepContract
                            onNext={nextStep}
                            onBack={prevStep}
                            user={onboardingData as User}
                        />
                    )}
                    {currentStep === 5 && (
                        <StepBestPractices />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

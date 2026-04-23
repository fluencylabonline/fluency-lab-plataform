"use client";

import { useTranslations } from "next-intl";
import { Stepper, Step } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

interface StepperWrapperProps {
    currentStep: number;
    onStepClick?: (stepId: number) => void;
    className?: string;
}

export function StepperWrapper({ currentStep, onStepClick, className }: StepperWrapperProps) {
    const t = useTranslations("Learning");

    const steps: Step[] = Array.from({ length: 11 }).map((_, i) => {
        const num = i + 1;
        return {
            id: num,
            title: t(`steps.${num}.title`),
            subtitle: t(`steps.${num}.desc`)
        };
    });

    return (
        <>
            {/* Desktop Sidebar Stepper */}
            <div className={cn("hidden md:block h-full px-8 py-6 w-48 border-r border-gray-100 dark:border-gray-800", className)}>
                <Stepper
                    steps={steps}
                    currentStep={currentStep}
                    orientation="vertical"
                    variant="sidebar"
                    onStepClick={onStepClick}
                />
            </div>

            {/* Mobile Horizontal Stepper */}
            <div className="md:hidden w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-[60px] z-40 py-4 px-4">
                <Stepper
                    steps={steps}
                    currentStep={currentStep}
                    orientation="horizontal"
                    onStepClick={onStepClick}
                />
            </div>
        </>
    );
}

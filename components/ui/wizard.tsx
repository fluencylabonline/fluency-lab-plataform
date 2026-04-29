"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Vault,
    VaultContent,
    VaultBody,
    VaultFooter,
    VaultPrimaryButton,
    VaultSecondaryButton,
    VaultTitle,
    VaultDescription,
} from "@/components/ui/vault";

export interface WizardStep {
    id: string;
    title: string;
    description?: string;
    icon?: React.ElementType;
    content: React.ReactNode;
    headerBg?: string;
    iconColor?: string;
}

interface WizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    steps: WizardStep[];
    onComplete?: () => void;
}

const contentVariants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 20 : -20,
        opacity: 0,
        filter: "blur(4px)",
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 20 : -20,
        opacity: 0,
        filter: "blur(4px)",
        position: "absolute",
    }),
};

export function Wizard({
    open,
    onOpenChange,
    steps,
    onComplete,
}: WizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setCurrentStep(0);
                setDirection(0);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        } else {
            onComplete?.();
            onOpenChange(false);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    const stepData = steps[currentStep];
    const Icon = stepData.icon;

    return (
        <Vault open={open} onOpenChange={onOpenChange}>
            <VaultContent showHandle={false} noPadding={true} className="overflow-hidden sm:max-w-[700px]">
                <div
                    className={cn(
                        "h-32 w-full flex items-center justify-center relative transition-colors duration-500 ease-in-out rounded-t-[20px] sm:rounded-t-2xl",
                        stepData.headerBg || "bg-gray-100 dark:bg-gray-800",
                    )}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={cn(
                                "p-4 rounded-full bg-white dark:bg-background z-10",
                                stepData.iconColor || "text-gray-900",
                            )}
                        >
                            {Icon ? (
                                <Icon className="w-8 h-8" />
                            ) : (
                                <div className="w-8 h-8" />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <VaultBody className="px-6 pt-6 pb-2 mb-4 relative min-h-[280px]">
                    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            className="space-y-4 w-full"
                        >
                            <div className="text-center space-y-2 mb-6">
                                <VaultTitle>{stepData.title}</VaultTitle>
                                {stepData.description && (
                                    <VaultDescription className="mx-auto max-w-sm">
                                        {stepData.description}
                                    </VaultDescription>
                                )}
                            </div>

                            <div className="w-full">{stepData.content}</div>
                        </motion.div>
                    </AnimatePresence>
                </VaultBody>

                <VaultFooter className="px-12 pb-6 pt-4 border-t-1 border-background z-10 relative flex flex-col items-center gap-4">
                    <div className="flex w-full gap-1.5 justify-center">
                        {steps.map((_, idx) => (
                            <motion.div
                                key={idx}
                                className={cn(
                                    "h-1.5 rounded-full transition-colors duration-300",
                                    idx === currentStep
                                        ? "bg-primary"
                                        : "bg-gray-200 dark:bg-gray-700",
                                )}
                                initial={false}
                                animate={{
                                    width: idx === currentStep ? 24 : 6,
                                    backgroundColor: idx <= currentStep ? "var(--primary)" : "",
                                }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <VaultSecondaryButton
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="rounded-full w-12 h-12 p-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </VaultSecondaryButton>

                        <VaultPrimaryButton onClick={handleNext} className="rounded-full w-12 h-12 p-0">
                            {currentStep === steps.length - 1 ? (
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5" />
                                </div>
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                        </VaultPrimaryButton>
                    </div>
                </VaultFooter>
            </VaultContent>
        </Vault>
    );
}
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/modules/user/user.schema";
import Logo from "@/public/brand/logo.png";
import Image from "next/image";
import { StepWelcome } from "./StepWelcome";
import { StepAddress } from "./StepAddress";
import { StepPayment } from "./StepPayment";
import { StepContract } from "./StepContract";
import { StepBestPractices } from "./StepBestPractices";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export interface OnboardingData extends Partial<User> {
    zipCode?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    guardianData?: {
        name?: string;
        taxId?: string;
        relationship?: string;
    };
}

interface OnboardingFlowProps {
    user: User;
}

const inputClass = cn(
    "w-full rounded-xl border border-black/[0.1] dark:border-white/[0.07] bg-black/[0.07] dark:bg-white/[0.03] px-4 py-3",
    "text-sm text-slate-700 dark:text-white placeholder:text-foreground",
    "outline-none transition-all duration-200",
    "focus:border-violet-500/50 focus:bg-violet-500/[0.04] focus:ring-0",
    "hover:border-white/[0.12]",
    "[color-scheme:dark]"
);

export function OnboardingFlow({ user }: OnboardingFlowProps) {
    const t = useTranslations("Onboarding");
    const [currentStep, setCurrentStep] = useState(1);
    const [onboardingData, setOnboardingData] = useState<OnboardingData>(user);

    const steps = [
        { id: 1, title: t("steps.welcome") },
        { id: 2, title: t("steps.documents") },
        { id: 3, title: t("steps.payment") },
        { id: 4, title: t("steps.contract") },
        { id: 5, title: t("steps.finish") || "Finalizar" },
    ];

    const progress = (currentStep / steps.length) * 100;

    const nextStep = (data?: OnboardingData) => {
        if (data) {
            setOnboardingData((prev) => ({ ...prev, ...data }));
        }
        setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="relative min-h-screen w-full bg-slate-700/20 dark:bg-background flex flex-col overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 40, -20, 0],
                        y: [0, -30, 40, 0],
                        scale: [1, 1.15, 0.9, 1],
                        backgroundColor: [
                            "rgba(139, 92, 246, 0.2)", // Violet
                            "rgba(59, 130, 246, 0.2)",  // Blue
                            "rgba(168, 85, 247, 0.15)", // Purple
                            "rgba(139, 92, 246, 0.2)"  // Violet
                        ]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        x: [0, -50, 30, 0],
                        y: [0, 40, -50, 0],
                        scale: [1, 1.1, 0.85, 1],
                        backgroundColor: [
                            "rgba(37, 99, 235, 0.15)", // Blue
                            "rgba(16, 185, 129, 0.1)",  // Emerald
                            "rgba(79, 70, 229, 0.12)", // Indigo
                            "rgba(37, 99, 235, 0.15)"  // Blue
                        ]
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[100px]"
                />
            </div>

            {/* Top Navigation / Progress */}
            <header className="relative z-20 w-full px-6 py-6 sm:py-8 md:px-12 flex items-center justify-between ">
                <div className="flex items-center gap-3">
                    <Image
                        src={Logo}
                        alt="Logo"
                        width={180}
                        className="object-contain"
                    />
                </div>

                <div className="hidden md:flex flex-col items-end gap-2">
                    <span className="hidden text-slate-400 text-sm font-medium">
                        {t("steps.progress") || "Progresso"}: {Math.round(progress)}%
                    </span>
                    <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                <div className="md:hidden text-slate-400 text-sm font-bold">
                    {currentStep} / {steps.length}
                </div>
                <div>
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-8 pb-24">
                <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-24 items-center">

                    {/* Left Side: Contextual Content */}
                    <div className="lg:col-span-6 space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`context-${currentStep}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-6"
                            >
                                <div className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                                    {steps[currentStep - 1].title}
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary dark:text-white leading-tight">
                                    {currentStep === 1 && t("welcome.title")}
                                    {currentStep === 2 && t("address.title")}
                                    {currentStep === 3 && t("payment.title")}
                                    {currentStep === 4 && t("contract.title")}
                                    {currentStep === 5 && t("finish.title")}
                                </h1>

                                <p className="text-forebackground dark:text-white text-lg md:text-xl max-w-lg leading-relaxed">
                                    {currentStep === 1 && t("welcome.description")}
                                    {currentStep === 2 && t("address.description")}
                                    {currentStep === 3 && t("payment.description")}
                                    {currentStep === 4 && t("contract.description")}
                                    {currentStep === 5 && t("finish.description")}
                                </p>

                                <div className="hidden lg:flex flex-wrap gap-4 pt-4">
                                    {steps.map((step) => (
                                        <div
                                            key={step.id}
                                            className={cn(
                                                "w-3 h-3 rounded-full border-2 transition-all duration-500",
                                                currentStep === step.id ? "bg-primary border-primary scale-125" :
                                                    currentStep > step.id ? "bg-primary/40 border-primary/40" : "bg-transparent border-white/50 dark:border-white/[0.07]"
                                            )}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right Side: Interactive Form */}
                    <div className="lg:col-span-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`form-${currentStep}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="w-full"
                            >
                                <div className="p-0 md:p-12 transition-all duration-500 overflow-hidden">
                                    {/*bg-white/40 dark:bg-slate-900/30 rounded-md border border-slate-200 dark:border-slate-800/80*/}
                                    {currentStep === 1 && (
                                        <StepWelcome
                                            onNext={nextStep}
                                            initialData={onboardingData}
                                            inputClass={inputClass}
                                        />
                                    )}
                                    {currentStep === 2 && (
                                        <StepAddress
                                            onNext={nextStep}
                                            onBack={prevStep}
                                            initialData={onboardingData}
                                            inputClass={inputClass}
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
                                </div>

                                <div className="mt-8 flex justify-center">
                                    <p className="text-slate-500 text-sm">
                                        {t("support.help") || "Precisa de ajuda?"} <button className="text-primary font-bold hover:underline">{t("support.contact") || "Fale conosco"}</button>
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </main>

            {/* Bottom Progress (Mobile) */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-30">
                <Progress value={progress} className="h-1 rounded-none bg-slate-900" />
            </div>
        </div>
    );
}

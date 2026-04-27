"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/modules/user/user.schema";
import Logo from "@/public/brand/logo.png";
import Image from "next/image";
import { TeacherStepWelcome } from "./TeacherStepWelcome";
import { TeacherStepDocuments } from "./TeacherStepDocuments";
import { TeacherStepPayment } from "./TeacherStepPayment";
import { StepContract } from "./StepContract";
import { TeacherStepAvailability } from "./TeacherStepAvailability";
import { TeacherStepBestPractices } from "./TeacherStepBestPractices";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { OnboardingData } from "./OnboardingFlow";

interface TeacherOnboardingFlowProps {
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

export function TeacherOnboardingFlow({ user }: TeacherOnboardingFlowProps) {
    const t = useTranslations("Onboarding");
    const [currentStep, setCurrentStep] = useState(user.onboardingStep || 1);
    const [onboardingData, setOnboardingData] = useState<OnboardingData>(user);

    const steps = [
        { id: 1, title: t("steps.welcome") || "Boas-vindas" },
        { id: 2, title: t("steps.documents") || "Documentos" },
        { id: 3, title: t("steps.payment") || "Pagamento" },
        { id: 4, title: t("steps.contract") || "Contrato" },
        { id: 5, title: t("teacher.steps.availability") || "Disponibilidade" },
        { id: 6, title: t("steps.finish") || "Finalizar" },
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
                            "rgba(139, 92, 246, 0.2)",
                            "rgba(59, 130, 246, 0.2)",
                            "rgba(168, 85, 247, 0.15)",
                            "rgba(139, 92, 246, 0.2)"
                        ]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px]"
                />
            </div>

            {/* Top Navigation */}
            <header className="relative z-20 w-full px-6 py-6 sm:py-8 md:px-12 flex items-center justify-between ">
                <Image src={Logo} alt="Logo" width={180} style={{ height: "auto" }} className="object-contain" />
                <div className="hidden md:flex flex-col items-end gap-2">
                    <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                    </div>
                </div>
                <div className="md:hidden text-slate-400 text-sm font-bold">{currentStep} / {steps.length}</div>
                <div className="flex gap-2">
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Main Content */}
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
                                className="space-y-6"
                            >
                                <div className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                                    {steps[currentStep - 1].title}
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary dark:text-white leading-tight">
                                    {currentStep === 1 && (t("teacher.welcomeTitle") || "Olá, Professor(a)!")}
                                    {currentStep === 2 && (t("teacher.docsTitle") || "Documentação")}
                                    {currentStep === 3 && (t("teacher.paymentTitle") || "Dados de Pagamento")}
                                    {currentStep === 4 && (t("teacher.contractTitle") || "Seu Contrato")}
                                    {currentStep === 5 && (t("teacher.availabilityTitle") || "Seus Horários")}
                                    {currentStep === 6 && (t("teacher.finishTitle") || "Tudo pronto!")}
                                </h1>
                                <p className="text-forebackground dark:text-white text-lg md:text-xl max-w-lg leading-relaxed">
                                    {currentStep === 1 && (t("teacher.welcomeDesc") || "Estamos felizes em ter você conosco. Vamos começar sua configuração.")}
                                    {currentStep === 2 && (t("teacher.docsDesc") || "Precisamos de alguns documentos para formalizar nossa parceria.")}
                                    {currentStep === 3 && (t("teacher.paymentDesc") || "Informe como prefere receber seus pagamentos mensais.")}
                                    {currentStep === 4 && (t("teacher.contractDesc") || "Leia e assine o contrato de prestação de serviços.")}
                                    {currentStep === 5 && (t("teacher.availabilityDesc") || "Defina seus horários iniciais para começarmos os agendamentos.")}
                                    {currentStep === 6 && (t("teacher.finishDesc") || "Seu onboarding foi concluído com sucesso.")}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right Side: Forms */}
                    <div className="lg:col-span-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`form-${currentStep}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full"
                            >
                                <div className="p-0 md:p-12">
                                    {currentStep === 1 && <TeacherStepWelcome onNext={nextStep} initialData={onboardingData} inputClass={inputClass} />}
                                    {currentStep === 2 && <TeacherStepDocuments onNext={nextStep} onBack={prevStep} initialData={onboardingData} inputClass={inputClass} />}
                                    {currentStep === 3 && <TeacherStepPayment onNext={nextStep} onBack={prevStep} initialData={onboardingData} inputClass={inputClass} />}
                                    {currentStep === 4 && <StepContract onNext={nextStep} onBack={prevStep} user={onboardingData as User} />}
                                    {currentStep === 5 && <TeacherStepAvailability onNext={nextStep} onBack={prevStep} initialData={onboardingData} inputClass={inputClass} />}
                                    {currentStep === 6 && <TeacherStepBestPractices />}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Mobile Progress */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-30">
                <Progress value={progress} className="h-1 rounded-none bg-slate-900" />
            </div>
        </div>
    );
}

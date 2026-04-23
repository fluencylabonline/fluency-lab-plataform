"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2, Video, Sparkles,
    Settings, Type, Search, FileText, CheckSquare, ListChecks,
    Puzzle, Edit3, Rocket
} from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface IntroStepProps {
    onComplete: () => void;
}

export function IntroStep({ onComplete }: IntroStepProps) {
    const t = useTranslations("Learning");

    const allSteps = [
        { icon: Settings, title: t("creation_workflow.step_1.title"), desc: t("creation_workflow.step_1.desc") },
        { icon: Video, title: t("creation_workflow.step_2.title"), desc: t("creation_workflow.step_2.desc") },
        { icon: Type, title: t("creation_workflow.step_3.title"), desc: t("creation_workflow.step_3.desc") },
        { icon: Search, title: t("creation_workflow.step_4.title"), desc: t("creation_workflow.step_4.desc") },
        { icon: FileText, title: t("creation_workflow.step_5.title"), desc: t("creation_workflow.step_5.desc") },
        { icon: CheckSquare, title: t("creation_workflow.step_6.title"), desc: t("creation_workflow.step_6.desc") },
        { icon: ListChecks, title: t("creation_workflow.step_7.title"), desc: t("creation_workflow.step_7.desc") },
        { icon: Sparkles, title: t("creation_workflow.step_8.title"), desc: t("creation_workflow.step_8.desc") },
        { icon: Puzzle, title: t("creation_workflow.step_9.title"), desc: t("creation_workflow.step_9.desc") },
        { icon: Edit3, title: t("creation_workflow.step_10.title"), desc: t("creation_workflow.step_10.desc") },
        { icon: Rocket, title: t("creation_workflow.step_11.title"), desc: t("creation_workflow.step_11.desc") },
    ];

    return (
        <div className="step-content">
            <div className="mb-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("draft_ready")}</h2>
                <p className="text-muted-foreground md:text-lg max-w-lg mx-auto">
                    {t("draft_ready_desc")}
                </p>
            </div>

            <div className="mb-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
                    {t("creation_workflow.title")}
                </h3>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-3 gap-4">
                    {allSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:border-primary/20 transition-all duration-300">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <step.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-xs mb-1">{step.title}</h4>
                                <p className="text-[10px] text-muted-foreground leading-tight">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile Carousel */}
                <div className="md:hidden px-4">
                    <Carousel className="w-full max-w-xs mx-auto">
                        <CarouselContent>
                            {allSteps.map((step, idx) => (
                                <CarouselItem key={idx}>
                                    <div className="p-1">
                                        <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm">
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                                <step.icon className="w-8 h-8 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="-left-4" />
                        <CarouselNext className="-right-4" />
                    </Carousel>
                </div>
            </div>

            <Button onClick={onComplete} size="lg">
                {t("go_to_media")}
            </Button>
        </div>
    );
}

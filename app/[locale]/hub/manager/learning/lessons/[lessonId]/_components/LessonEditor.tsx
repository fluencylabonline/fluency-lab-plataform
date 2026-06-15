"use client";

import { StepperWrapper } from "./StepperWrapper";
import { useTranslations } from "next-intl";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "@/i18n/navigation";
import { IntroStep } from "./steps/IntroStep";
import { MediaStep } from "./steps/MediaStep";
import { TranscriptionReviewStep } from "./steps/TranscriptionReviewStep";
import { AnalysisStep } from "./steps/AnalysisStep";
import { QualityAnalysisStep } from "./steps/QualityAnalysisStep";
import { LessonContentStep } from "./steps/LessonContentStep";
import { QuizGenerationStep } from "./steps/QuizGenerationStep";
import { EnrichmentReviewStep } from "./steps/EnrichmentReviewStep";
import { QuizReviewStep, FinalizationStep } from "./steps/FinalSteps";
import { SuccessStep } from "./steps/SuccessStep";
import { useState } from "react";
import { updateLessonAction } from "@/modules/curriculum/curriculum.actions";
import { LessonWithDetails } from "@/modules/curriculum/curriculum.types";

interface LessonEditorProps {
    lesson: LessonWithDetails;
}

export function LessonEditor({ lesson }: LessonEditorProps) {
    const t = useTranslations("Learning");
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(lesson.creationStep);

    const handleStepClick = (stepId: number) => {
        if (stepId <= lesson.creationStep) {
            setActiveStep(stepId);
        } else {
            notify.error(t("complete_previous_steps") || "Complete previous steps first");
        }
    };

    const handleNext = async () => {
        const nextStep = activeStep + 1;
        if (lesson.status === "ready") {
            setActiveStep(nextStep);
            return;
        }

        setActiveStep(nextStep);
        await updateLessonAction({
            id: lesson.id,
            creationStep: nextStep
        });

        router.refresh();
    };

    return (
        <div className="flex flex-col md:flex-row h-dvh">
            <StepperWrapper
                currentStep={activeStep}
                onStepClick={handleStepClick}
            />

            <div className="flex-1 px-2 py-3">
                <StepRenderer
                    activeStep={activeStep}
                    lesson={lesson}
                    onComplete={handleNext}
                />
            </div>
        </div>
    );
}

function StepRenderer({ activeStep, lesson, onComplete }: { activeStep: number; lesson: LessonWithDetails; onComplete: () => void }) {
    const t = useTranslations("Learning");
    switch (activeStep) {
        case 1:
            return <IntroStep onComplete={onComplete} />;
        case 2:
            return <MediaStep lessonId={lesson.id} existingMediaUrl={lesson.media?.url} existingTranscription={lesson.media?.transcriptionText} onComplete={onComplete} />;
        case 3:
            return lesson.media ? (
                <TranscriptionReviewStep
                    lessonId={lesson.id}
                    media={lesson.media}
                    onComplete={onComplete}
                    status={lesson.status}
                />
            ) : null;
        case 4:
            return (
                <AnalysisStep
                    lessonId={lesson.id}
                    step={4}
                    onComplete={onComplete}
                    initialData={lesson.analysisResultJson ?? undefined}
                    creationStep={lesson.creationStep}
                    status={lesson.status}
                    transcriptionText={lesson.media?.transcriptionText}
                    contentText={lesson.contentText}
                />
            );
        case 5:
            return (
                <LessonContentStep
                    lessonId={lesson.id}
                    initialContentJson={lesson.contentJson}
                    onComplete={onComplete}
                    status={lesson.status}
                />
            );
        case 6:
            return <QualityAnalysisStep lessonId={lesson.id} onComplete={onComplete} initialData={lesson.qualityAnalysisJson} />;
        case 7:
            return (
                <AnalysisStep
                    lessonId={lesson.id}
                    step={7}
                    onComplete={onComplete}
                    initialData={lesson.analysisResultJson ?? undefined}
                    creationStep={lesson.creationStep}
                    status={lesson.status}
                    transcriptionText={lesson.media?.transcriptionText}
                    contentText={lesson.contentText}
                />
            );
        case 8:
            return (
                <EnrichmentReviewStep
                    lessonId={lesson.id}
                    onComplete={onComplete}
                    initialItems={lesson.items}
                    status={lesson.status}
                    analysisResult={lesson.analysisResultJson}
                />
            );
        case 9:
            return <QuizGenerationStep lessonId={lesson.id} onComplete={onComplete} hasData={!!lesson.quizData} />;
        case 10:
            return (
                <QuizReviewStep
                    lessonId={lesson.id}
                    initialData={lesson.quizData || { quiz_sections: [] }}
                    onComplete={onComplete}
                    mediaUrl={lesson.media?.url}
                    status={lesson.status}
                />
            );
        case 11:
            return <FinalizationStep lessonId={lesson.id} onComplete={onComplete} isReady={lesson.status === "ready"} />;
        case 12:
            return <SuccessStep />;
        default:
            return <div className="text-center py-20 font-mono text-muted-foreground opacity-50 uppercase tracking-[0.2em]">{t("unknown_state") || "Unknown State"}</div>;
    }
}

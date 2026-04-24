"use client";

import { useState } from "react";
import { 
    Vault, 
    VaultHeader, 
    VaultBody, 
    VaultFooter, 
    VaultContent, 
    VaultTitle, 
    VaultDescription, 
    VaultForm, 
    VaultField, 
    VaultInput,
    VaultPrimaryButton,
    VaultSecondaryButton,
    VaultIcon
} from "@/components/ui/vault";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { updatePlacementQuestionAction } from "@/modules/placement/placement.actions";
import { notify } from "@/components/ui/toaster";
import { Play, Pause, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Question } from "@/modules/placement/placement.schema";

interface QuestionEditVaultProps {
    question: Question & { mediaUrl?: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function QuestionEditVault({ question, open, onOpenChange, onSuccess }: QuestionEditVaultProps) {
    const t = useTranslations("Placement");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        content: question?.content || "",
        context: question?.context || "",
        cefrLevel: question?.cefrLevel || "A1",
        skill: question?.skill || "grammar",
    });

    const [playing, setPlaying] = useState(false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    const toggleAudio = () => {
        if (!question?.mediaUrl) return;

        if (playing) {
            audio?.pause();
            setPlaying(false);
        } else {
            const range = question.metadata?.audioRange;
            const newAudio = audio || new Audio(question.mediaUrl);
            
            if (!audio) {
                setAudio(newAudio);
            }

            if (range) {
                newAudio.currentTime = range.start;
                newAudio.ontimeupdate = () => {
                    if (newAudio.currentTime >= range.end) {
                        newAudio.pause();
                        setPlaying(false);
                    }
                };
            }

            newAudio.play();
            setPlaying(true);
            newAudio.addEventListener('ended', () => setPlaying(false));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await updatePlacementQuestionAction({
                id: question.id,
                data: formData
            });

            if (result?.data?.success) {
                notify.success(t("save_success_single") || "Question updated successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                notify.error(result?.serverError || "Error updating question");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Vault open={open} onOpenChange={onOpenChange}>
            <VaultContent>
                <VaultHeader>
                    <VaultIcon type="edit" />
                    <VaultTitle>{t("edit_question") || "Edit Question"}</VaultTitle>
                    <VaultDescription>{t("edit_question_desc") || "Update the question details."}</VaultDescription>
                </VaultHeader>

                <VaultForm onSubmit={handleSave}>
                    <VaultBody className="space-y-4">
                        {question?.mediaUrl && (
                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                                <div className="bg-blue-500 p-2 rounded-xl text-white">
                                    <FileAudio className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{t("audio_content") || "Audio Content"}</p>
                                    <p className="text-xs text-blue-700/70 dark:text-blue-300/70">{t("listening_question_preview") || "Listen to the snippet for this question"}</p>
                                </div>
                                <Button 
                                    type="button" 
                                    onClick={toggleAudio} 
                                    size="sm" 
                                    className="rounded-xl px-4 gap-2"
                                >
                                    {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                    {playing ? t("pause") || "Pause" : t("play") || "Play"}
                                </Button>
                            </div>
                        )}

                        <VaultField label={t("content") || "Content"}>
                            <Textarea 
                                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl min-h-[100px]"
                                value={formData.content} 
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder={t("content_placeholder") || "Enter question text..."}
                            />
                        </VaultField>

                        <VaultField label={t("context") || "Context"}>
                            <VaultInput 
                                value={formData.context} 
                                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                                placeholder={t("context_placeholder") || "Enter context (optional)..."}
                            />
                        </VaultField>

                        <div className="grid grid-cols-2 gap-4">
                            <VaultField label={t("level") || "Level"}>
                                <Select 
                                    value={formData.cefrLevel} 
                                    onValueChange={(val) => setFormData({ ...formData, cefrLevel: val })}
                                >
                                    <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                                            <SelectItem key={level} value={level}>{level}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </VaultField>

                            <VaultField label={t("skill") || "Skill"}>
                                <Select 
                                    value={formData.skill} 
                                    onValueChange={(val) => setFormData({ ...formData, skill: val as "grammar" | "vocabulary" | "reading" | "listening" })}
                                >
                                    <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["grammar", "vocabulary", "reading", "listening"].map((skill) => (
                                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </VaultField>
                        </div>
                    </VaultBody>

                    <VaultFooter>
                        <VaultSecondaryButton type="button" onClick={() => onOpenChange(false)} disabled={loading}>
                            {t("cancel") || "Cancel"}
                        </VaultSecondaryButton>
                        <VaultPrimaryButton type="submit" disabled={loading}>
                            {loading ? t("saving") || "Saving..." : t("save") || "Save"}
                        </VaultPrimaryButton>
                    </VaultFooter>
                </VaultForm>
            </VaultContent>
        </Vault>
    );
}


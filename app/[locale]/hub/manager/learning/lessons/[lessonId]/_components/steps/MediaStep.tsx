"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Upload,
    FileAudio,
    FileVideo,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sparkles
} from "lucide-react";
import {
    getSignedMediaUploadUrlAction,
    attachMediaAction
} from "@/modules/curriculum/curriculum.actions";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { notify } from "@/components/ui/toaster";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MediaStepProps {
    lessonId: string;
    existingMediaUrl?: string | null;
    existingTranscription?: string | null;
    onComplete: () => void;
}

export function MediaStep({ lessonId, existingMediaUrl, existingTranscription, onComplete }: MediaStepProps) {
    const t = useTranslations("Learning");
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "uploading" | "transcribing" | "completed" | "error">(
        existingTranscription ? "completed" : "idle"
    );
    const [transcription, setTranscription] = useState(existingTranscription || "");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const transcriptionEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom as transcription streams in
    useEffect(() => {
        transcriptionEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcription]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                notify.error(t("file_too_large"));
                return;
            }
            setFile(selectedFile);
            setStatus("idle");
        }
    };

    /** Retry transcription only (file is already uploaded) */
    const retryTranscription = async (mediaUrl: string) => {
        try {
            setStatus("transcribing");
            setProgress(100);

            const attachRes = await attachMediaAction({
                lessonId,
                mediaUrl,
            });

            if (!attachRes?.data) throw new Error("Failed to attach media");

            startTranscriptionStream();
        } catch (error) {
            console.error(error);
            setStatus("error");
            notify.error(t("processing_error") || "Error processing media");
        } finally {
            // No-op
        }
    };

    /** Full flow: upload + transcribe */
    const startProcessing = async () => {
        if (!file) return;

        try {
            setStatus("uploading");
            setProgress(10);

            // 1. Get signed URL
            const signedRes = await getSignedMediaUploadUrlAction({
                fileName: file.name,
                contentType: file.type
            });

            if (!signedRes?.data) throw new Error("Failed to get upload URL");
            const { url, path } = signedRes.data;

            // 2. Upload to Storage
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", url);
            xhr.setRequestHeader("Content-Type", file.type);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    setProgress(percent);
                }
            };

            const uploadPromise = new Promise((resolve, reject) => {
                xhr.onload = () => xhr.status === 200 ? resolve(true) : reject();
                xhr.onerror = reject;
                xhr.send(file);
            });

            await uploadPromise;
            setProgress(100);

            // 3. Get a proper authenticated download URL via Firebase SDK
            setStatus("transcribing");
            const fileRef = ref(storage, path);
            const publicUrl = await getDownloadURL(fileRef);

            const attachRes = await attachMediaAction({
                lessonId,
                mediaUrl: publicUrl
            });

            if (!attachRes?.data) throw new Error("Failed to attach media");

            // 4. Start SSE for real-time transcription
            startTranscriptionStream();

        } catch (error) {
            console.error(error);
            setStatus("error");
            notify.error(t("processing_error") || "Error processing media");
        } finally {
            // No-op
        }
    };

    const startTranscriptionStream = () => {
        const eventSource = new EventSource(`/api/curriculum/stream?lessonId=${lessonId}&step=2`);

        eventSource.addEventListener("chunk", (e) => {
            const data = JSON.parse(e.data);
            setTranscription(prev => prev + data);
        });

        eventSource.addEventListener("status", (e) => {
            const data = JSON.parse(e.data);
            if (data === "completed") {
                setStatus("completed");
                eventSource.close();
            }
        });

        eventSource.addEventListener("error", (e) => {
            console.error("SSE error", e);
            setStatus("error");
            eventSource.close();
        });
    };

    return (
        <div className="step-content">
            <div className="text-center mb-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{t("upload_media_title")}</h2>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    {t("upload_media_desc")}
                </p>
            </div>

            {status === "idle" && existingMediaUrl ? (
                <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <p className="font-bold text-amber-700 dark:text-amber-400 mb-1">
                            {t("media_already_uploaded")}
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-500 mb-4">
                            {t("transcription_failed_retry")}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button onClick={() => retryTranscription(existingMediaUrl)}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                {t("retry_transcription")}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {t("upload_new_file")}
                            </Button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="video/*,audio/*"
                            onChange={(e) => {
                                handleFileChange(e);
                            }}
                        />
                    </div>
                </div>
            ) : status === "idle" ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "group border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300",
                        file && "border-primary/30 bg-primary/5"
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="video/*,audio/*"
                        onChange={handleFileChange}
                    />
                    {file ? (
                        <div className="flex flex-col items-center">
                            {file.type.startsWith("video") ? (
                                <FileVideo className="w-12 h-12 text-primary mb-4" />
                            ) : (
                                <FileAudio className="w-12 h-12 text-primary mb-4" />
                            )}
                            <p className="font-bold text-lg">{file.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <Button className="mt-6" onClick={(e) => {
                                e.stopPropagation();
                                startProcessing();
                            }}>
                                {t("start_processing")}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Upload className="w-12 h-12 text-gray-300 mb-4 group-hover:text-primary transition-colors" />
                            <p className="font-semibold text-gray-600 dark:text-gray-400">
                                {t("click_to_upload")}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">{t("media_formats_hint")}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {status === "uploading" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                                {status === "transcribing" && <Sparkles className="w-5 h-5 animate-pulse text-primary" />}
                                {status === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                {status === "error" && <AlertCircle className="w-5 h-5 text-destructive" />}
                                <span className="font-bold">
                                    {status === "uploading" && t("uploading_file")}
                                    {status === "transcribing" && t("ai_transcribing")}
                                    {status === "completed" && t("ready_to_review")}
                                    {status === "error" && t("processing_failed")}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-primary">
                                {status === "uploading" ? `${progress}%` : ""}
                            </span>
                        </div>

                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full bg-primary transition-all duration-500",
                                    status === "transcribing" && "animate-shimmer bg-gradient-to-r from-primary via-primary/60 to-primary bg-[length:200%_100%]"
                                )}
                                style={{ width: `${status === "uploading" ? progress : 100}%` }}
                            />
                        </div>

                        {status === "error" && (
                            <div className="flex items-center justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStatus("idle");
                                        setProgress(0);
                                        setTranscription("");
                                        setFile(null);
                                    }}
                                >
                                    {t("retry")}
                                </Button>
                            </div>
                        )}

                        {status === "completed" && (
                            <div className="flex items-center justify-center pt-4 animate-in fade-in zoom-in duration-300">
                                <Button onClick={onComplete}>
                                    {t("continue")}
                                    <CheckCircle2 className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {(transcription || status === "transcribing") && (
                        <div className="animate-in fade-in duration-700">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {t("real_time_preview")}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 min-h-[200px] h-[300px] overflow-y-auto no-scrollbar relative">
                                <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium space-y-4">
                                    {transcription
                                        .split(/(?<=[.?!])\s+/)
                                        .filter(s => s.trim().length > 0)
                                        .map((sentence, i, arr) => (
                                            <p key={i} className="flex gap-2">
                                                <span className="text-primary/40 font-bold select-none mt-0.5 shrink-0">❝</span>
                                                <span className="italic">
                                                    {sentence.trim()}
                                                    {i === arr.length - 1 && status === "transcribing" && (
                                                        <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
                                                    )}
                                                </span>
                                            </p>
                                        ))
                                    }
                                    {status === "transcribing" && transcription.length === 0 && (
                                        <span className="inline-block w-1.5 h-4 bg-primary animate-pulse align-middle" />
                                    )}
                                    <div ref={transcriptionEndRef} />
                                </div>
                                {status === "transcribing" && !transcription && (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                                        {t("waiting_for_ai")}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

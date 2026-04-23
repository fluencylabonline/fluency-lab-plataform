"use client";

import * as React from "react";
import { FileAudio, Upload, Trash2, Loader2, Play, Pause, FileText, CheckCircle2, Clock, Link2 } from "lucide-react";
import useSWR from "swr";

import {
    Vault,
    VaultBody,
    VaultContent,
    VaultFooter,
    VaultHeader,
    VaultTitle,
    VaultTrigger,
    VaultDescription,
    VaultIcon,
    VaultSecondaryButton,
    VaultPrimaryButton,
} from "@/components/ui/vault";
import { Button, buttonVariants } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import {
    getMediaListAction,
    deleteMediaAction,
    getSignedMediaUploadUrlAction,
    createMediaAction,
    transcribeMediaAction
} from "@/modules/curriculum/curriculum.actions";
import { MediaWithLessons } from "@/modules/curriculum/curriculum.types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function MediaLibraryVault() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [mediaToDelete, setMediaToDelete] = React.useState<string | null>(null);
    const [playingMediaId, setPlayingMediaId] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const { data: mediaItems, mutate, isLoading } = useSWR(
        isOpen ? "media_library_list" : null,
        async () => {
            const result = await getMediaListAction({});
            return result.data || [];
        }
    );

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const signedResult = await getSignedMediaUploadUrlAction({
                fileName: file.name,
                contentType: file.type,
            });

            if (!signedResult?.data?.url) throw new Error("Erro ao gerar URL de upload");

            const { url, path } = signedResult.data;

            const uploadResponse = await fetch(url, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            if (!uploadResponse.ok) throw new Error("Erro no upload do arquivo");

            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

            await createMediaAction({ url: publicUrl });
            notify.success("Mídia enviada com sucesso!");
            mutate();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erro no upload";
            notify.error(message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async () => {
        if (!mediaToDelete) return;
        const result = await deleteMediaAction({ id: mediaToDelete });
        if (result?.data?.success) {
            notify.success("Mídia excluída!");
            mutate();
            setMediaToDelete(null);
        } else {
            notify.error(result?.serverError || "Erro ao excluir mídia");
            setMediaToDelete(null);
        }
    };

    const handleTranscribe = async (id: string) => {
        notify.info("Iniciando transcrição...");
        const result = await transcribeMediaAction({ mediaId: id });
        if (result?.data) {
            notify.success("Transcrição concluída!");
            mutate();
        } else {
            notify.error("Erro ao transcrever mídia");
        }
    };

    const handleTogglePlay = (id: string, url: string) => {
        if (playingMediaId === id) {
            audioRef.current?.pause();
            setPlayingMediaId(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
        setPlayingMediaId(id);

        audio.onended = () => {
            setPlayingMediaId(null);
        };
    };

    // Stop audio when closing vault
    React.useEffect(() => {
        if (!isOpen && audioRef.current) {
            audioRef.current.pause();
            setPlayingMediaId(null);
        }
    }, [isOpen]);

    return (
        <>
            <Vault open={isOpen} onOpenChange={setIsOpen}>
                <VaultTrigger asChild>
                    <button className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md hover:border-primary/50 transition-all group w-full">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                            <FileAudio className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold">Biblioteca</span>
                    </button>
                </VaultTrigger>
                <VaultContent className="max-w-2xl">
                    <VaultIcon>
                        <FileAudio className="w-5 h-5 text-primary" />
                    </VaultIcon>
                    <VaultHeader>
                        <VaultTitle>Biblioteca de Mídia</VaultTitle>
                        <VaultDescription>Gerencie seus arquivos de áudio e gere transcrições automáticas.</VaultDescription>
                    </VaultHeader>

                    <VaultBody className="py-6">
                        {/* Upload Section */}
                        <div
                            className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleUpload}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-sm font-medium">Enviando arquivo...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        <Upload className="w-6 h-6 text-primary" />
                                    </div>
                                    <span className="text-sm font-bold">Clique para enviar áudio</span>
                                    <span className="text-xs text-muted-foreground">MP3, WAV, M4A</span>
                                </div>
                            )}
                        </div>

                        {/* Media List */}
                        <div className="flex flex-col gap-3 mt-4">
                            <h3 className="text-sm font-bold mb-2">Arquivos na Biblioteca</h3>
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : mediaItems?.length === 0 ? (
                                <div className="text-center py-12 border rounded-3xl bg-muted/10 border-dashed">
                                    <p className="text-sm text-muted-foreground">Sua biblioteca está vazia.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {mediaItems?.map((item: MediaWithLessons) => {
                                        const isLinkedToLesson = item.lessons && item.lessons.length > 0;

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl hover:border-primary/30 transition-all"
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl shrink-0">
                                                        <FileAudio className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-sm font-bold truncate pr-4">
                                                            {(item.url.split('/').pop()?.split('?')[0] || "Áudio Sem Nome").slice(0, 10)}
                                                        </span>
                                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(item.createdAt).toLocaleDateString()}
                                                            </span>
                                                            {item.transcriptionText ? (
                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Transcrito
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                                                                    <Clock className="w-3 h-3" />
                                                                    Pendente
                                                                </span>
                                                            )}
                                                            {isLinkedToLesson && (
                                                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold border border-blue-200 dark:border-blue-800">
                                                                    <Link2 className="w-2.5 h-2.5" />
                                                                    {item.lessons.length} {item.lessons.length === 1 ? 'Lição' : 'Lições'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "rounded-full transition-all",
                                                            playingMediaId === item.id
                                                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                                : "hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                        )}
                                                        onClick={() => handleTogglePlay(item.id, item.url)}
                                                    >
                                                        {playingMediaId === item.id ? (
                                                            <Pause className="w-4 h-4" />
                                                        ) : (
                                                            <Play className="w-4 h-4" />
                                                        )}
                                                    </Button>

                                                    {!item.transcriptionText && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                                            onClick={() => handleTranscribe(item.id)}
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </Button>
                                                    )}

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                type="button"
                                                                className={cn(
                                                                    buttonVariants({ variant: "ghost", size: "icon" }),
                                                                    "rounded-full text-destructive hover:bg-destructive/10",
                                                                    isLinkedToLesson && "opacity-30 grayscale cursor-default"
                                                                )}
                                                                onClick={() => {
                                                                    if (!isLinkedToLesson) setMediaToDelete(item.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </TooltipTrigger>
                                                            {isLinkedToLesson && (
                                                                <TooltipContent>
                                                                    <p className="text-xs">Não é possível excluir mídia vinculada a uma lição</p>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </VaultBody>
                </VaultContent>
            </Vault>

            {/* Delete Confirmation Vault */}
            <Vault
                open={!!mediaToDelete}
                onOpenChange={(open) => !open && setMediaToDelete(null)}
            >
                <VaultContent className="max-w-sm">
                    <VaultIcon type="delete" />
                    <VaultHeader>
                        <VaultTitle>Excluir Mídia</VaultTitle>
                        <VaultDescription>
                            Tem certeza que deseja excluir este arquivo? A transcrição e todos os dados associados serão removidos permanentemente.
                        </VaultDescription>
                    </VaultHeader>
                    <VaultFooter className="mt-6 border-none pt-0">
                        <VaultSecondaryButton
                            onClick={() => setMediaToDelete(null)}
                            className="flex-1"
                        >
                            Cancelar
                        </VaultSecondaryButton>
                        <VaultPrimaryButton
                            variant="destructive"
                            onClick={handleDelete}
                            className="flex-1"
                        >
                            Excluir
                        </VaultPrimaryButton>
                    </VaultFooter>
                </VaultContent>
            </Vault>
        </>
    );
}

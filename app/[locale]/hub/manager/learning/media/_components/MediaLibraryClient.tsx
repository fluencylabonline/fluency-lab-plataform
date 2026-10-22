"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FileAudio, Upload, Trash2, Loader2, Play, Pause, FileText, CheckCircle2, Clock, Link2, Search } from "lucide-react";

import {
    Vault,
    VaultContent,
    VaultFooter,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultIcon,
    VaultSecondaryButton,
    VaultPrimaryButton,
} from "@/components/ui/vault";
import { notify } from "@/components/ui/toaster";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFillGrid } from "@/hooks/common/use-fill-grid";
import { cn } from "@/lib/utils";
import {
    getMediaListAction,
    deleteMediaAction,
    getSignedMediaUploadUrlAction,
    createMediaAction,
    transcribeMediaAction,
} from "@/modules/curriculum/curriculum.actions";
import { MediaWithLessons } from "@/modules/curriculum/curriculum.types";

/** Colunas por largura da janela; as linhas vêm da altura disponível. */
const GRID_BREAKPOINTS = [[1280, 3], [1024, 3], [640, 2]] as const;

/** Nome de reserva para mídias sem título: último trecho do caminho no Storage, já decodificado. */
function mediaFallbackName(url: string) {
    const raw = url.split("?")[0].split("/").pop() ?? "";
    let decoded = raw;
    try {
        decoded = decodeURIComponent(raw);
    } catch {
        // mantém o texto cru
    }
    return decoded.split("/").pop() || "Áudio sem nome";
}

/** Título da mídia: o próprio título, o da lição a que pertence, ou o nome do arquivo. */
const mediaName = (item: MediaWithLessons) => item.title || item.lessons?.[0]?.title || mediaFallbackName(item.url);

export function MediaLibraryClient() {
    const [isUploading, setIsUploading] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
    const [playingMediaId, setPlayingMediaId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { ref: gridAreaRef, style: gridStyle, pageSize } = useFillGrid({ breakpoints: GRID_BREAKPOINTS, minCardHeight: 130 });

    const { data: mediaItems, mutate, isLoading } = useSWR("media_library_list", async () => {
        const result = await getMediaListAction({});
        return (result.data || []) as MediaWithLessons[];
    });

    const term = search.trim().toLowerCase();
    const filtered = (mediaItems ?? []).filter((item) => !term || mediaName(item).toLowerCase().includes(term));

    // A página volta para a 1 quando muda a busca ou o tamanho da página.
    const filterKey = [search, pageSize].join("|");
    const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
    const page = pageState.key === filterKey ? pageState.page : 1;
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const signedResult = await getSignedMediaUploadUrlAction({ fileName: file.name, contentType: file.type });
            if (!signedResult?.data?.url) throw new Error("Erro ao gerar URL de upload");

            const { url, path } = signedResult.data;
            const uploadResponse = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
            if (!uploadResponse.ok) throw new Error("Erro no upload do arquivo");

            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

            // Título inicial = nome do arquivo sem extensão.
            await createMediaAction({ url: publicUrl, title: file.name.replace(/\.[^.]+$/, "") });
            notify.success("Mídia enviada com sucesso!");
            mutate();
        } catch (error: unknown) {
            notify.error(error instanceof Error ? error.message : "Erro no upload");
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
        } else {
            notify.error(result?.serverError || "Erro ao excluir mídia");
        }
        setMediaToDelete(null);
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
        audioRef.current?.pause();

        const audio = new Audio(url);
        audioRef.current = audio;
        void audio.play();
        setPlayingMediaId(id);
        audio.onended = () => setPlayingMediaId(null);
    };

    // Para o áudio ao sair da página
    useEffect(() => () => audioRef.current?.pause(), []);

    const actionButton = "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors";

    return (
        // No desktop a página não rola: a grade ocupa o espaço que sobra e a paginação navega pelo resto.
        <div className="flex flex-col gap-4 lg:h-[calc(100dvh-9rem)]">
            {/* Envio e busca na cor do tema */}
            <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-md bg-primary p-3 text-primary-foreground shadow-sm">
                <input type="file" accept="audio/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-foreground px-4 text-sm font-semibold text-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isUploading ? "Enviando..." : "Enviar áudio"}
                </button>
                <span className="hidden text-xs text-primary-foreground/70 sm:inline">MP3, WAV, M4A</span>

                <div className="relative min-w-[220px] flex-1 sm:max-w-md sm:ml-auto">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/70" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por título ou lição..."
                        className="h-10 w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/15 pl-9 pr-3 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/70 focus:border-primary-foreground/60 focus:bg-primary-foreground/20"
                    />
                </div>
                <span className="text-xs font-semibold text-primary-foreground/80">{filtered.length} arquivos</span>
            </div>

            <div ref={gridAreaRef} className={cn("min-h-0 flex-1 lg:overflow-hidden", isLoading && "opacity-60 transition-opacity")}>
                {filtered.length === 0 && !isLoading ? (
                    <div className="flex h-full items-center justify-center rounded-md border border-dashed bg-muted/10 py-16">
                        <p className="text-sm text-muted-foreground">{term ? "Nenhum arquivo encontrado." : "Sua biblioteca está vazia."}</p>
                    </div>
                ) : (
                    <div className="grid lg:h-full" style={gridStyle}>
                        {pageItems.map((item) => {
                            const isLinkedToLesson = item.lessons && item.lessons.length > 0;
                            return (
                                <div
                                    key={item.id}
                                    className="flex h-full min-h-0 flex-col justify-between gap-3 overflow-hidden rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 rounded-md bg-purple-50 p-2 dark:bg-purple-900/20">
                                            <FileAudio className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-bold leading-snug">{mediaName(item)}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                {item.transcriptionText ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Transcrito
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                                        <Clock className="h-3 w-3" />
                                                        Pendente
                                                    </span>
                                                )}
                                                {isLinkedToLesson && (
                                                    <span className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                                        <Link2 className="h-2.5 w-2.5" />
                                                        {item.lessons.length} {item.lessons.length === 1 ? "Lição" : "Lições"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            aria-label={playingMediaId === item.id ? "Pausar" : "Tocar"}
                                            className={cn(
                                                actionButton,
                                                playingMediaId === item.id
                                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                    : "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                            )}
                                            onClick={() => handleTogglePlay(item.id, item.url)}
                                        >
                                            {playingMediaId === item.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        </button>

                                        {!item.transcriptionText && (
                                            <button
                                                type="button"
                                                aria-label="Transcrever"
                                                className={cn(actionButton, "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20")}
                                                onClick={() => handleTranscribe(item.id)}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        )}

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger
                                                    type="button"
                                                    className={cn(
                                                        actionButton,
                                                        "text-destructive hover:bg-destructive/10",
                                                        isLinkedToLesson && "cursor-default opacity-30 grayscale"
                                                    )}
                                                    onClick={() => {
                                                        if (!isLinkedToLesson) setMediaToDelete(item.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            <PaginationBar
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={(next) => setPageState({ key: filterKey, page: next })}
                className="shrink-0"
            />

            <Vault open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
                <VaultContent className="max-w-sm">
                    <VaultIcon type="delete" />
                    <VaultHeader>
                        <VaultTitle>Excluir Mídia</VaultTitle>
                        <VaultDescription>
                            Tem certeza que deseja excluir este arquivo? A transcrição e todos os dados associados serão removidos permanentemente.
                        </VaultDescription>
                    </VaultHeader>
                    <VaultFooter className="mt-6 border-none pt-0">
                        <VaultSecondaryButton onClick={() => setMediaToDelete(null)} className="flex-1">
                            Cancelar
                        </VaultSecondaryButton>
                        <VaultPrimaryButton variant="destructive" onClick={handleDelete} className="flex-1">
                            Excluir
                        </VaultPrimaryButton>
                    </VaultFooter>
                </VaultContent>
            </Vault>
        </div>
    );
}

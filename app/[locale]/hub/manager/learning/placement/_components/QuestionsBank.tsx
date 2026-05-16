"use client";

import { useState } from "react";
import useSWR from "swr";
import { getPlacementQuestionsAction, deletePlacementQuestionAction, updatePlacementQuestionAction } from "@/modules/placement/placement.actions";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, MoreHorizontal, FileAudio, Type, LayoutList, Check, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { notify } from "@/components/ui/toaster";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultFooter,
    VaultIcon,
    VaultPrimaryButton,
    VaultSecondaryButton
} from "@/components/ui/vault";
import { cn } from "@/lib/utils";
import { QuestionEditVault } from "./QuestionEditVault";
import { Question } from "@/modules/placement/placement.schema";

interface QuestionsBankProps {
    languageId: string;
}

export function QuestionsBank({ languageId }: QuestionsBankProps) {
    const t = useTranslations("Placement");
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isDeleteVaultOpen, setIsDeleteVaultOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const playAudio = (id: number, url: string, range?: { start: number; end: number }) => {
        if (playingId === id) {
            audio?.pause();
            setPlayingId(null);
            return;
        }
        if (audio) audio.pause();

        const newAudio = new Audio(url);
        if (range) {
            newAudio.currentTime = range.start;
            newAudio.ontimeupdate = () => {
                if (newAudio.currentTime >= range.end) {
                    newAudio.pause();
                    setPlayingId(null);
                }
            };
        }
        newAudio.play();
        setAudio(newAudio);
        setPlayingId(id);
        newAudio.addEventListener('ended', () => setPlayingId(null));
    };

    const { data: questions, mutate, isLoading } = useSWR<(Question & { mediaUrl?: string })[]>(
        languageId ? [`placement-questions`, languageId] : null,
        async () => {
            const result = await getPlacementQuestionsAction({ languageId });
            return (result?.data || []) as (Question & { mediaUrl?: string })[];
        }
    );

    const handleUpdateStatus = async (id: number, status: "active" | "draft" | "archived") => {
        const result = await updatePlacementQuestionAction({ id, data: { status } });
        if (result?.data?.success) {
            notify.success(t("status_updated") || "Status updated");
            mutate();
        } else {
            notify.error(result?.serverError || "Error updating status");
        }
    };

    const handleDeleteRequest = (id: number) => {
        setDeleteTargetId(id);
        setIsDeleteVaultOpen(true);
    };

    const confirmDeletion = async () => {
        if (!deleteTargetId) return;
        const result = await deletePlacementQuestionAction({ id: deleteTargetId });
        if (result?.data?.success) {
            notify.success(t("question_deleted") || "Question deleted");
            mutate();
        } else {
            notify.error(result?.serverError || "Error deleting question");
        }
        setIsDeleteVaultOpen(false);
        setDeleteTargetId(null);
    };

    const totalPages = Math.ceil((questions?.length || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedQuestions = (questions || []).slice(startIndex, startIndex + itemsPerPage);

    if (isLoading) {
        return (
            <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-md bg-muted/40 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 rounded-md border-2 border-dashed border-border bg-muted/20">
                <LayoutList className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t("no_questions") || "No questions found"}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t("no_questions_desc") || "Start by generating some questions."}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Cards */}
            <div className="grid gap-2">
                {paginatedQuestions.map((q) => (
                    <div
                        key={q.id}
                        className="group flex items-start gap-3 rounded-md border border-border bg-white dark:bg-gray-900 px-4 py-3 transition-shadow hover:shadow-sm"
                    >
                        {/* Type icon */}
                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                            {q.type === "writing" || q.type === "audio_comprehension" ? (
                                <FileAudio className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                                <Type className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug truncate">{q.content}</p>
                            {q.context && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{q.context}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0">
                                    {q.cefrLevel}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground capitalize">
                                    {q.type === "writing"
                                        ? (t("listening_gap_fill") || "Listening (Gap Fill)")
                                        : q.type.replace("_", " ")}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] h-4 px-1.5 py-0 capitalize",
                                        q.status === "active"
                                            ? "bg-green-500/10 text-green-600 border-green-200"
                                            : q.status === "draft"
                                                ? "bg-amber-500/10 text-amber-600 border-amber-200"
                                                : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {t(q.status) || q.status}
                                </Badge>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {q.mediaUrl && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => playAudio(q.id, q.mediaUrl!, q.metadata?.audioRange)}
                                >
                                    {playingId === q.id ? (
                                        <Pause className="w-3.5 h-3.5 fill-current" />
                                    ) : (
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                    )}
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => setEditingQuestion(q)}>
                                        <Edit3 className="w-3.5 h-3.5 mr-2" />
                                        {t("edit") || "Edit"}
                                    </DropdownMenuItem>
                                    {q.status === "draft" ? (
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(q.id, "active")}>
                                            <Check className="w-3.5 h-3.5 mr-2" />
                                            {t("publish") || "Publish"}
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={() => handleUpdateStatus(q.id, "draft")}>
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                                            {t("archive") || "Archive"}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => handleDeleteRequest(q.id)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                                        {t("delete") || "Delete"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                        {startIndex + 1}–{Math.min(startIndex + itemsPerPage, questions.length)}{" "}
                        <span className="text-muted-foreground/50">/ {questions.length}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "secondary" : "ghost"}
                                size="icon"
                                className="h-7 w-7 text-xs"
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Vault */}
            {editingQuestion && (
                <QuestionEditVault
                    question={editingQuestion}
                    open={!!editingQuestion}
                    onOpenChange={(open) => !open && setEditingQuestion(null)}
                    onSuccess={mutate}
                />
            )}

            {/* Delete Confirmation */}
            <Vault open={isDeleteVaultOpen} onOpenChange={setIsDeleteVaultOpen}>
                <VaultContent>
                    <VaultHeader>
                        <VaultIcon type="delete" />
                        <VaultTitle>{t("confirm_delete_title") || "Excluir Questão"}</VaultTitle>
                        <VaultDescription>
                            {t("confirm_delete_desc") || "Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita."}
                        </VaultDescription>
                    </VaultHeader>
                    <VaultFooter>
                        <VaultSecondaryButton onClick={() => setIsDeleteVaultOpen(false)}>
                            {t("cancel") || "Cancelar"}
                        </VaultSecondaryButton>
                        <VaultPrimaryButton variant="destructive" onClick={confirmDeletion}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("delete") || "Excluir"}
                        </VaultPrimaryButton>
                    </VaultFooter>
                </VaultContent>
            </Vault>
        </div>
    );
}
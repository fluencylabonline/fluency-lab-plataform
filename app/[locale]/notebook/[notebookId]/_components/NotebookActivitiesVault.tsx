"use client";

import { Sparkles, Music, Play, Music2, FileQuestionMark, LucideIcon } from "lucide-react";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";

import type { Editor } from "@tiptap/react";

interface ActivityOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  action?: (editor: Editor) => void;
}

const ACTIVITIES_OPTIONS: ActivityOption[] = [
  {
    id: "lyrics-training",
    title: "Lyrics Training (Treino de Música)",
    description: "Crie um exercício de completar lacunas em tempo real baseado em um clipe do YouTube e letra sincronizada.",
    icon: Music,
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    action: (editor) => editor.chain().focus().insertLyricsSync().run(),
  },
  {
    id: "youtube-sync",
    title: "YouTube Sincronizado",
    description: "Incorpore um vídeo do YouTube sincronizado em tempo real entre professor e aluno.",
    icon: Play,
    iconBgClass: "bg-red-500/10",
    iconColorClass: "text-red-500",
    action: (editor) => editor.chain().focus().insertYouTubeSync().run(),
  },
  {
    id: "audio-sync",
    title: "Áudio Sincronizado",
    description: "Incorpore um áudio sincronizado em tempo real entre professor e aluno.",
    icon: Music2,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-500",
  },
  {
    id: "quiz-generator",
    title: "Quiz da IA (10 Perguntas)",
    description: "Incorpore um quiz interativo de 10 perguntas geradas sobre o conteúdo da aula e corrigidas por IA.",
    icon: FileQuestionMark,
    iconBgClass: "bg-indigo-500/10",
    iconColorClass: "text-indigo-500",
    action: (editor) => editor.chain().focus().insertQuiz().run(),
  },
];

interface NotebookActivitiesVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotebookActivitiesVault({ open, onOpenChange }: NotebookActivitiesVaultProps) {
  const { editor } = useTiptapEditor();

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="sm:max-w-xl">
        <VaultHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <VaultTitle className="text-left font-bold">
              Atividades Interativas
            </VaultTitle>
          </div>
          <VaultDescription className="text-left">
            Selecione uma atividade para adicionar ao notebook dos alunos.
          </VaultDescription>
        </VaultHeader>
        <VaultBody className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {ACTIVITIES_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (option.action && editor) {
                      option.action(editor);
                      onOpenChange(false);
                    }
                  }}
                  disabled={!option.action}
                  className={`card flex items-start gap-4 p-4 text-left border border-muted bg-background rounded-xl transition-all duration-200 ${
                    option.action
                      ? "hover:border-primary/50 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className={`p-3 rounded-full shrink-0 ${option.iconBgClass} ${option.iconColorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground">
                      {option.title}
                    </h4>
                    <p className="text-sm text-muted-foreground font-normal leading-normal">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

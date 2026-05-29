"use client";

import { RefObject, useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import { Button } from "@/components/tiptap-ui-primitive/button";

// Components
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { TextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu/text-align-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkButton,
  LinkContent,
} from "@/components/tiptap-ui/link-popover";

// Icons & Hooks
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";
import { RoleGuard } from "@/components/ui/role-guard";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { CollaboratorsAvatarGroup } from "./CollaboratorsAvatarGroup";
import { Awareness } from "y-protocols/awareness";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import { NotebookSettingsVault } from "./NotebookSettingsVault";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import { Music, Sparkles, Settings, Play, Music2, FileQuestionMark } from "lucide-react";

interface NotebookToolbarProps {
  toolbarRef: RefObject<HTMLDivElement | null>;
  backHref: string;
  cursorY: number;
  user: {
    uid?: string;
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
  awareness?: Awareness | null;
}

export function NotebookToolbar({
  toolbarRef,
  backHref,
  cursorY,
  user,
  awareness,
}: NotebookToolbarProps) {
  const { editor } = useTiptapEditor();
  const [isToolsVaultOpen, setIsToolsVaultOpen] = useState(false);
  const [isSettingsVaultOpen, setIsSettingsVaultOpen] = useState(false);

  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );

  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);

  // Reset mobile view when switching to desktop
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }

  const toolbarStyle = isMobile
    ? { bottom: `calc(100% - ${height - cursorY}px)` }
    : {};

  return (
    <>
      <Toolbar ref={toolbarRef} style={toolbarStyle}>
        <BackButton href={backHref} />

        {mobileView === "main" ? (
          <>
            <Spacer />
            <ToolbarGroup>
              <UndoRedoButton action="undo" />
              <UndoRedoButton action="redo" />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
              <ListDropdownMenu
                modal={false}
                types={["bulletList", "orderedList", "taskList"]}
              />
              <BlockquoteButton />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <MarkButton type="bold" />
              <MarkButton type="italic" />
              {!isMobile ? (
                <ColorHighlightPopover />
              ) : (
                <ColorHighlightPopoverButton
                  onClick={() => setMobileView("highlighter")}
                />
              )}
              {!isMobile ? (
                <LinkPopover />
              ) : (
                <LinkButton onClick={() => setMobileView("link")} />
              )}
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <TextAlignDropdownMenu modal={false} />
            </ToolbarGroup>
            <RoleGuard roles={"teacher"}>
              <ToolbarSeparator />
              <ToolbarGroup>
                <ImageUploadButton text="Add" />
                <Button
                  type="button"
                  variant="ghost"
                  tooltip="Adicionar Atividade Interativa"
                  onClick={() => setIsToolsVaultOpen(true)}
                >
                  <Sparkles className="tiptap-button-icon text-amber-500 w-4 h-4" />
                </Button>
              </ToolbarGroup>
            </RoleGuard>
            <Spacer />
            <ThemeSwitcher />
            <Button
              type="button"
              variant="ghost"
              tooltip="Configurações do Leitor"
              onClick={() => setIsSettingsVaultOpen(true)}
              className="tiptap-button shrink-0"
            >
              <Settings className="tiptap-button-icon w-4 h-4" />
            </Button>
            <CollaboratorsAvatarGroup user={user} awareness={awareness ?? null} />
          </>
        ) : (
          <>
            <ToolbarGroup>
              <Button variant="ghost" onClick={() => setMobileView("main")}>
                <ArrowLeftIcon className="tiptap-button-icon" />
                {mobileView === "highlighter" ? (
                  <HighlighterIcon className="tiptap-button-icon" />
                ) : (
                  <LinkIcon className="tiptap-button-icon" />
                )}
              </Button>
            </ToolbarGroup>
            <ToolbarSeparator />
            {mobileView === "highlighter" ? (
              <ColorHighlightPopoverContent />
            ) : (
              <LinkContent />
            )}
          </>
        )}
      </Toolbar>

      {/* Vault de Seleção de Atividades Interativas */}
      <Vault open={isToolsVaultOpen} onOpenChange={setIsToolsVaultOpen}>
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
              <button
                onClick={() => {
                  editor?.chain().focus().insertLyricsSync().run();
                  setIsToolsVaultOpen(false);
                }}
                className="card flex items-start gap-4 p-4 text-left border border-muted hover:border-primary/50 bg-background rounded-xl transition-all duration-200"
              >
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <Music className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">
                    Lyrics Training (Treino de Música)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Crie um exercício de completar lacunas em tempo real baseado
                    em um clipe do YouTube e letra sincronizada.
                  </p>
                </div>
              </button>

              {/* YouTube Sync */}
              <button
                onClick={() => {
                  editor?.chain().focus().insertYouTubeSync().run();
                  setIsToolsVaultOpen(false);
                }}
                className="card flex items-start gap-4 p-4 text-left border border-muted hover:border-primary/50 bg-background rounded-xl transition-all duration-200"
              >
                <div className="bg-red-500/10 p-3 rounded-full text-red-500 shrink-0">
                  <Play className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">
                    YouTube Sincronizado
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Incorpore um vídeo do YouTube sincronizado em tempo real
                    entre professor e aluno.
                  </p>
                </div>
              </button>

              {/* Audio Sync */}
              <button
                // onClick={() => {}
                className="card flex items-start gap-4 p-4 text-left border border-muted hover:border-primary/50 bg-background rounded-xl transition-all duration-200"
              >
                <div className="bg-amber-500/10 p-3 rounded-full text-amber-500 shrink-0">
                  <Music2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">
                    Áudio Sincronizado
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Incorpore um áudio sincronizado em tempo real entre
                    professor e aluno.
                  </p>
                </div>
              </button>

              {/* Multiple Question Extension */}
              <button
                // onClick={() => {}
                className="card flex items-start gap-4 p-4 text-left border border-muted hover:border-primary/50 bg-background rounded-xl transition-all duration-200"
              >
                <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-500 shrink-0">
                  <FileQuestionMark className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">
                    Múltipla Escolha
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Incorpore questões de múltipla escolha sincronizadas em tempo real entre professor e aluno.
                  </p>
                </div>
              </button>
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>

      <NotebookSettingsVault
        open={isSettingsVaultOpen}
        onOpenChange={setIsSettingsVaultOpen}
      />
    </>
  );
}

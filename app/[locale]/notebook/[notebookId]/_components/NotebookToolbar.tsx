"use client";

import { RefObject, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import { Button } from "@/components/tiptap-ui-primitive/button";

import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { TextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu/text-align-dropdown-menu";
import { TableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu";

import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import { LinkPopover, LinkButton } from "@/components/tiptap-ui/link-popover";
import { TextColorPopover } from "@/components/tiptap-ui/text-color-popover";

import { useHeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { useListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu/use-list-dropdown-menu";
import { useTextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu/use-text-align-dropdown-menu";

import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";

import { RoleGuard } from "@/components/ui/role-guard";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { CollaboratorsAvatarGroup } from "./CollaboratorsAvatarGroup";
import { Awareness } from "y-protocols/awareness";
import { NotebookSettingsVault } from "./NotebookSettingsVault";
import { NotebookActivitiesVault } from "./NotebookActivitiesVault";
import { NotebookPlansVault } from "./NotebookPlansVault";
import { MobilePanelContent, type MobilePanel } from "./MobilePanelContent";
import {
  Sparkles,
  Settings,
  GraduationCap,
  Table as TableIcon,
} from "lucide-react";

// ─── AnimateHeight ────────────────────────────────────────────────
//
// Anima entre 0 e a altura real medida (nunca "auto").
// Sem border, sem background — apenas a janela que revela/esconde
// o conteúdo do painel. A borda visual pertence ao <Toolbar>.
//
interface AnimateHeightProps {
  isOpen: boolean;
  children: React.ReactNode;
}

function AnimateHeight({ isOpen, children }: AnimateHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setNaturalHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      animate={{ height: isOpen ? naturalHeight : 0 }}
      initial={false}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 36,
        mass: 0.9,
      }}
      // overflow hidden para clip do conteúdo durante animação.
      // Sem border, sem background — peça transparente que expande.
      style={{ overflow: "hidden", willChange: "height" }}
    >
      <motion.div
        // O conteúdo faz um fade + slide sutil separado da janela de altura,
        // assim parece surgir de dentro da toolbar (não cair de cima).
        animate={{
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : 6,
        }}
        initial={false}
        transition={{
          opacity: { duration: isOpen ? 0.18 : 0.10, ease: "easeOut" },
          y: { type: "spring", stiffness: 320, damping: 36, mass: 0.9 },
        }}
        ref={innerRef}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Component ───────────────────────────────────────────────────

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
  studentId: string;
}

export function NotebookToolbar({
  toolbarRef,
  backHref,
  user,
  awareness,
  studentId,
}: NotebookToolbarProps) {
  const [isToolsVaultOpen, setIsToolsVaultOpen] = useState(false);
  const [isSettingsVaultOpen, setIsSettingsVaultOpen] = useState(false);
  const [isPlansVaultOpen, setIsPlansVaultOpen] = useState(false);

  const isMobile = useIsBreakpoint();
  const [mobileView, setMobileView] = useState<MobilePanel>("main");
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);

  const { editor } = useTiptapEditor();
  const headingMenu = useHeadingDropdownMenu({ levels: [1, 2, 3, 4] });
  const listMenu = useListDropdownMenu({
    types: ["bulletList", "orderedList", "taskList"],
  });
  const textAlignMenu = useTextAlignDropdownMenu({
    editor,
    types: ["left", "center", "right", "justify"],
  });
  const isInsideTable = editor?.isActive("table") ?? false;

  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (!isMobile && mobileView !== "main") setMobileView("main");
  }

  const isPanelOpen = isMobile && mobileView !== "main";

  // No mobile a toolbar fica ancorada no bottom.
  // O container cresce para cima via flex-col-reverse — o bottom não se move.
  const toolbarStyle = isMobile ? { bottom: 0 } : {};

  return (
    <>
      <Toolbar
        ref={toolbarRef}
        style={toolbarStyle}
        data-mobile-panel={isMobile ? mobileView : undefined}
      >
        {!isMobile ? (
          // ─── Desktop ──────────────────────────────────────────
          <>
            <BackButton href={backHref} />
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
              <TableDropdownMenu modal={false} />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup>
              <MarkButton type="bold" />
              <MarkButton type="italic" />
              <TextColorPopover />
              <ColorHighlightPopover />
              <LinkPopover />
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
                <Button
                  type="button"
                  variant="ghost"
                  tooltip="Planos e Lições do Aluno"
                  onClick={() => setIsPlansVaultOpen(true)}
                >
                  <GraduationCap className="tiptap-button-icon text-indigo-500 w-4 h-4" />
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
            <CollaboratorsAvatarGroup
              user={user}
              awareness={awareness ?? null}
            />
          </>
        ) : (
          // ─── Mobile ───────────────────────────────────────────
          //
          // flex-col-reverse: a linha principal fica sempre na base.
          // AnimateHeight expande acima dela sem border própria —
          // a borda superior do <Toolbar> é a única borda visível,
          // e ela sobe junto com o container inteiro.
          //
          <div className="flex flex-col-reverse w-full min-w-0">

            {/* ── Linha principal (base fixa) ── */}
            <div className="toolbar-mobile-content">
              <BackButton href={backHref} />
              <Spacer />
              <ToolbarGroup>
                <UndoRedoButton action="undo" />
                <UndoRedoButton action="redo" />
              </ToolbarGroup>
              <ToolbarSeparator />
              <ToolbarGroup>
                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={
                    mobileView === "heading" || headingMenu.isActive
                      ? "on"
                      : "off"
                  }
                  disabled={!headingMenu.canToggle}
                  tooltip="Heading"
                  onClick={() =>
                    setMobileView(
                      mobileView === "heading" ? "main" : "heading"
                    )
                  }
                >
                  <headingMenu.Icon className="tiptap-button-icon" />
                  <ChevronDownIcon className="tiptap-button-dropdown-small" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={
                    mobileView === "list" || listMenu.isActive ? "on" : "off"
                  }
                  disabled={!listMenu.canToggle}
                  tooltip="Lista"
                  onClick={() =>
                    setMobileView(mobileView === "list" ? "main" : "list")
                  }
                >
                  <listMenu.Icon className="tiptap-button-icon" />
                  <ChevronDownIcon className="tiptap-button-dropdown-small" />
                </Button>

                <BlockquoteButton />

                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={
                    mobileView === "table" || isInsideTable ? "on" : "off"
                  }
                  tooltip={isInsideTable ? "Editar Tabela" : "Inserir Tabela"}
                  onClick={() =>
                    setMobileView(mobileView === "table" ? "main" : "table")
                  }
                >
                  <TableIcon className="tiptap-button-icon w-4 h-4" />
                  <ChevronDownIcon className="tiptap-button-dropdown-small" />
                </Button>
              </ToolbarGroup>
              <ToolbarSeparator />
              <ToolbarGroup>
                <MarkButton type="bold" />
                <MarkButton type="italic" />
                <ColorHighlightPopoverButton
                  onClick={() =>
                    setMobileView(
                      mobileView === "highlighter" ? "main" : "highlighter"
                    )
                  }
                />
                <LinkButton
                  onClick={() =>
                    setMobileView(mobileView === "link" ? "main" : "link")
                  }
                />
              </ToolbarGroup>
              <ToolbarSeparator />
              <ToolbarGroup>
                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={
                    mobileView === "textAlign" || textAlignMenu.isActive
                      ? "on"
                      : "off"
                  }
                  disabled={!textAlignMenu.canToggle}
                  tooltip="Alinhamento"
                  onClick={() =>
                    setMobileView(
                      mobileView === "textAlign" ? "main" : "textAlign"
                    )
                  }
                >
                  <textAlignMenu.Icon className="tiptap-button-icon" />
                  <ChevronDownIcon className="tiptap-button-dropdown-small" />
                </Button>
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
                  <Button
                    type="button"
                    variant="ghost"
                    tooltip="Planos e Lições do Aluno"
                    onClick={() => setIsPlansVaultOpen(true)}
                  >
                    <GraduationCap className="tiptap-button-icon text-indigo-500 w-4 h-4" />
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
              <CollaboratorsAvatarGroup
                user={user}
                awareness={awareness ?? null}
              />
            </div>

            {/* ── Painel secundário (cresce para cima, sem borda própria) ── */}
            <AnimateHeight isOpen={isPanelOpen}>
              <div
                className={
                  mobileView === "table"
                    ? "w-full"
                    : "toolbar-mobile-content flex justify-end"
                }
              >
                {mobileView !== "main" && (
                  <MobilePanelContent
                    panel={mobileView as Exclude<MobilePanel, "main">}
                    onBack={() => setMobileView("main")}
                  />
                )}
              </div>
            </AnimateHeight>

          </div>
        )}
      </Toolbar>

      <NotebookActivitiesVault
        open={isToolsVaultOpen}
        onOpenChange={setIsToolsVaultOpen}
      />
      <NotebookSettingsVault
        open={isSettingsVaultOpen}
        onOpenChange={setIsSettingsVaultOpen}
      />
      <NotebookPlansVault
        open={isPlansVaultOpen}
        onOpenChange={setIsPlansVaultOpen}
        studentId={studentId}
      />
    </>
  );
}
"use client";

import { RefObject, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import { Button } from "@/components/tiptap-ui-primitive/button";

// Tiptap UI — Desktop dropdown menus
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { TextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu/text-align-dropdown-menu";
import { TableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu";

// Tiptap UI — Shared components
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { TextColorPopover } from "@/components/tiptap-ui/text-color-popover";

// Dropdown hooks — active state icons for mobile triggers
import { useHeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { useListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu/use-list-dropdown-menu";
import { useTextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu/use-text-align-dropdown-menu";

// Icons
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";

// Hooks
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";

// Layout & Context
import { RoleGuard } from "@/components/ui/role-guard";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { CollaboratorsAvatarGroup } from "./CollaboratorsAvatarGroup";
import { Awareness } from "y-protocols/awareness";
import { NotebookSettingsVault } from "./NotebookSettingsVault";
import { NotebookActivitiesVault } from "./NotebookActivitiesVault";
import { NotebookPlansVault } from "./NotebookPlansVault";
import { MobilePanelContent, type MobilePanel } from "./MobilePanelContent";
import { Sparkles, Settings, GraduationCap, Table as TableIcon } from "lucide-react";

// ─── Component ──────────────────────────────────────────────────

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
  cursorY,
  user,
  awareness,
  studentId,
}: NotebookToolbarProps) {
  const [isToolsVaultOpen, setIsToolsVaultOpen] = useState(false);
  const [isSettingsVaultOpen, setIsSettingsVaultOpen] = useState(false);
  const [isPlansVaultOpen, setIsPlansVaultOpen] = useState(false);

  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<MobilePanel>("main");

  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);

  // Hooks for mobile trigger active-state icons
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
      <Toolbar
        ref={toolbarRef}
        style={toolbarStyle}
        data-mobile-panel={isMobile ? mobileView : undefined}
      >
        {!isMobile ? (
          // ─── Desktop: Dropdown menus (unchanged) ───────────────
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
          // ─── Mobile: Two stacked rows (if active) ────────────────
          <motion.div
            layout
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 28,
              mass: 0.8,
            }}
            className="flex flex-col w-full min-w-0"
          >
            {/* Top row: active sub-panel */}
            <AnimatePresence initial={false}>
              {mobileView !== "main" && (
                <motion.div
                  key={mobileView}
                  initial={{ height: 0, opacity: 0, y: 8 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: 8 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 28,
                    mass: 0.8,
                  }}
                  style={{ overflow: "hidden" }}
                  className="toolbar-mobile-panel-wrapper"
                >
                  <div className={mobileView === "table" ? "w-full" : "toolbar-mobile-content flex justify-end"}>
                    <MobilePanelContent
                      panel={mobileView as Exclude<MobilePanel, "main">}
                      onBack={() => setMobileView("main")}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom row: main toolbar buttons */}
            <div className="toolbar-mobile-content">
              <BackButton href={backHref} />
              <Spacer />
              <ToolbarGroup>
                <UndoRedoButton action="undo" />
                <UndoRedoButton action="redo" />
              </ToolbarGroup>
              <ToolbarSeparator />
              <ToolbarGroup>
                {/* Heading trigger — shows active heading icon */}
                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={headingMenu.isActive ? "on" : "off"}
                  disabled={!headingMenu.canToggle}
                  tooltip="Heading"
                  onClick={() => setMobileView(mobileView === "heading" ? "main" : "heading")}
                >
                  <headingMenu.Icon className="tiptap-button-icon" />
                  <ChevronDownIcon className="tiptap-button-dropdown-small" />
                </Button>

                {/* List trigger — shows active list icon */}
                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={listMenu.isActive ? "on" : "off"}
                  disabled={!listMenu.canToggle}
                  tooltip="Lista"
                  onClick={() => setMobileView(mobileView === "list" ? "main" : "list")}
                >
                  <listMenu.Icon className="tiptap-button-icon" />
                  <ChevronDownIcon className="tiptap-button-dropdown-small" />
                </Button>

                <BlockquoteButton />

                {/* Table trigger */}
                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={isInsideTable ? "on" : "off"}
                  tooltip={
                    isInsideTable ? "Editar Tabela" : "Inserir Tabela"
                  }
                  onClick={() => setMobileView(mobileView === "table" ? "main" : "table")}
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
                  onClick={() => setMobileView(mobileView === "highlighter" ? "main" : "highlighter")}
                />
                <LinkButton
                  onClick={() => setMobileView(mobileView === "link" ? "main" : "link")}
                />
              </ToolbarGroup>
              <ToolbarSeparator />
              <ToolbarGroup>
                {/* Text align trigger — shows active alignment icon */}
                <Button
                  type="button"
                  variant="ghost"
                  data-active-state={textAlignMenu.isActive ? "on" : "off"}
                  disabled={!textAlignMenu.canToggle}
                  tooltip="Alinhamento"
                  onClick={() => setMobileView(mobileView === "textAlign" ? "main" : "textAlign")}
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
          </motion.div>
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

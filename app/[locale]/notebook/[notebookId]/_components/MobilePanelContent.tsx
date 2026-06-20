"use client";

import {
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import { Button } from "@/components/tiptap-ui-primitive/button";

// Tiptap UI buttons (each uses useTiptapEditor internally via context)
import { HeadingButton } from "@/components/tiptap-ui/heading-button";
import type { Level } from "@/components/tiptap-ui/heading-button";
import { ListButton } from "@/components/tiptap-ui/list-button";
import type { ListType } from "@/components/tiptap-ui/list-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import type { TextAlign } from "@/components/tiptap-ui/text-align-button";
import { ColorHighlightPopoverContent } from "@/components/tiptap-ui/color-highlight-popover";
import { LinkContent } from "@/components/tiptap-ui/link-popover";
import { TextColorPopoverContent } from "@/components/tiptap-ui/text-color-popover";

// Icons
import { HeadingIcon } from "@/components/tiptap-icons/heading-icon";
import { ListIcon } from "@/components/tiptap-icons/list-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import {
  Table as TableIcon,
  Trash2,
  Merge,
  Split,
  Heading,
  AlignLeft,
  Baseline as BaselineIcon,
} from "lucide-react";

// Hooks
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// ─── Types ──────────────────────────────────────────────────────

export type MobilePanel =
  | "main"
  | "heading"
  | "list"
  | "textAlign"
  | "table"
  | "highlighter"
  | "textColor"
  | "link";

// ─── Panel Icon Map ─────────────────────────────────────────────

const PANEL_ICONS: Record<
  Exclude<MobilePanel, "main">,
  React.ComponentType<{ className?: string }>
> = {
  heading: HeadingIcon,
  list: ListIcon,
  textAlign: AlignLeft,
  table: TableIcon,
  highlighter: HighlighterIcon,
  textColor: BaselineIcon,
  link: LinkIcon,
};

// ─── Main Component ─────────────────────────────────────────────

interface MobilePanelContentProps {
  panel: Exclude<MobilePanel, "main">;
  onBack: () => void;
}

export function MobilePanelContent({ panel, onBack }: MobilePanelContentProps) {
  const PanelIcon = PANEL_ICONS[panel];

  if (panel === "table") {
    return <TablePanelContent onSelect={onBack} />;
  }

  return (
    <>
      <ToolbarGroup>
        <Button variant="ghost" onClick={onBack}>
          <PanelIcon className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator />

      {panel === "heading" && <HeadingPanelContent onSelect={onBack} />}
      {panel === "list" && <ListPanelContent onSelect={onBack} />}
      {panel === "textAlign" && <TextAlignPanelContent onSelect={onBack} />}
      {panel === "highlighter" && <ColorHighlightPopoverContent />}
      {panel === "textColor" && <TextColorPopoverContent onSelect={onBack} />}
      {panel === "link" && <LinkContent />}
    </>
  );
}

// ─── Heading Panel ──────────────────────────────────────────────

const HEADING_LEVELS: Level[] = [1, 2, 3, 4];

function HeadingPanelContent({ onSelect }: { onSelect: () => void }) {
  return (
    <ToolbarGroup>
      {HEADING_LEVELS.map((level) => (
        <HeadingButton
          key={level}
          level={level}
          showTooltip={false}
          onClick={onSelect}
        />
      ))}
    </ToolbarGroup>
  );
}

// ─── List Panel ─────────────────────────────────────────────────

const LIST_TYPES: ListType[] = ["bulletList", "orderedList", "taskList"];

function ListPanelContent({ onSelect }: { onSelect: () => void }) {
  return (
    <ToolbarGroup>
      {LIST_TYPES.map((type) => (
        <ListButton
          key={type}
          type={type}
          showTooltip={false}
          onClick={onSelect}
        />
      ))}
    </ToolbarGroup>
  );
}

// ─── Text Align Panel ───────────────────────────────────────────

const ALIGN_TYPES: TextAlign[] = ["left", "center", "right", "justify"];

function TextAlignPanelContent({ onSelect }: { onSelect: () => void }) {
  return (
    <ToolbarGroup>
      {ALIGN_TYPES.map((align) => (
        <TextAlignButton
          key={align}
          align={align}
          showTooltip={false}
          onClick={onSelect}
        />
      ))}
    </ToolbarGroup>
  );
}

// ─── Table Panel ────────────────────────────────────────────────

function TablePanelContent({ onSelect }: { onSelect: () => void }) {
  const { editor } = useTiptapEditor();

  if (!editor || !editor.isEditable) return null;

  const isInsideTable = editor.isActive("table");

  // When not inside a table, show simple "Insert Table" button
  if (!isInsideTable) {
    return (
      <ToolbarGroup>
        <Button
          type="button"
          variant="ghost"
          showTooltip={false}
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
            onSelect();
          }}
        >
          <TableIcon className="tiptap-button-icon text-muted-foreground w-4 h-4" />
          <span className="tiptap-button-text">Inserir Tabela (3x3)</span>
        </Button>
      </ToolbarGroup>
    );
  }

  // Helper to run an editor command and auto-collapse
  const run = (fn: () => void) => () => {
    fn();
    onSelect();
  };

  // Full table editing options — 3 rows (Linha, Coluna, Outras) with vertical layout + sidebar back button
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 w-full items-stretch">
      {/* Sidebar: Back button spans 3 rows */}
      <div className="row-span-3 flex items-center justify-center border-r border-[var(--tt-toolbar-border-color)] pr-2 shrink-0">
        <Button variant="ghost" onClick={onSelect} className="h-full px-2">
          <TableIcon className="tiptap-button-icon" />
        </Button>
      </div>

      {/* Row 1: Line operations */}
      <div className="toolbar-mobile-content">
        <ToolbarGroup>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().addRowBefore().run())}
          >
            <span className="tiptap-button-text">↑ Linha</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().addRowAfter().run())}
          >
            <span className="tiptap-button-text">↓ Linha</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().deleteRow().run())}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="tiptap-button-icon w-4 h-4" />
            <span className="tiptap-button-text">Excluir Linha</span>
          </Button>
        </ToolbarGroup>
      </div>

      {/* Row 2: Column operations */}
      <div className="toolbar-mobile-content">
        <ToolbarGroup>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().addColumnBefore().run())}
          >
            <span className="tiptap-button-text">← Col</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().addColumnAfter().run())}
          >
            <span className="tiptap-button-text">Col →</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().deleteColumn().run())}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="tiptap-button-icon w-4 h-4" />
            <span className="tiptap-button-text">Excluir Col</span>
          </Button>
        </ToolbarGroup>
      </div>

      {/* Row 3: Cell & Table operations */}
      <div className="toolbar-mobile-content">
        <ToolbarGroup>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().mergeCells().run())}
          >
            <Merge className="tiptap-button-icon text-muted-foreground w-4 h-4" />
            <span className="tiptap-button-text">Mesclar</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().splitCell().run())}
          >
            <Split className="tiptap-button-icon text-muted-foreground w-4 h-4" />
            <span className="tiptap-button-text">Dividir</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().toggleHeaderRow().run())}
          >
            <Heading className="tiptap-button-icon text-muted-foreground w-4 h-4" />
            <span className="tiptap-button-text">Cabeçalho</span>
          </Button>
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <Button
            type="button"
            variant="ghost"
            showTooltip={false}
            onClick={run(() => editor.chain().focus().deleteTable().run())}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="tiptap-button-icon w-4 h-4" />
            <span className="tiptap-button-text">Excluir Tabela</span>
          </Button>
        </ToolbarGroup>
      </div>
    </div>
  );
}

"use client";

import { RefObject, useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "@/components/tiptap-ui-primitive/toolbar";
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
  ColorHighlightPopoverContent
} from "@/components/tiptap-ui/color-highlight-popover";
import { LinkPopover, LinkButton, LinkContent } from "@/components/tiptap-ui/link-popover";

// Icons & Hooks
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";

interface NotebookToolbarProps {
  toolbarRef: RefObject<HTMLDivElement | null>;
  backHref: string;
  cursorY: number;
}

export function NotebookToolbar({ toolbarRef, backHref, cursorY }: NotebookToolbarProps) {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main");

  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);

  // Reset mobile view when switching to desktop
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }

  const toolbarStyle = isMobile ? { bottom: `calc(100% - ${height - cursorY}px)` } : {};

  return (
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
            <ListDropdownMenu modal={false} types={["bulletList", "orderedList", "taskList"]} />
            <BlockquoteButton />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <MarkButton type="bold" />
            <MarkButton type="italic" />
            {!isMobile ? (
              <ColorHighlightPopover />
            ) : (
              <ColorHighlightPopoverButton onClick={() => setMobileView("highlighter")} />
            )}
            {!isMobile ? <LinkPopover /> : <LinkButton onClick={() => setMobileView("link")} />}
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <TextAlignDropdownMenu modal={false} />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ImageUploadButton text="Add" />
          </ToolbarGroup>
          <Spacer />
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
          {mobileView === "highlighter" ? <ColorHighlightPopoverContent /> : <LinkContent />}
        </>
      )}
    </Toolbar>
  );
}

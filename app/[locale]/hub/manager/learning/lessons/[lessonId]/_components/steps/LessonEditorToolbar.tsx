"use client";

import { RefObject } from "react";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { TextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu/text-align-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover";
import { LinkPopover } from "@/components/tiptap-ui/link-popover";
import { TableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu";
import { TextColorPopover } from "@/components/tiptap-ui/text-color-popover";

interface LessonEditorToolbarProps {
  toolbarRef: RefObject<HTMLDivElement | null>;
}

export function LessonEditorToolbar({ toolbarRef }: LessonEditorToolbarProps) {
  return (
    <Toolbar ref={toolbarRef} variant="fixed" className="border-b border-border bg-background py-1.5 px-4">
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
        <MarkButton type="strike" />
        <TextColorPopover />
        <ColorHighlightPopover />
        <LinkPopover />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignDropdownMenu modal={false} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add Image" />
      </ToolbarGroup>

      <Spacer />
    </Toolbar>
  );
}

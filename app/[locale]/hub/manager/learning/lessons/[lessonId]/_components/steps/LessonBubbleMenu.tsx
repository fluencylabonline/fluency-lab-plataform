"use client";

import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Strikethrough, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonBubbleMenuProps {
  editor: Editor | null;
}

export function LessonBubbleMenu({ editor }: LessonBubbleMenuProps) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => {
        return !editor.state.selection.empty;
      }}
      className="flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-md z-50"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-popover-foreground hover:bg-muted"
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold") ? "true" : undefined}
      >
        <Bold className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-popover-foreground hover:bg-muted"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic") ? "true" : undefined}
      >
        <Italic className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-popover-foreground hover:bg-muted"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        data-active={editor.isActive("strike") ? "true" : undefined}
      >
        <Strikethrough className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-popover-foreground hover:bg-muted"
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            const href = window.prompt("URL:");
            if (href) {
              editor.chain().focus().setLink({ href }).run();
            }
          }
        }}
        data-active={editor.isActive("link") ? "true" : undefined}
      >
        <Link className="w-4 h-4" />
      </Button>
    </BubbleMenu>
  );
}

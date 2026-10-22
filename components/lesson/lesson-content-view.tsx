"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { AudioSyncNode } from "@/components/tiptap-extension/audio-sync/AudioSyncNode";
import { QuizNode } from "@/components/tiptap-extension/quiz/QuizNode";
import { cn } from "@/lib/utils";

import "@/components/tiptap-templates/simple/simple-editor.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

interface LessonContentViewProps {
  content: JSONContent;
  className?: string;
}

/**
 * Conteúdo de lição em modo leitura, com as mesmas extensões e o mesmo visual do editor:
 * fundo branco no tema claro e preto no escuro (`--tt-bg-color`).
 */
export function LessonContentView({ content, className }: LessonContentViewProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: true } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      TableKit,
      TextStyle,
      Color,
      AudioSyncNode,
      QuizNode,
    ],
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "simple-editor" } },
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border/60",
        // O editor reserva 30vh no fim e limita a 648px: na leitura o conteúdo usa a largura toda.
        "[&_.simple-editor-content]:h-auto [&_.simple-editor-content]:max-w-4xl",
        "[&_.simple-editor-content_.ProseMirror]:pb-12!",
        className
      )}
      style={{ backgroundColor: "var(--tt-bg-color)", color: "var(--tt-theme-text)" }}
    >
      <EditorContent editor={editor} className="simple-editor-content" />
    </div>
  );
}

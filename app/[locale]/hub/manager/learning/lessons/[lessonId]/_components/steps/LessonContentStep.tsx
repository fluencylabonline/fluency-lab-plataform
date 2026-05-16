"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { JSONContent } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { Save, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2 } from "lucide-react";
import { updateLessonAction } from "@/modules/curriculum/curriculum.actions";
import { cn } from "@/lib/utils";

interface LessonContentStepProps {
  lessonId: string;
  initialContentJson: JSONContent | null;
  onComplete: () => void;
  status: string;
}

export function LessonContentStep({ lessonId, initialContentJson, onComplete, status }: LessonContentStepProps) {
  const t = useTranslations("Learning");
  const [isSaving, setIsSaving] = useState(false);
  const storageKey = `lesson-draft-${lessonId}`;

  // 1. Initialize editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContentJson || "<p>Write your lesson story here...</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      localStorage.setItem(storageKey, JSON.stringify(json));
    },
  });

  // 2. Load draft on mount if it exists
  useEffect(() => {
    if (editor) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only load draft if server content is empty
          if (parsed.type === "doc" && !initialContentJson) {
            editor.commands.setContent(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved draft", e);
        }
      }
    }
  }, [editor, initialContentJson, storageKey]);

  const handleSave = async () => {
    if (status === "ready") {
      onComplete();
      return;
    }
    if (!editor) return;
    setIsSaving(true);
    try {
      const result = await updateLessonAction({
        id: lessonId,
        contentJson: editor.getJSON(),
        contentText: editor.getText(),
        creationStep: 6,
      });

      if (result?.data?.success) {
        // 3. Clear local storage on successful DB save
        localStorage.removeItem(storageKey);
        notify.success(t("save_success") || "Lesson content saved");
        onComplete();
      } else {
        notify.error(result?.serverError || "Failed to save content");
      }
    } catch {
      notify.error("Error saving content");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="step-content flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("lesson_editor_title") || "Craft Your Lesson"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("lesson_editor_desc") || "Write the actual lesson content that students will read."}
          </p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {t("confirm_and_next") || "Save & Continue"}
        </Button>
      </div>

      {/* ── Editor ── */}
      <div className="card border border-border rounded-md bg-background overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            icon={<Bold className="w-3.5 h-3.5" />}
            label="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            icon={<Italic className="w-3.5 h-3.5" />}
            label="Italic"
          />

          <div className="w-px h-4 bg-border mx-1.5" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            icon={<Heading1 className="w-3.5 h-3.5" />}
            label="Heading 1"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            icon={<Heading2 className="w-3.5 h-3.5" />}
            label="Heading 2"
          />

          <div className="w-px h-4 bg-border mx-1.5" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            icon={<List className="w-3.5 h-3.5" />}
            label="Bullet list"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            icon={<ListOrdered className="w-3.5 h-3.5" />}
            label="Ordered list"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            icon={<Quote className="w-3.5 h-3.5" />}
            label="Blockquote"
          />
        </div>

        {/* Content area */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon,
  label,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded-md transition-colors text-muted-foreground",
        active
          ? "bg-muted text-foreground"
          : "hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
    </button>
  );
}
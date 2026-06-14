"use client";

import { useEditor, EditorContent, EditorContext, type JSONContent } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect, useCallback, useRef } from "react";
import { Save, Edit3, X, ArrowRight } from "lucide-react";
import { updateLessonAction } from "@/modules/curriculum/curriculum.actions";

// --- Tiptap Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Selection } from "@tiptap/extensions";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";

// --- Firebase ---
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// --- Custom Sync Nodes ---
import { YouTubeSyncNode } from "@/components/tiptap-extension/youtube-sync/YoutubeSyncNode";
import { LyricsSyncNode } from "@/components/tiptap-extension/lyrics-sync/LyricsSyncNode";
import { QuizNode } from "@/components/tiptap-extension/quiz/QuizNode";
import { AudioSyncNode } from "@/components/tiptap-extension/audio-sync/AudioSyncNode";
import { SpeakingRecorderNode } from "@/components/tiptap-extension/speaking-recorder/SpeakingRecorderNode";

// --- Components & Primitives ---
import { LessonEditorToolbar } from "./LessonEditorToolbar";
import { LessonBubbleMenu } from "./LessonBubbleMenu";
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

interface LessonContentStepProps {
  lessonId: string;
  initialContentJson: JSONContent | null;
  onComplete: () => void;
  status: string;
}

function isValidTiptapDoc(json: unknown): json is JSONContent {
  if (!json || typeof json !== "object") return false;
  const obj = json as Record<string, unknown>;
  return obj.type === "doc" && Array.isArray(obj.content);
}

export function LessonContentStep({
  lessonId,
  initialContentJson,
  onComplete,
  status,
}: LessonContentStepProps) {
  const t = useTranslations("Learning");
  const [isSaving, setIsSaving] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const storageKey = `lesson-draft-${lessonId}`;

  const toolbarRef = useRef<HTMLDivElement>(null);
  const lastSavedHtml = useRef<string>("");

  // Set manager role globally on mount so interactive node views recognize the current view context
  useEffect(() => {
    (globalThis as Record<string, unknown>).__userRole = "manager";
    // Ensure collaborative syncing is disabled
    (globalThis as Record<string, unknown>).__notebookId = undefined;
  }, []);

  // 1. Image upload callback to Firebase Storage under the curriculum lesson images path
  const handleImageUpload = useCallback(
    async (file: File, onProgress?: (event: { progress: number }) => void) => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `curriculum/lessons/${lessonId}/images/${fileName}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({ progress });
          },
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    },
    [lessonId]
  );

  // 2. Initialize the Tiptap editor with premium extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: { openOnClick: false, enableClickSelection: true },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 10,
        upload: handleImageUpload,
      }),
      YouTubeSyncNode,
      LyricsSyncNode,
      QuizNode,
      AudioSyncNode,
      SpeakingRecorderNode,
    ],
    content: isValidTiptapDoc(initialContentJson)
      ? initialContentJson
      : "<p>Escreva o conteúdo da sua aula aqui...</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "simple-editor",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      localStorage.setItem(storageKey, JSON.stringify(json));
    },
  });

  // Track initial content HTML for dirty checks
  useEffect(() => {
    if (editor && !lastSavedHtml.current) {
      lastSavedHtml.current = editor.getHTML();
    }
  }, [editor]);

  // 3. Load draft on mount if it exists and server content is empty
  useEffect(() => {
    if (editor) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (isValidTiptapDoc(parsed) && !isValidTiptapDoc(initialContentJson)) {
            editor.commands.setContent(parsed);
            lastSavedHtml.current = editor.getHTML();
          }
        } catch (e) {
          console.error("Failed to parse saved draft", e);
        }
      }
    }
  }, [editor, initialContentJson, storageKey]);

  // 4. Save content action from fullscreen editor to Neon DB
  const handleSaveFullscreen = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const result = await updateLessonAction({
        id: lessonId,
        contentJson: editor.getJSON(),
        contentText: editor.getText(),
        creationStep: 5, // Keep at current step
      });

      if (result?.data?.success) {
        localStorage.removeItem(storageKey);
        lastSavedHtml.current = editor.getHTML();
        notify.success(t("save_success") || "Conteúdo salvo com sucesso!");
        setIsFullscreen(false);
      } else {
        notify.error(result?.serverError || "Falha ao salvar o conteúdo");
      }
    } catch {
      notify.error("Erro ao salvar o conteúdo");
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Close fullscreen with unsaved changes confirmation check
  const handleCloseFullscreen = () => {
    if (!editor) {
      setIsFullscreen(false);
      return;
    }
    const currentHtml = editor.getHTML();
    const isDirty = currentHtml !== lastSavedHtml.current;

    if (isDirty) {
      const confirmDiscard = window.confirm(
        t("unsaved_changes_confirm") ||
          "Você possui alterações não salvas. Deseja realmente descartar as alterações?"
      );
      if (!confirmDiscard) return;
    }

    // Revert editor to last saved state if discarding
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        editor.commands.setContent(JSON.parse(saved));
      } catch {}
    } else if (isValidTiptapDoc(initialContentJson)) {
      editor.commands.setContent(initialContentJson);
    } else {
      editor.commands.setContent("<p>Escreva o conteúdo da sua aula aqui...</p>");
    }

    setIsFullscreen(false);
  };

  // 6. Confirm and go to the next step
  const handleConfirmAndNext = async () => {
    if (status === "ready") {
      onComplete();
      return;
    }

    setIsAdvancing(true);
    try {
      const result = await updateLessonAction({
        id: lessonId,
        creationStep: 6,
      });

      if (result?.data?.success) {
        onComplete();
      } else {
        notify.error(result?.serverError || "Falha ao avançar de etapa");
      }
    } catch {
      notify.error("Erro ao avançar de etapa");
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!editor) return null;

  // Render Fullscreen Editor
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col h-screen w-screen overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseFullscreen}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">
                {t("editing_lesson_content") || "Editar Conteúdo da Aula"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("fullscreen_editor_subtitle") || "Escreva e formate o conteúdo principal da lição."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseFullscreen}
            >
              {t("cancel") || "Cancelar"}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFullscreen}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {t("save") || "Salvar"}
            </Button>
          </div>
        </div>

        {/* Toolbar Context */}
        <EditorContext.Provider value={{ editor }}>
          <LessonEditorToolbar toolbarRef={toolbarRef} />
          
          <LessonBubbleMenu editor={editor} />

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto bg-background simple-editor-wrapper">
            <EditorContent editor={editor} className="simple-editor-content" />
          </div>
        </EditorContext.Provider>
      </div>
    );
  }

  // Render Step Preview Screen
  const hasContent = editor.getText().trim().length > 0 && editor.getHTML() !== "<p>Escreva o conteúdo da sua aula aqui...</p>";

  return (
    <div className="step-content flex flex-col gap-6">
      {/* Step Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("lesson_editor_title") || "Craft Your Lesson"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("lesson_editor_desc") || "Write the actual lesson content that students will read."}
          </p>
        </div>
        <Button onClick={handleConfirmAndNext} isLoading={isAdvancing}>
          {t("confirm_and_next") || "Confirmar e Avançar"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Preview Card */}
      <div className="card border border-border rounded-md bg-background overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("content_preview") || "Visualização do Conteúdo"}
          </span>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            {t("edit_content") || "Editar Conteúdo"}
          </Button>
        </div>

        {hasContent ? (
          <div className="prose dark:prose-invert max-w-none max-h-[400px] overflow-y-auto p-4 border border-border rounded-md bg-muted/10">
            <div dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-md bg-muted/5">
            <p className="text-muted-foreground text-sm font-medium">
              {t("no_content_added") || "Nenhum conteúdo inserido ainda."}
            </p>
            <Button
              variant="link"
              size="sm"
              className="mt-2 text-primary font-semibold"
              onClick={() => setIsFullscreen(true)}
            >
              {t("click_here_to_edit") || "Clique aqui para começar a editar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
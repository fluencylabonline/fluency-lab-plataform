"use client";

import { useCallback, useRef } from "react";
import { EditorContent, EditorContext, useEditor, type Editor } from "@tiptap/react";
import { useParams } from "next/navigation";

// --- Tiptap Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";

// --- Hooks & Components ---
import { useNotebookSession } from "../_hooks/use-notebook-session";
import { useNotebookCollaboration } from "../_hooks/use-notebook-collaboration";
import { NotebookToolbar } from "./NotebookToolbar";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { useRefRect } from "@/hooks/use-element-rect";
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { registerNotebookAssetAction } from "@/modules/notebook/notebook.actions";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

interface NotebookEditorProps {
  notebookId: string;
  studentId: string;
  userId: string;
  userName: string;
  userRole: string;
  userColor: string;
}

export function NotebookEditor({
  notebookId,
  studentId,
  userId,
  userName,
  userRole,
  userColor,
}: NotebookEditorProps) {
  const params = useParams();
  const locale = params.locale as string;
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  // 1. Collaboration Logic
  const { ydoc, provider } = useNotebookCollaboration(notebookId);

  // 2. Session Logic (Neon/Tracking)
  const getEditorContent = useCallback(() => editorRef.current?.getHTML(), []);
  useNotebookSession({ notebookId, getEditorContent });

  // 3. Image Upload Handler
  const handleNotebookImageUpload = useCallback(async (
    file: File,
    onProgress?: (event: { progress: number }) => void
  ) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `notebooks/${notebookId}/${userId}/${fileName}`;
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

          // Register in Neon for cleanup tracking
          await registerNotebookAssetAction({
            notebookId,
            filePath,
            fileName,
            contentType: file.type,
            sizeBytes: file.size,
          });

          resolve(downloadURL);
        }
      );
    });
  }, [notebookId, userId]);

  // 4. Editor Instance
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "simple-editor",
      },
    },
    onUpdate: ({ editor }) => { editorRef.current = editor; },
    onCreate: ({ editor }) => { editorRef.current = editor; },
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Conflict with Collaboration
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
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 10,
        upload: handleNotebookImageUpload,
      }),
      ...(ydoc ? [Collaboration.configure({ document: ydoc, field: "content" })] : []),
      ...(provider ? [
        CollaborationCaret.configure({
          provider,
          user: { name: userName, color: userColor },
        }),
      ] : []),
    ],
  }, [ydoc, provider]);

  // 4. UI Helpers
  const toolbarRect = useRefRect(toolbarRef);
  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRect.height,
  });

  const backHref = userRole === "teacher"
    ? `/${locale}/hub/teacher/students/${studentId}`
    : `/${locale}/hub/student/notebook`;

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <NotebookToolbar
          toolbarRef={toolbarRef}
          backHref={backHref}
          cursorY={rect.y}
        />

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  );
}

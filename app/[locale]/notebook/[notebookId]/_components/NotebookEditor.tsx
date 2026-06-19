"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  EditorContent,
  EditorContext,
  useEditor,
  type Editor,
} from "@tiptap/react";

// --- Tiptap Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Selection } from "@tiptap/extensions";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { YouTubeSyncNode } from "@/components/tiptap-extension/youtube-sync/YoutubeSyncNode";
import { LyricsSyncNode } from "@/components/tiptap-extension/lyrics-sync/LyricsSyncNode";
import { QuizNode } from "@/components/tiptap-extension/quiz/QuizNode";
import { AudioSyncNode } from "@/components/tiptap-extension/audio-sync/AudioSyncNode";
import { SpeakingRecorderNode } from "@/components/tiptap-extension/speaking-recorder/SpeakingRecorderNode";
import { TableKit } from "@tiptap/extension-table";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";

// --- Call Feature ---
import { FloatCallButton } from "./call/FloatCallButton";
import { VideoCall } from "./call/VideoCall";
import { useCallStore } from "@/hooks/data/use-call-store";
import { useStudentCallListener } from "@/hooks/data/use-student-call-listener";

// --- Hooks & Components ---
import { useNotebookSession } from "../_hooks/use-notebook-session";
import { useNotebookCollaboration } from "../_hooks/use-notebook-collaboration";
import { NotebookToolbar } from "./NotebookToolbar";
import { NotebookBubbleMenu } from "./NotebookBubbleMenu";
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
  /** Optional: used by Stream SDK for avatar rendering */
  userPhotoUrl?: string | null;
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

export function NotebookEditor({
  notebookId,
  studentId,
  userId,
  userName,
  userRole,
  userColor,
  userPhotoUrl,
  user,
}: NotebookEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  // 1. Collaboration Logic
  const { ydoc, awareness } = useNotebookCollaboration({
    notebookId,
    uid: userId,
    user: { name: userName, color: userColor, uid: userId, photoUrl: user.photoUrl },
  });

  // 2. Session Logic (Neon/Tracking)
  const getEditorContent = useCallback(() => editorRef.current?.getHTML(), []);
  useNotebookSession({ notebookId, getEditorContent });

  // Expose userId and userRole for synchronization attribution (identifies client state and role)
  // Must be in useEffect to avoid mutating external state during render (React Compiler rule)
  useEffect(() => {
    (globalThis as Record<string, unknown>).__userId = userId;
    (globalThis as Record<string, unknown>).__userRole = userRole;
    (globalThis as Record<string, unknown>).__studentId = studentId;
    (globalThis as Record<string, unknown>).__notebookId = notebookId;
  }, [userId, userRole, studentId, notebookId]);

  // 3. Video Call Logic
  // Students: listen for incoming calls via Firestore onSnapshot (scoped to this page only)
  // Teachers: this hook is a no-op (enabled = false)
  useStudentCallListener(userId, userRole === "student");
  const { callState } = useCallStore();

  // 4. Image Upload Handler
  const handleNotebookImageUpload = useCallback(
    async (file: File, onProgress?: (event: { progress: number }) => void) => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `notebooks/${notebookId}/${userId}/${fileName}`;
      const storageRef = ref(storage, filePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({ progress });
          },
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await registerNotebookAssetAction({
              notebookId,
              filePath,
              fileName,
              contentType: file.type,
              sizeBytes: file.size,
            });

            resolve(downloadURL);
          },
        );
      });
    },
    [notebookId, userId],
  );

  // 5. Editor Instance
  const editor = useEditor(
    {
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
      onUpdate: ({ editor }) => {
        editorRef.current = editor;
      },
      onCreate: ({ editor }) => {
        editorRef.current = editor;
      },

      extensions: [
        StarterKit.configure({
          undoRedo: false, 
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
          upload: handleNotebookImageUpload,
        }),
        ...(ydoc
          ? [Collaboration.configure({ document: ydoc, field: "content" })]
          : []),
        ...(awareness
          ? [
              CollaborationCaret.configure({
                provider: { awareness },
                user: { name: userName, color: userColor, uid: userId, photoUrl: user.photoUrl },
              }),
            ]
          : []),
        YouTubeSyncNode,
        LyricsSyncNode,
        QuizNode,
        AudioSyncNode,
        SpeakingRecorderNode,
        TableKit.configure({
          table: {
            resizable: true,
          },
        }),
        TextStyle,
        Color,
      ],
    },
    [ydoc, awareness],
  );

  // 6. UI Helpers
  const toolbarRect = useRefRect(toolbarRef);
  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRect.height,
  });

  const backHref =
    userRole === "teacher"
      ? `/hub/teacher/students/${studentId}`
      : `/hub/student/notebook`;

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <NotebookToolbar
          toolbarRef={toolbarRef}
          backHref={backHref}
          cursorY={rect.y}
          user={user}
          awareness={awareness}
          studentId={studentId}
        />

        <NotebookBubbleMenu editor={editor} />

        <EditorContent
          key={ydoc ? "collab" : "solo"}
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>

      <FloatCallButton
        studentId={studentId}
        notebookId={notebookId}
        userRole={userRole}
      />

      {callState && (
        <VideoCall
          userId={userId}
          userName={userName}
          userRole={userRole}
          userPhotoUrl={userPhotoUrl}
          studentId={studentId}
          notebookId={notebookId}
        />
      )}
    </div>
  );
}

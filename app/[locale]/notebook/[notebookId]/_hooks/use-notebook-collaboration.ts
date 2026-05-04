"use client";

import { useEffect, useMemo } from "react";
import * as Y from "yjs";
import { FirestoreProvider } from "@gmcfall/yjs-firestore-provider";
import { app } from "@/lib/firebase";

export function useNotebookCollaboration(notebookId: string) {
  const { ydoc, provider } = useMemo(() => {
    const doc = new Y.Doc();
    const basePath = ["Notebooks", notebookId];
    const newProvider = new FirestoreProvider(app, doc, basePath);
    return { ydoc: doc, provider: newProvider };
  }, [notebookId]);

  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [ydoc, provider]);

  return { ydoc, provider };
}

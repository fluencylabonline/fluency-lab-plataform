"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { FirestoreProvider } from "@gmcfall/yjs-firestore-provider";
import { app } from "@/lib/firebase";

export function useNotebookCollaboration(notebookId: string) {
  const [collaboration, setCollaboration] = useState<{
    ydoc: Y.Doc;
    provider: FirestoreProvider;
  } | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new FirestoreProvider(app, doc, ["Notebooks", notebookId]);
    
    // Using queueMicrotask to avoid synchronous setState warning and cascading renders
    queueMicrotask(() => {
      setCollaboration({ ydoc: doc, provider });
    });

    return () => {
      provider.destroy();
      doc.destroy();
      setCollaboration(null);
    };
  }, [notebookId]);

  return { 
    ydoc: collaboration?.ydoc ?? null, 
    provider: collaboration?.provider ?? null 
  };
}

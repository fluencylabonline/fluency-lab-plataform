"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { rtdb } from "@/lib/firebase";
import { RealtimeDatabaseProvider, type AwarenessUser } from "@/lib/y-rtdb-provider";

interface NotebookCollaborationOptions {
  notebookId: string;
  uid: string;
  user: AwarenessUser;
}

interface CollaborationState {
  ydoc: Y.Doc;
  provider: RealtimeDatabaseProvider;
}

/**
 * Manages Yjs collaborative editing state for a notebook via RTDB.
 *
 * Replaces the previous @gmcfall/yjs-firestore-provider with a custom
 * RealtimeDatabaseProvider that uses WebSockets natively (lower latency)
 * and is billed per bandwidth instead of per-operation (lower cost).
 *
 * The provider is destroyed on unmount, which also removes the user's
 * cursor from RTDB via onDisconnect() — preventing ghost cursors.
 */
export function useNotebookCollaboration({
  notebookId,
  uid,
  user,
}: NotebookCollaborationOptions) {
  const [collaboration, setCollaboration] = useState<CollaborationState | null>(null);

  useEffect(() => {
    if (!notebookId || !uid) return;

    const doc = new Y.Doc();
    const provider = new RealtimeDatabaseProvider(rtdb, doc, notebookId, uid);

    // Publish local user's cursor info to all other participants
    provider.setUser(user);

    // Use queueMicrotask to avoid synchronous setState warning during render
    queueMicrotask(() => {
      setCollaboration({ ydoc: doc, provider });
    });

    return () => {
      provider.destroy();
      doc.destroy();
      setCollaboration(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId, uid]);

  return {
    ydoc: collaboration?.ydoc ?? null,
    provider: collaboration?.provider ?? null,
    awareness: collaboration?.provider.awareness ?? null,
  };
}

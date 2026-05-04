"use client";

import { useEffect, useRef } from "react";
import { 
  startNotebookSessionAction, 
  heartbeatNotebookSessionAction, 
  endNotebookSessionAction 
} from "@/modules/notebook/notebook.actions";

interface UseNotebookSessionProps {
  notebookId: string;
  getEditorContent: () => string | undefined;
}

export function useNotebookSession({ notebookId, getEditorContent }: UseNotebookSessionProps) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const startSession = async () => {
      const result = await startNotebookSessionAction({ notebookId });
      if (result?.data?.sessionId) {
        sessionIdRef.current = result.data.sessionId;
        
        heartbeatInterval = setInterval(async () => {
          if (sessionIdRef.current) {
            await heartbeatNotebookSessionAction({ sessionId: sessionIdRef.current });
          }
        }, 30000);
      }
    };

    startSession();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (sessionIdRef.current) {
        const content = getEditorContent();
        endNotebookSessionAction({ sessionId: sessionIdRef.current, content });
      }
    };
  }, [notebookId, getEditorContent]);
}

"use client";

/**
 * YoutubeSyncToolbarButton.tsx
 *
 * Botão para a toolbar do Tiptap que insere o YouTubeSyncNode.
 * Uso:
 *   <YoutubeSyncToolbarButton editor={editor} />
 */

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { extractYouTubeId } from "./YoutubeSyncView";

interface Props {
  editor: Editor | null;
}

export function YoutubeSyncToolbarButton({ editor }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleInsert = () => {
    if (!editor) return;
    const trimmed = url.trim();
    if (!extractYouTubeId(trimmed)) {
      setError("Cole uma URL válida do YouTube.");
      return;
    }
    editor.chain().focus().insertYouTubeSync({ url: trimmed }).run();
    setUrl("");
    setError("");
    setOpen(false);
  };

  const handleInsertEmpty = () => {
    if (!editor) return;
    editor.chain().focus().insertYouTubeSync().run();
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Inserir YouTube sincronizado"
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          background: open ? "#f3f4f6" : "#fff",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7L8 5z" />
        </svg>
        YouTube
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 16,
            width: 320,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500 }}>
            Inserir YouTube sincronizado
          </p>

          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleInsert()}
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: 7,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ color: "#dc2626", fontSize: 12, margin: "6px 0 0" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={handleInsert}
              disabled={!url.trim()}
              style={{
                flex: 1,
                padding: "7px 0",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                cursor: url.trim() ? "pointer" : "not-allowed",
                opacity: url.trim() ? 1 : 0.5,
              }}
            >
              Inserir com URL
            </button>
            <button
              onClick={handleInsertEmpty}
              style={{
                padding: "7px 12px",
                background: "#f9fafb",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: 7,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Inserir vazio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

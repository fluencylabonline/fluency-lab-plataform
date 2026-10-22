"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { AudioSyncVault } from "@/components/tiptap-extension/audio-sync/AudioSyncVault";

/**
 * Botão da barra do editor de lições: abre a biblioteca de áudios (escolher um existente ou enviar um novo,
 * com título, idioma, nível e transcrição) e insere o player de áudio no ponto do cursor.
 * Precisa estar dentro do EditorContext, porque o vault insere o nó no editor atual.
 */
export function AudioInsertButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Inserir áudio"
        tooltip="Inserir áudio"
        onClick={() => setOpen(true)}
      >
        <Music className="tiptap-button-icon" />
      </Button>
      <AudioSyncVault open={open} onOpenChange={setOpen} />
    </>
  );
}

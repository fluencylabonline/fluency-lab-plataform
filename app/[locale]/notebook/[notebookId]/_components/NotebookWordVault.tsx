"use client";

import { Languages } from "lucide-react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody
} from "@/components/ui/vault";

interface WordInfo {
  word: string;
  definition: string;
  synonyms: string[];
  examples: string[];
  language: string;
}

interface NotebookWordVaultProps {
  wordInfo: WordInfo | null;
  onClose: () => void;
}

export function NotebookWordVault({ wordInfo, onClose }: NotebookWordVaultProps) {
  return (
    <Vault open={!!wordInfo} onOpenChange={(open) => !open && onClose()}>
      <VaultContent showHandle>
        <VaultHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {wordInfo?.language}
              </span>
            </div>
          </div>
          <VaultTitle className="text-left text-3xl font-extrabold capitalize tracking-tight mt-2 text-foreground">
            {wordInfo?.word}
          </VaultTitle>
          <VaultDescription className="text-left text-sm text-muted-foreground mt-1">
            Significado e detalhes da palavra selecionada
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-6 pt-4 pb-2">
          {/* Definição */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Definição
            </h4>
            <p className="text-base text-foreground font-medium leading-relaxed bg-muted/40 p-4 rounded-xl border border-border/50">
              {wordInfo?.definition}
            </p>
          </div>

          {/* Exemplos */}
          {wordInfo?.examples && wordInfo.examples.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Exemplos de uso
              </h4>
              <div className="space-y-2">
                {wordInfo.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="text-sm italic text-foreground bg-accent/30 p-3 rounded-lg border border-border/30 relative pl-6 before:content-['“'] before:absolute before:left-2 before:top-2 before:text-2xl before:text-primary/40 before:font-serif"
                  >
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sinônimos */}
          {wordInfo?.synonyms && wordInfo.synonyms.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sinônimos
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {wordInfo.synonyms.map((syn, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border bg-popover text-foreground capitalize hover:bg-accent/50 transition-colors cursor-default"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            </div>
          )}
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
